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
            CREATE TABLE IF NOT EXISTS loans (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_email VARCHAR(255) NOT NULL,
                name VARCHAR(255) NOT NULL,
                total_amount DECIMAL(15, 2) NOT NULL,
                interest_rate DECIMAL(5, 2) NOT NULL,
                tenure_months INT NOT NULL,
                start_date DATE NOT NULL,
                emi_amount DECIMAL(10, 2) NOT NULL
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
    icon: str

class CategoryUpdate(BaseModel):
    name: str
    color: str
    icon: str
    type: str

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

class LoanCreate(BaseModel):
    user_email: str
    name: str
    total_amount: float
    interest_rate: float
    tenure_months: int
    start_date: str

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
        cursor.execute(
            "INSERT INTO categories (user_email, name, color, type, icon, is_default) VALUES (%s, %s, %s, %s, %s, FALSE)", (cat.user_email, cat.name, cat.color, cat.type, cat.icon)
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
        cursor.execute("DELETE FROM transactions WHERE category_id = %s", (id,))
        cursor.execute("DELETE FROM categories WHERE id = %s", (id,))
        conn.commit()
        return {"message": "Category deleted"}
    finally:
        conn.close()

def update_category(id: int, cat: CategoryUpdate):
    conn = get_db()
    cursor = conn.cursor()
    try:
        # Check if exists
        cursor.execute("SELECT * FROM categories WHERE id = %s", (id,))
        if not cursor.fetchone():
             raise HTTPException(status_code=404, detail="Category not found")
             
        cursor.execute("""
            UPDATE categories 
            SET name = %s, color = %s, icon = %s, type = %s 
            WHERE id = %s
        """, (cat.name, cat.color, cat.icon, cat.type, id))
        conn.commit()
        return {"message": "Category updated"}
    except Exception as e:
        logger.error(f"Update Cat Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
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
        query = """
            SELECT 
                c.id as category_id, 
                c.name, 
                c.color,
                c.icon,
                COALESCE(b.amount, 0) as budget_limit,
                COALESCE(SUM(t.amount), 0) as spent
            FROM categories c
            LEFT JOIN budgets b ON c.id = b.category_id AND b.user_email = %s
            LEFT JOIN transactions t ON c.id = t.category_id 
                 AND t.user_email = %s 
                 AND t.type = 'expense'
                 AND DATE_FORMAT(t.date, '%%Y-%%m') = DATE_FORMAT(NOW(), '%%Y-%%m')
            WHERE (c.user_email = %s OR c.user_email IS NULL) AND c.type = 'expense'
            GROUP BY c.id, c.name, c.color, c.icon, b.amount
        """
        cursor.execute(query, (email, email, email))
        budgets = cursor.fetchall()

        for b in budgets:
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
    query = """
        SELECT 
            rt.*, 
            c.name as category,
            c.icon as category_icon,
            (
                SELECT MAX(t.date)
                FROM transactions t
                WHERE t.user_email = rt.user_email 
                AND t.note = rt.note
                AND t.id != rt.id 
            ) as last_paid
        FROM transactions rt
        LEFT JOIN categories c ON rt.category_id = c.id
        WHERE rt.user_email = %s AND rt.is_recurring = TRUE
    """
    cursor.execute(query, (email,))
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

@app.get("/predict/{email}")
def get_prediction(email: str):
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        
        # Fetch last 3 months of expenses
        cursor.execute("""
            SELECT 
                DATE_FORMAT(date, '%Y-%m') as month, 
                SUM(amount) as total
            FROM transactions 
            WHERE user_email = %s AND type = 'expense' 
            AND date >= DATE_SUB(NOW(), INTERVAL 3 MONTH)
            GROUP BY month ORDER BY month DESC
        """, (email,))
        data = cursor.fetchall()
        
        if not data:
            return {"predicted_spend": 0}

        # Weighted Average Logic (Recent months matter more)
        weights = [0.5, 0.3, 0.2] # 50% last month, 30% month before, 20% 3rd month
        prediction = 0
        total_weight = 0
        
        for i, record in enumerate(data):
            if i < len(weights):
                prediction += float(record['total']) * weights[i]
                total_weight += weights[i]
        
        final_prediction = prediction / total_weight if total_weight > 0 else 0
        
        conn.close()
        return {"predicted_spend": round(final_prediction, 2)}
    except Exception as e:
        logger.error(f"Prediction Error: {e}")
        return {"predicted_spend": 0}

# 2. SMART INSIGHTS
@app.get("/insights/{email}")
def get_insights(email: str):
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    
    # Compare This Month vs Last Month
    cursor.execute("""
        SELECT 
            DATE_FORMAT(date, '%Y-%m') as month,
            SUM(amount) as total
        FROM transactions 
        WHERE user_email = %s AND type = 'expense'
        AND date >= DATE_SUB(NOW(), INTERVAL 2 MONTH)
        GROUP BY month ORDER BY month DESC
    """, (email,))
    totals = cursor.fetchall()
    
    insights = []
    
    # 1. Spending Spike Insight
    if len(totals) >= 2:
        this_month = float(totals[0]['total'])
        last_month = float(totals[1]['total'])
        if this_month > last_month * 1.10: # 10% increase
            diff = int(((this_month - last_month) / last_month) * 100)
            insights.append({
                "type": "warning", 
                "text": f"You spent {diff}% more this month than last month.",
                "value": f"+{diff}%"
            })
        elif this_month < last_month * 0.9:
            diff = int(((last_month - this_month) / last_month) * 100)
            insights.append({
                "type": "success", 
                "text": f"Great job! Spending is down {diff}% compared to last month.",
                "value": f"-{diff}%"
            })

    # 2. Top Category Alert
    cursor.execute("""
        SELECT c.name, SUM(t.amount) as total
        FROM transactions t JOIN categories c ON t.category_id = c.id
        WHERE t.user_email = %s AND t.type = 'expense' 
        AND MONTH(t.date) = MONTH(CURRENT_DATE())
        GROUP BY c.name ORDER BY total DESC LIMIT 1
    """, (email,))
    top_cat = cursor.fetchone()
    
    if top_cat:
        insights.append({
            "type": "info",
            "text": f"'{top_cat['name']}' is your highest spending category this month.",
            "value": f"₹{float(top_cat['total']):,.0f}"
        })
        
    conn.close()
    return insights

# 3. LOAN MANAGEMENT
@app.post("/loans")
def add_loan(loan: LoanCreate):
    conn = get_db()
    cursor = conn.cursor()
    
    # Calculate EMI (P x R x (1+R)^N) / ((1+R)^N - 1)
    # Rate is monthly (Annual / 12 / 100)
    P = loan.total_amount
    R = (loan.interest_rate / 12) / 100
    N = loan.tenure_months
    
    if R == 0:
        emi = P / N
    else:
        emi = (P * R * pow(1 + R, N)) / (pow(1 + R, N) - 1)
    
    cursor.execute("""
        INSERT INTO loans (user_email, name, total_amount, interest_rate, tenure_months, start_date, emi_amount)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """, (loan.user_email, loan.name, loan.total_amount, loan.interest_rate, loan.tenure_months, loan.start_date, emi))
    
    conn.commit()
    conn.close()
    return {"message": "Loan added"}

@app.get("/loans/{email}")
def get_loans(email: str):
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM loans WHERE user_email = %s", (email,))
    loans = cursor.fetchall()
    
    # Calculate Paid vs Remaining based on time passed
    for loan in loans:
        start = datetime.strptime(str(loan['start_date']), '%Y-%m-%d')
        now = datetime.now()
        months_passed = (now.year - start.year) * 12 + (now.month - start.month)
        months_passed = max(0, min(months_passed, loan['tenure_months']))
        
        loan['months_paid'] = months_passed
        loan['amount_paid'] = float(loan['emi_amount']) * months_passed
        loan['amount_remaining'] = (float(loan['emi_amount']) * loan['tenure_months']) - loan['amount_paid']
        loan['progress'] = (loan['amount_paid'] / (float(loan['emi_amount']) * loan['tenure_months'])) * 100
        
    conn.close()
    return loans

@app.delete("/loans/{id}")
def delete_loan(id: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM loans WHERE id = %s", (id,))
    conn.commit()
    conn.close()
    return {"message": "Loan deleted"}

# ================= STARTUP (REQUIRED FOR RENDER) =================
if __name__ == "__main__":
    import uvicorn
    # Render provides PORT, default to 10000 for local dev
    port = int(os.environ.get("PORT", 10000))
    # Host MUST be 0.0.0.0
    uvicorn.run(app, host="0.0.0.0", port=port)