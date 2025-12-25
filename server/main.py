from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import date
import mysql.connector
import os
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        port=os.getenv("DB_PORT"),
        database=os.getenv("DB_NAME"),
        ssl_verify_cert=True,
        ssl_verify_identity=True
    )

class TransactionCreate(BaseModel):
    user_email: str
    amount: float
    type: str # 'income' or 'expense'
    category: str
    date: str # 'YYYY-MM-DD'
    payment_mode: str
    note: Optional[str] = None

@app.post("/transactions")
def add_transaction(tx: TransactionCreate):
    conn = get_db()
    cursor = conn.cursor()
    try:
        query = """
        INSERT INTO transactions 
        (user_email, amount, type, category_id, payment_mode, date, note) 
        VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(query, (tx.user_email, tx.amount, tx.type, 1, tx.payment_mode, tx.date, tx.note))
        conn.commit()
        return {"message": "Transaction Saved"}
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.get("/dashboard/{email}")
def get_dashboard(email: str):
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    
    # 1. Get Total Income & Expense
    cursor.execute("""
        SELECT type, SUM(amount) as total 
        FROM transactions WHERE user_email = %s GROUP BY type
    """, (email,))
    totals = cursor.fetchall()
    
    # 2. Get Recent Transactions
    cursor.execute("""
        SELECT * FROM transactions 
        WHERE user_email = %s ORDER BY date DESC LIMIT 5
    """, (email,))
    recent = cursor.fetchall()
    
    conn.close()
    return {"totals": totals, "recent": recent}