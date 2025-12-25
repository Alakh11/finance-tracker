from fastapi import FastAPI
from pydantic import BaseModel
import mysql.connector
import os
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

app = FastAPI()

# Enable CORS so your React app can talk to this Python backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database Connection
def get_db_connection():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        port=os.getenv("DB_PORT"),
        database=os.getenv("DB_NAME")
    )

# Data Model
class Transaction(BaseModel):
    amount: float
    category: str
    type: str
    user_email: str

@app.get("/")
def read_root():
    return {"message": "Finance Tracker API is running"}

@app.post("/add-transaction")
def add_transaction(tx: Transaction):
    conn = get_db_connection()
    cursor = conn.cursor()
    query = "INSERT INTO transactions (amount, category, type, user_email) VALUES (%s, %s, %s, %s)"
    cursor.execute(query, (tx.amount, tx.category, tx.type, tx.user_email))
    conn.commit()
    cursor.close()
    conn.close()
    return {"message": "Transaction added successfully"}

@app.get("/transactions/{email}")
def get_transactions(email: str):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True) # Returns data as JSON objects
    cursor.execute("SELECT * FROM transactions WHERE user_email = %s", (email,))
    results = cursor.fetchall()
    cursor.close()
    conn.close()
    return results