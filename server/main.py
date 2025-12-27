from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
import mysql.connector
import os
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
import logging

# Setup Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()
app = FastAPI()

# CORS: Allow both localhost and your Vercel domains
origins = [
    "http://localhost:5173",
    "https://alakh-finance.vercel.app",
    "https://finance-tracker-gamma-ten-67.vercel.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    try:
        return mysql.connector.connect(
            host=os.getenv("DB_HOST"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            port=os.getenv("DB_PORT"),
            database=os.getenv("DB_NAME"),
            ssl_verify_cert=False,
            ssl_verify_identity=False
        )
    except Exception as e:
        logger.error(f"Database Connection Failed: {e}")
        raise HTTPException(status_code=500, detail="Database Connection Failed")

# --- Data Models ---
class TransactionCreate(BaseModel):
    user_email: str
    amount: float
    type: str
    category: str
    date: str
    payment_mode: str
    note: Optional[str] = None
    is_recurring: bool = False

class CategoryCreate(BaseModel):
    user_email: str
    name: str
    color: str
    type: str # 'income' or 'expense'

class GoalCreate(BaseModel):
    user_email: str
    name: str
    target_amount: float
    deadline: Optional[str] = None

class GoalUpdate(BaseModel):
    goal_id: int
    amount_added: float

class BudgetUpdate(BaseModel):
    user_email: str
    category_name: str
    limit: float

# --- Endpoints ---

@app.get("/")
def health_check():
    return {"status": "ok", "message": "API is running"}

@app.post("/transactions")
def add_transaction(tx: TransactionCreate):
    conn = get_db()
    cursor = conn.cursor()
    try:
        # 1. Smart Category Lookup: Find ID by Name AND Type
        cursor.execute(
            "SELECT id FROM categories WHERE name = %s AND user_email = %s AND type = %s", 
            (tx.category, tx.user_email, tx.type)
        )
        result = cursor.fetchone()
        
        # Fallback: If not found, grab the first available category of that type
        if not result:
             cursor.execute("SELECT id FROM categories WHERE user_email = %s AND type = %s LIMIT 1", (tx.user_email, tx.type))
             result = cursor.fetchone()
        
        cat_id = result[0] if result else 1

        query = """
        INSERT INTO transactions 
        (user_email, amount, type, category_id, payment_mode, date, note, is_recurring) 
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(query, (tx.user_email, tx.amount, tx.type, cat_id, tx.payment_mode, tx.date, tx.note, tx.is_recurring))
        conn.commit()
        return {"message": "Transaction Saved"}
    except Exception as e:
        logger.error(f"Error adding transaction: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.delete("/transactions/{id}")
def delete_transaction(id: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM transactions WHERE id = %s", (id,))
    conn.commit()
    conn.close()
    return {"message": "Deleted"}

@app.get("/categories/{email}")
def get_categories(email: str):
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM categories WHERE user_email = %s", (email,))
    data = cursor.fetchall()
    conn.close()
    return data

@app.post("/categories")
def add_category(cat: CategoryCreate):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO categories (user_email, name, color, type, is_default) VALUES (%s, %s, %s, %s, FALSE)",
            (cat.user_email, cat.name, cat.color, cat.type)
        )
        conn.commit()
        return {"message": "Category created"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.delete("/categories/{id}")
def delete_category(id: int):
    conn = get_db()
    cursor = conn.cursor()
    try:
        # Delete related transactions first to verify safety
        cursor.execute("DELETE FROM transactions WHERE category_id = %s", (id,))
        cursor.execute("DELETE FROM categories WHERE id = %s", (id,))
        conn.commit()
        return {"message": "Category deleted"}
    finally:
        conn.close()

@app.get("/dashboard/{email}")
def get_dashboard(email: str):
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        
        # Totals
        cursor.execute("""
            SELECT type, SUM(amount) as total 
            FROM transactions WHERE user_email = %s GROUP BY type
        """, (email,))
        totals = cursor.fetchall()
        
        # Recent (With Category Name)
        cursor.execute("""
            SELECT t.id, t.amount, t.type, t.date, t.note, t.payment_mode, c.name as category
            FROM transactions t
            LEFT JOIN categories c ON t.category_id = c.id
            WHERE t.user_email = %s 
            ORDER BY t.date DESC LIMIT 5
        """, (email,))
        recent = cursor.fetchall()
        
        conn.close()
        return {"totals": totals, "recent": recent}
    except Exception as e:
        logger.error(f"Dashboard Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/budgets/{email}")
def get_budgets(email: str):
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        
        # Seed Defaults (Includes Income types now)
        defaults = [
            ('Food', '#EF4444', 'expense'), 
            ('Travel', '#F59E0B', 'expense'), 
            ('Rent', '#6366F1', 'expense'), 
            ('Bills', '#10B981', 'expense'),
            ('Shopping', '#EC4899', 'expense'),
            ('Salary', '#10B981', 'income')
        ]
        for name, color, ctype in defaults:
            try:
                cursor.execute(
                    "INSERT IGNORE INTO categories (user_email, name, color, type, is_default) VALUES (%s, %s, %s, %s, TRUE)", 
                    (email, name, color, ctype)
                )
            except: pass
        conn.commit()

        # Get Budget + Spent (Only for Expenses)
        query = """
        SELECT 
            c.name, c.budget_limit, c.color, c.type, c.id,
            COALESCE(SUM(t.amount), 0) as spent
        FROM categories c
        LEFT JOIN transactions t 
            ON c.id = t.category_id 
            AND t.type = 'expense'
            AND MONTH(t.date) = MONTH(CURRENT_DATE()) 
            AND YEAR(t.date) = YEAR(CURRENT_DATE())
        WHERE c.user_email = %s AND c.type = 'expense'
        GROUP BY c.id, c.name, c.budget_limit, c.color
        """
        cursor.execute(query, (email,))
        results = cursor.fetchall()
        conn.close()
        return results
    except Exception as e:
        logger.error(f"Budget Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/budgets")
def update_budget(data: BudgetUpdate):
    try:
        conn = get_db()
        cursor = conn.cursor()
        query = "UPDATE categories SET budget_limit = %s WHERE user_email = %s AND name = %s"
        cursor.execute(query, (data.limit, data.user_email, data.category_name))
        conn.commit()
        conn.close()
        return {"message": "Budget updated"}
    except Exception as e:
        logger.error(f"Update Budget Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/analytics/{email}")
def get_analytics(email: str):
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute("""
            SELECT c.name, SUM(t.amount) as value 
            FROM transactions t
            JOIN categories c ON t.category_id = c.id
            WHERE t.user_email = %s AND t.type = 'expense'
            GROUP BY c.name
        """, (email,))
        pie_data = cursor.fetchall()
        
        cursor.execute("""
            SELECT 
                DATE_FORMAT(date, '%b') as name, 
                SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
                SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
            FROM transactions 
            WHERE user_email = %s 
            GROUP BY YEAR(date), MONTH(date), DATE_FORMAT(date, '%b')
            ORDER BY YEAR(date), MONTH(date)
            LIMIT 6
        """, (email,))
        bar_data = cursor.fetchall()
        
        conn.close()
        return {"pie": pie_data, "bar": bar_data}
    except Exception as e:
        logger.error(f"Analytics Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/transactions/all/{email}")
def get_all_transactions(email: str):
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT t.id, t.amount, t.type, t.date, t.note, t.payment_mode, c.name as category 
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE t.user_email = %s 
        ORDER BY t.date DESC
    """, (email,))
    data = cursor.fetchall()
    conn.close()
    return data

@app.get("/goals/{email}")
def get_goals(email: str):
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM goals WHERE user_email = %s", (email,))
    data = cursor.fetchall()
    conn.close()
    return data

@app.post("/goals")
def add_goal(goal: GoalCreate):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO goals (user_email, name, target_amount, deadline) VALUES (%s, %s, %s, %s)", (goal.user_email, goal.name, goal.target_amount, goal.deadline))
    conn.commit()
    conn.close()
    return {"message": "Goal added"}

@app.delete("/goals/{id}")
def delete_goal(id: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM goals WHERE id = %s", (id,))
    conn.commit()
    conn.close()
    return {"message": "Goal deleted"}

@app.put("/goals/add-money")
def add_money_to_goal(update: GoalUpdate):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE goals SET current_amount = current_amount + %s WHERE id = %s", (update.amount_added, update.goal_id))
    conn.commit()
    conn.close()
    return {"message": "Money added to goal"}

@app.get("/recurring/{email}")
def get_recurring(email: str):
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT t.*, c.name as category 
        FROM transactions t
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE t.user_email = %s AND t.is_recurring = TRUE
    """, (email,))
    data = cursor.fetchall()
    conn.close()
    return data

@app.delete("/recurring/stop/{id}")
def stop_recurring(id: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE transactions SET is_recurring = FALSE WHERE id = %s", (id,))
    conn.commit()
    conn.close()
    return {"message": "Recurring stopped"}