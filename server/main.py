from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
import mysql.connector
import os
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta
import random
import logging

# Setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
load_dotenv()

app = FastAPI()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = "YOUR_SUPER_SECRET_KEY" # Change this!
ALGORITHM = "HS256"

# CORS
origins = [
    "http://localhost:5173",
    "https://alakh-finance.onrender.com",
    "https://alakh11.github.io"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Database Connection ---
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
        logger.error(f"DB Error: {e}")
        raise HTTPException(status_code=500, detail="Database Connection Failed")

# --- Initialize Tables on Startup ---
@app.on_event("startup")
def init_db():
    try:
        conn = get_db()
        cursor = conn.cursor()
    
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS budgets (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_email VARCHAR(255) NOT NULL,
                category_id INT NOT NULL,
                amount DECIMAL(10, 2) NOT NULL,
                UNIQUE KEY unique_budget (user_email, category_id)
            )
        """)
        
        # Goals Table (Ensure this exists)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS goals (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_email VARCHAR(255) NOT NULL,
                name VARCHAR(255) NOT NULL,
                target_amount DECIMAL(10, 2) NOT NULL,
                current_amount DECIMAL(10, 2) DEFAULT 0,
                deadline DATE
            )
        """)
        
        conn.commit()
        conn.close()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Init DB Error: {e}")

# --- Auth Models ---
class UserRegister(BaseModel):
    name: str
    contact: str # Email or Mobile
    password: str
    contact_type: str # 'email' or 'mobile'

class UserLogin(BaseModel):
    contact: str
    password: str

class VerifyOTP(BaseModel):
    contact: str
    otp: str
    
class GoogleAuth(BaseModel):
    email: str
    name: str
    picture: Optional[str] = None
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

class BudgetSchema(BaseModel):
    user_email: str
    category_id: int
    amount: float

# --- Helper Functions ---
def create_access_token(data: dict):
    to_encode = data.copy()
    to_encode.update({"exp": datetime.utcnow() + timedelta(days=7)})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def send_otp_mock(contact: str):
    otp = str(random.randint(100000, 999999))
    logger.info(f"🔑 MOCK OTP for {contact}: {otp}") # View this in Render Logs!
    return otp

@app.api_route("/", methods=["GET", "HEAD"])
def health_check():
    return {"status": "ok", "message": "API is running"}

# ================= AUTH ENDPOINTS =================

@app.post("/auth/register")
def register(user: UserRegister):
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    try:
        # Check existing
        field = "email" if user.contact_type == 'email' else "mobile"
        cursor.execute(f"SELECT * FROM users WHERE {field} = %s", (user.contact,))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="User already exists")

        # 1. Generate OTP
        otp = send_otp_mock(user.contact)
        expiry = datetime.utcnow() + timedelta(minutes=10)
        
        cursor.execute("INSERT INTO otps (identifier, otp_code, expires_at) VALUES (%s, %s, %s)", (user.contact, otp, expiry))
        
        # 2. Hash Password
        hashed_pw = pwd_context.hash(user.password)
        
        # 3. Create unverified user
        query = f"INSERT INTO users (name, {field}, password_hash, is_verified) VALUES (%s, %s, %s, FALSE)"
        cursor.execute(query, (user.name, user.contact, hashed_pw))
        
        conn.commit()
        return {"message": "OTP sent", "contact": user.contact}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.post("/auth/verify")
def verify_otp(data: VerifyOTP):
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    try:
        # Check OTP
        cursor.execute("SELECT * FROM otps WHERE identifier = %s AND otp_code = %s AND expires_at > NOW()", (data.contact, data.otp))
        if not cursor.fetchone():
            raise HTTPException(status_code=400, detail="Invalid or Expired OTP")
            
        # Mark User Verified
        is_email = "@" in data.contact
        field = "email" if is_email else "mobile"
        
        cursor.execute(f"UPDATE users SET is_verified = TRUE WHERE {field} = %s", (data.contact,))
        
        # Get User Data for Token
        cursor.execute(f"SELECT * FROM users WHERE {field} = %s", (data.contact,))
        user_db = cursor.fetchone()
        
        # Generate Token
        token = create_access_token({"sub": user_db['email'] or user_db['mobile'], "name": user_db['name']})
        
        # Cleanup OTP
        cursor.execute("DELETE FROM otps WHERE identifier = %s", (data.contact,))
        conn.commit()
        
        return {"token": token, "user": {"name": user_db['name'], "email": user_db['email'] or user_db['mobile'], "picture": ""}}
        
    finally:
        conn.close()

