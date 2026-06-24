import sqlite3
import json
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "customers.db")

def init_db():
    print(f"Initializing SQLite database at: {DB_PATH}")
    
    # Connect (will create the file if it doesn't exist)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Drop existing table if any
    cursor.execute("DROP TABLE IF EXISTS customers;")
    
    # Create the customers table
    cursor.execute("""
    CREATE TABLE customers (
        id TEXT PRIMARY KEY,
        name TEXT,
        age INTEGER,
        state TEXT,
        district TEXT,
        language TEXT,           -- marathi | hindi | tamil | telugu | english
        account_types TEXT,      -- JSON string: '["KCC", "savings"]'
        kcc_limit INTEGER,
        loan_amount INTEGER,
        income_bracket TEXT,     -- low | medium | high
        repayment_status TEXT,   -- clean | delayed
        dependents INTEGER,
        digital_access TEXT,     -- sms_only | yono | both
        salary_source TEXT       -- government | private | null
    );
    """)
    
    # Seed data
    customers_data = [
        {
            "id": "cust_0001",
            "name": "Ramesh Jadhav",
            "age": 52,
            "state": "Maharashtra",
            "district": "Amravati",
            "language": "marathi",
            "account_types": json.dumps(["KCC", "savings"]),
            "kcc_limit": 120000,
            "loan_amount": 0,
            "income_bracket": "low",
            "repayment_status": "clean",
            "dependents": 2,
            "digital_access": "both",
            "salary_source": None
        },
        {
            "id": "cust_0002",
            "name": "Sunita Devi",
            "age": 34,
            "state": "Uttar Pradesh",
            "district": "Gorakhpur",
            "language": "hindi",
            "account_types": json.dumps(["jan_dhan", "savings"]),
            "kcc_limit": 0,
            "loan_amount": 0,
            "income_bracket": "low",
            "repayment_status": "clean",
            "dependents": 3,
            "digital_access": "sms_only",
            "salary_source": None
        },
        {
            "id": "cust_0003",
            "name": "Priya Nair",
            "age": 29,
            "state": "Maharashtra",
            "district": "Pune",
            "language": "english",
            "account_types": json.dumps(["home_loan", "savings"]),
            "kcc_limit": 0,
            "loan_amount": 3500000,
            "income_bracket": "medium",
            "repayment_status": "clean",
            "dependents": 1,
            "digital_access": "yono",
            "salary_source": "private"
        },
        {
            "id": "cust_0004",
            "name": "Anil Patil",
            "age": 42,
            "state": "Maharashtra",
            "district": "Yavatmal",
            "language": "marathi",
            "account_types": json.dumps(["KCC", "savings"]),
            "kcc_limit": 95000,
            "loan_amount": 0,
            "income_bracket": "low",
            "repayment_status": "clean",
            "dependents": 2,
            "digital_access": "sms_only",
            "salary_source": None
        },
        {
            "id": "cust_0005",
            "name": "Meena Yadav",
            "age": 38,
            "state": "Uttar Pradesh",
            "district": "Varanasi",
            "language": "hindi",
            "account_types": json.dumps(["jan_dhan"]),
            "kcc_limit": 0,
            "loan_amount": 0,
            "income_bracket": "low",
            "repayment_status": "clean",
            "dependents": 4,
            "digital_access": "sms_only",
            "salary_source": None
        },
        {
            "id": "cust_0006",
            "name": "Vikram Shetty",
            "age": 45,
            "state": "Karnataka",
            "district": "Bengaluru",
            "language": "english",
            "account_types": json.dumps(["MSME", "savings"]),
            "kcc_limit": 0,
            "loan_amount": 1200000,
            "income_bracket": "high",
            "repayment_status": "clean",
            "dependents": 2,
            "digital_access": "yono",
            "salary_source": "private"
        },
        {
            "id": "cust_0007",
            "name": "Rohit Mehta",
            "age": 41,
            "state": "Gujarat",
            "district": "Ahmedabad",
            "language": "hindi",
            "account_types": json.dumps(["home_loan"]),
            "kcc_limit": 0,
            "loan_amount": 2800000,
            "income_bracket": "medium",
            "repayment_status": "clean",
            "dependents": 2,
            "digital_access": "yono",
            "salary_source": "private"
        },
        {
            "id": "cust_0008",
            "name": "Lakshmi Iyer",
            "age": 48,
            "state": "Tamil Nadu",
            "district": "Chennai",
            "language": "tamil",
            "account_types": json.dumps(["home_loan", "savings"]),
            "kcc_limit": 0,
            "loan_amount": 4200000,
            "income_bracket": "high",
            "repayment_status": "clean",
            "dependents": 1,
            "digital_access": "both",
            "salary_source": "government"
        },
        {
            "id": "cust_0009",
            "name": "Suresh Kumar",
            "age": 50,
            "state": "Maharashtra",
            "district": "Akola",
            "language": "marathi",
            "account_types": json.dumps(["KCC"]),
            "kcc_limit": 110000,
            "loan_amount": 0,
            "income_bracket": "low",
            "repayment_status": "delayed",
            "dependents": 3,
            "digital_access": "sms_only",
            "salary_source": None
        },
        {
            "id": "cust_0010",
            "name": "Geeta Bai",
            "age": 31,
            "state": "Uttar Pradesh",
            "district": "Gorakhpur",
            "language": "hindi",
            "account_types": json.dumps(["jan_dhan"]),
            "kcc_limit": 0,
            "loan_amount": 0,
            "income_bracket": "low",
            "repayment_status": "clean",
            "dependents": 2,
            "digital_access": "both",
            "salary_source": None
        }
    ]
    
    # Insert seed data
    for cust in customers_data:
        cursor.execute("""
        INSERT INTO customers (
            id, name, age, state, district, language, account_types,
            kcc_limit, loan_amount, income_bracket, repayment_status,
            dependents, digital_access, salary_source
        ) VALUES (
            :id, :name, :age, :state, :district, :language, :account_types,
            :kcc_limit, :loan_amount, :income_bracket, :repayment_status,
            :dependents, :digital_access, :salary_source
        );
        """, cust)
        
    conn.commit()
    conn.close()
    print("Database initialized successfully with 10 synthetic customer records.")

if __name__ == "__main__":
    init_db()
