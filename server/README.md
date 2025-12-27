###  Backend Documentation (`server/README.md`)

```markdown
# 🐍 FinTrack Backend API

The backend for FinTrack is built with **FastAPI**, offering high performance and automatic interactive documentation. It connects to a **TiDB (MySQL)** database to store user data, transactions, and budgets.

## ⚙️ Installation & Setup

### 1. Create Virtual Environment
```bash
python -m venv venv
source venv/bin/activate   # Mac/Linux
venv\Scripts\activate    # Windows
uvicorn main:app --reload --port 5001

