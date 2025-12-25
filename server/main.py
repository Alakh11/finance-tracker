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

# CORS: Allow both localhost and your Vercel domain
origins = [
    "http://localhost:5173",
    "https://alakh-finance.vercel.app",
    "https://finance-tracker-gamma-ten-67.vercel.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Keep * for testing, restrict to 'origins' later
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
            ssl_verify_cert=True,
            ssl_verify_identity=True
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
        # 1. Find Category ID (Logic: If category exists, get ID. If not, use 'General')
        cursor.execute("SELECT id FROM categories WHERE name = %s AND user_email = %s", (tx.category, tx.user_email))
        result = cursor.fetchone()
        
        cat_id = result[0] if result else 1 # Default to 1 if not found. Ideally, handle this better.

        query = """
        INSERT INTO transactions 
        (user_email, amount, type, category_id, payment_mode, date, note) 
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(query, (tx.user_email, tx.amount, tx.type, cat_id, tx.payment_mode, tx.date, tx.note))
        conn.commit()
        return {"message": "Transaction Saved"}
    except Exception as e:
        logger.error(f"Error adding transaction: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.get("/dashboard/{email}")
def get_dashboard(email: str):
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        
        # 1. Totals
        cursor.execute("""
            SELECT type, SUM(amount) as total 
            FROM transactions WHERE user_email = %s GROUP BY type
        """, (email,))
        totals = cursor.fetchall()
        
        # 2. Recent Transactions (Join with Categories to get the Name)
        # Note: We use LEFT JOIN so we still see transactions even if category is missing
        query = """
            SELECT t.id, t.amount, t.type, t.date, t.note, t.payment_mode, c.name as category
            FROM transactions t
            LEFT JOIN categories c ON t.category_id = c.id
            WHERE t.user_email = %s 
            ORDER BY t.date DESC LIMIT 5
        """
        cursor.execute(query, (email,))
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
        
        # Ensure default categories exist for this user
        defaults = [('Food', '#EF4444'), ('Travel', '#F59E0B'), ('Rent', '#6366F1'), ('Shopping', '#EC4899'), ('Bills', '#10B981')]
        for name, color in defaults:
            try:
                cursor.execute("INSERT IGNORE INTO categories (user_email, name, color) VALUES (%s, %s, %s)", (email, name, color))
            except:
                pass
        conn.commit()

        # Get Budget + Spent
        query = """
        SELECT 
            c.name, 
            c.budget_limit, 
            c.color,
            COALESCE(SUM(t.amount), 0) as spent
        FROM categories c
        LEFT JOIN transactions t 
            ON c.id = t.category_id 
            AND t.type = 'expense'
            AND MONTH(t.date) = MONTH(CURRENT_DATE()) 
            AND YEAR(t.date) = YEAR(CURRENT_DATE())
        WHERE c.user_email = %s
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