@app.post("/auth/login")
def login(data: UserLogin):
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    try:
        is_email = "@" in data.contact
        field = "email" if is_email else "mobile"
        
        cursor.execute(f"SELECT * FROM users WHERE {field} = %s", (data.contact,))
        user = cursor.fetchone()
        
        if not user or not pwd_context.verify(data.password, user['password_hash']):
            raise HTTPException(status_code=400, detail="Invalid credentials")
            
        if not user['is_verified']:
            raise HTTPException(status_code=400, detail="Account not verified. Please register again.")

        token = create_access_token({"sub": user['email'] or user['mobile'], "name": user['name']})
        return {"token": token, "user": {"name": user['name'], "email": user['email'] or user['mobile'], "picture": user['profile_pic'] or ""}}
    finally:
        conn.close()
        
@app.post("/auth/google")
def google_login(data: GoogleAuth):
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    try:
        # 1. Check if user exists by email
        cursor.execute("SELECT * FROM users WHERE email = %s", (data.email,))
        user = cursor.fetchone()
        if not user:
            cursor.execute("INSERT INTO users (name, email, profile_pic, is_verified) VALUES (%s, %s, %s, TRUE)", (data.name, data.email, data.picture))
            conn.commit()
            
            # Fetch the new ID
            cursor.execute("SELECT * FROM users WHERE email = %s", (data.email,))
            user = cursor.fetchone()
            
        # 3. Generate App Token (Same as standard login)
        token = create_access_token({"sub": user['email'], "name": user['name']})
        return {"token": token, "user": {"name": user['name'], "email": user['email'], "picture": user['profile_pic']}}
    except Exception as e:
        logger.error(f"Google Login Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# ================= TRANSACTION ENDPOINTS =================

@app.post("/transactions")
def add_transaction(tx: TransactionCreate):
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id FROM categories WHERE name = %s AND user_email = %s AND type = %s", (tx.category, tx.user_email, tx.type))
        result = cursor.fetchone()
        if not result:
             cursor.execute("SELECT id FROM categories WHERE user_email = %s AND type = %s LIMIT 1", (tx.user_email, tx.type))
             result = cursor.fetchone()
        cat_id = result[0] if result else 1

        query = "INSERT INTO transactions (user_email, amount, type, category_id, payment_mode, date, note, is_recurring) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)"
        cursor.execute(query, (tx.user_email, tx.amount, tx.type, cat_id, tx.payment_mode, tx.date, tx.note, tx.is_recurring))
        conn.commit()
        return {"message": "Transaction Saved"}
    except Exception as e:
        logger.error(f"Error adding transaction: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.get("/transactions/all/{email}")
def get_all_transactions(
    email: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    category_id: Optional[int] = None,
    min_amount: Optional[float] = None,
    max_amount: Optional[float] = None,
    search: Optional[str] = None
):
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        
        query = """
            SELECT t.*, c.name as category_name 
            FROM transactions t 
            LEFT JOIN categories c ON t.category_id = c.id 
            WHERE t.user_email = %s
        """
        params = [email]

        if start_date:
            query += " AND t.date >= %s"
            params.append(start_date)
        if end_date:
            query += " AND t.date <= %s"
            params.append(end_date)
        if category_id:
            query += " AND t.category_id = %s"
            params.append(category_id)
        if min_amount is not None:
            query += " AND t.amount >= %s"
            params.append(min_amount)
        if max_amount is not None:
            query += " AND t.amount <= %s"
            params.append(max_amount)
        if search:
            search_text = f"%{search.lower()}%"
            search_amount_clean = search.replace(",", "")
            search_amount = f"%{search_amount_clean}%"
            query += " AND (LOWER(t.note) LIKE %s OR t.amount LIKE %s OR LOWER(t.type) LIKE %s)"
            params.extend([search_text, search_amount, search_text])

        query += " ORDER BY t.date DESC"

        cursor.execute(query, params)
        transactions = cursor.fetchall()
        conn.close()
        return transactions
    except Exception as e:
        logger.error(f"Filter Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/transactions/{id}")
def delete_transaction(id: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM transactions WHERE id = %s", (id,))
    conn.commit()
    conn.close()
    return {"message": "Deleted"}

# ================= CATEGORY ENDPOINTS =================

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
        cursor.execute("INSERT INTO categories (user_email, name, color, type, is_default) VALUES (%s, %s, %s, %s, FALSE)", (cat.user_email, cat.name, cat.color, cat.type))
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
        cursor.execute("DELETE FROM transactions WHERE category_id = %s", (id,))
        cursor.execute("DELETE FROM categories WHERE id = %s", (id,))
        conn.commit()
        return {"message": "Category deleted"}
    finally:
        conn.close()

# ================= BUDGET ENDPOINTS (FIXED) =================

@app.post("/budgets")
def set_budget(budget: BudgetSchema):
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO budgets (user_email, category_id, amount)
            VALUES (%s, %s, %s)
            ON DUPLICATE KEY UPDATE amount = %s
        """, (budget.user_email, budget.category_id, budget.amount, budget.amount))
        conn.commit()
        conn.close()
        return {"message": "Budget saved"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/budgets/{email}")
def get_budgets_status(email: str):
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        
        # 1. Seed Defaults
        defaults = [('Food', '#EF4444', 'expense'), ('Travel', '#F59E0B', 'expense'), 
                    ('Rent', '#6366F1', 'expense'), ('Bills', '#10B981', 'expense'),
                    ('Shopping', '#EC4899', 'expense'), ('Salary', '#10B981', 'income')]
        for name, color, ctype in defaults:
            try:
                cursor.execute("INSERT IGNORE INTO categories (user_email, name, color, type, is_default) VALUES (%s, %s, %s, %s, TRUE)", (email, name, color, ctype))
            except: pass
        conn.commit()

        # 2. Smart Query: Categories + Budgets + Spent (Current Month)
        query = """
            SELECT 
                c.id as category_id, 
                c.name, 
                c.color,
                COALESCE(b.amount, 0) as budget_limit,
                COALESCE(SUM(t.amount), 0) as spent
            FROM categories c
            LEFT JOIN budgets b ON c.id = b.category_id AND b.user_email = %s
            LEFT JOIN transactions t ON c.id = t.category_id 
                 AND t.user_email = %s 
                 AND t.type = 'expense'
                 AND DATE_FORMAT(t.date, '%%Y-%%m') = DATE_FORMAT(NOW(), '%%Y-%%m')
            WHERE (c.user_email = %s OR c.user_email IS NULL) AND c.type = 'expense'
            GROUP BY c.id, c.name, c.color, b.amount
        """
        cursor.execute(query, (email, email, email))
        budgets = cursor.fetchall()
        
        # 3. Add Icons & Calculate Stats in Python
        icon_map = {
            'Food': '🍔', 'Travel': '✈️', 'Rent': '🏠', 'Bills': '🧾', 
            'Shopping': '🛍️', 'Salary': '💰', 'Health': '🏥', 'Entertainment': '🎬'
        }

        for b in budgets:
            # Assign icon based on name (default to Tag icon)
            b['icon'] = icon_map.get(b['name'], '🏷️')
            
            b['percentage'] = (b['spent'] / b['budget_limit'] * 100) if b['budget_limit'] > 0 else 0
            b['is_over'] = b['spent'] > b['budget_limit'] and b['budget_limit'] > 0
            
        conn.close()
        return budgets
    except Exception as e:
        logger.error(f"Budget Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
@app.get("/budgets/history/{email}")
def get_budget_history(email: str):
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        
        # 1. Fetch Raw Data (Python aggregation fix)
        query = """
            SELECT date, amount
            FROM transactions 
            WHERE user_email = %s 
              AND type = 'expense'
              AND date >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
            ORDER BY date ASC
        """
        cursor.execute(query, (email,))
        transactions = cursor.fetchall()
        
        # 2. Get Budget Limit
        cursor.execute("SELECT SUM(amount) as total_limit FROM budgets WHERE user_email = %s", (email,))
        limit_row = cursor.fetchone()
        total_limit = float(limit_row['total_limit']) if limit_row and limit_row['total_limit'] else 0
        
        conn.close()

        # 3. Process in Python
        history_map = {}
        today = datetime.today()
        
        for i in range(5, -1, -1):
            d = today - timedelta(days=i*30)
            key = d.strftime('%Y-%m')
            name = d.strftime('%b')
            history_map[key] = {"month": name, "total_spent": 0, "budget_limit": total_limit}

        for t in transactions:
            date_obj = t['date']
            if isinstance(date_obj, str):
                date_obj = datetime.strptime(date_obj, '%Y-%m-%d')
            key = date_obj.strftime('%Y-%m')
            if key in history_map:
                history_map[key]['total_spent'] += float(t['amount'])

        final_history = sorted(history_map.values(), key=lambda x: list(history_map.keys())[list(history_map.values()).index(x)])
        return list(final_history)
    except Exception as e:
        print(f"HISTORY ERROR: {e}") 
        raise HTTPException(status_code=500, detail=str(e))

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

# ================= DASHBOARD & ANALYTICS =================

@app.get("/dashboard/{email}")
def get_dashboard(email: str):
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT type, SUM(amount) as total FROM transactions WHERE user_email = %s GROUP BY type", (email,))
        totals = cursor.fetchall()
        
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
            SELECT DATE_FORMAT(date, '%b') as name, 
                SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
                SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense
            FROM transactions WHERE user_email = %s 
            GROUP BY YEAR(date), MONTH(date), DATE_FORMAT(date, '%b')
            ORDER BY YEAR(date), MONTH(date) LIMIT 6
        """, (email,))
        bar_data = cursor.fetchall()
        conn.close()
        return {"pie": pie_data, "bar": bar_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/recurring/{email}")
def get_recurring(email: str):
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT t.*, c.name as category FROM transactions t LEFT JOIN categories c ON t.category_id = c.id WHERE t.user_email = %s AND t.is_recurring = TRUE", (email,))
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

@app.get("/income/daily/{email}")
def get_daily_income(email: str):
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT date, SUM(amount) as total FROM transactions WHERE user_email = %s AND type = 'income' GROUP BY date ORDER BY date DESC LIMIT 30", (email,))
        data = cursor.fetchall()
        conn.close()
        return data
    except Exception as e:
        logger.error(f"Daily Income Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/income/monthly/{email}")
def get_monthly_income(email: str):
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT DATE_FORMAT(MIN(date), '%Y-%m') as month_year, DATE_FORMAT(MIN(date), '%M %Y') as display_name, SUM(amount) as total
            FROM transactions WHERE user_email = %s AND type = 'income'
            GROUP BY YEAR(date), MONTH(date) ORDER BY YEAR(date) DESC, MONTH(date) DESC LIMIT 12
        """, (email,))
        data = cursor.fetchall()
        conn.close()
        return data
    except Exception as e:
        logger.error(f"Monthly Income Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/analytics/category-monthly/{email}")
def get_category_monthly_analytics(email: str):
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT DATE_FORMAT(MIN(t.date), '%b %Y') as month, c.name as category, SUM(t.amount) as total
            FROM transactions t JOIN categories c ON t.category_id = c.id
            WHERE t.user_email = %s AND t.type = 'expense'
            GROUP BY YEAR(t.date), MONTH(t.date), c.name ORDER BY YEAR(t.date), MONTH(t.date)
        """, (email,))
        data = cursor.fetchall()
        conn.close()
        return data
    except Exception as e:
        logger.error(f"Category Monthly Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ================= STARTUP (REQUIRED FOR RENDER) =================
if __name__ == "__main__":
    import uvicorn
    # Render provides PORT, default to 10000 for local dev
    port = int(os.environ.get("PORT", 10000))
    # Host MUST be 0.0.0.0
    uvicorn.run(app, host="0.0.0.0", port=port)