"""
init_db.py — Initialize the DRISHTI customer database.

Generates 500 synthetic customers with a rich schema that mirrors
the Drishti_Backend data model (occupation, farm_size, credit_score, etc.)

Usage:
    python -m data.init_db        # from backend/
    python data/init_db.py        # direct
"""

import sqlite3
import json
import os
import random

DB_PATH = os.path.join(os.path.dirname(__file__), "customers.db")

# ─── Reference Data ──────────────────────────────────────────────

STATES = {
    "Maharashtra": ["Amravati", "Nagpur", "Pune", "Nashik", "Yavatmal", "Akola", "Beed"],
    "Uttar Pradesh": ["Lucknow", "Varanasi", "Agra", "Kanpur", "Gorakhpur"],
    "Punjab": ["Ludhiana", "Amritsar", "Jalandhar", "Patiala"],
    "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Salem"],
    "West Bengal": ["Kolkata", "Howrah", "Durgapur", "Siliguri"],
    "Karnataka": ["Bengaluru", "Mysuru", "Hubli", "Mangalore"],
    "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot"],
    "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota"],
    "Madhya Pradesh": ["Bhopal", "Indore", "Gwalior", "Jabalpur"],
    "Kerala": ["Kochi", "Thiruvananthapuram", "Kozhikode"],
}

LANGUAGE_MAP = {
    "Maharashtra": "marathi",
    "Uttar Pradesh": "hindi",
    "Punjab": "punjabi",
    "Tamil Nadu": "tamil",
    "West Bengal": "bengali",
    "Karnataka": "kannada",
    "Gujarat": "gujarati",
    "Rajasthan": "hindi",
    "Madhya Pradesh": "hindi",
    "Kerala": "malayalam",
}

ACCOUNT_TYPES = [
    ["KCC", "savings"],
    ["home_loan", "savings"],
    ["jan_dhan"],
    ["MSME", "savings"],
    ["salary", "savings"],
    ["KCC", "jan_dhan"],
    ["jan_dhan", "savings"],
]

OCCUPATIONS = {
    "KCC": ["Farmer", "Agricultural Worker", "Dairy Farmer", "Cotton Farmer", "Rice Farmer"],
    "MSME": ["MSME Owner", "Shop Owner", "Textile Manufacturer", "Small Business Owner"],
    "home_loan": ["Software Engineer", "Teacher", "Government Employee", "Doctor", "Civil Engineer"],
    "jan_dhan": ["Daily Wage Worker", "Self Employed", "Household Worker", "Weaver", "Street Vendor"],
    "salary": ["Corporate Employee", "Bank Employee", "Engineer", "IT Professional", "Analyst"],
}

BUSINESS_TYPES = ["Textile", "Retail", "Food Processing", "Logistics", "Manufacturing", "Agriculture Services"]
CROP_TYPES = ["Wheat", "Rice", "Soybean", "Cotton", "Sugarcane", "Maize", "Groundnut"]

FIRST_NAMES = [
    "Rajesh", "Amit", "Sunil", "Vijay", "Sanjay", "Anil", "Sandip", "Karan", "Dinesh", "Rakesh",
    "Ganesh", "Prakash", "Jyoti", "Kiran", "Lata", "Asha", "Rekha", "Pooja", "Seema", "Geeta",
    "Arun", "Suresh", "Vikram", "Rohan", "Rahul", "Mahesh", "Deepak", "Pankaj", "Sushil", "Ravi",
    "Neha", "Kavita", "Anita", "Manju", "Savita", "Kumari", "Shanti", "Durga", "Fatima", "Nandini",
    "Mohan", "Gopal", "Hari", "Shankar", "Bala", "Murugan", "Selvam", "Arjun", "Bharat", "Chandra",
]

LAST_NAMES = [
    "Sharma", "Patel", "Verma", "Gupta", "Joshi", "Rao", "Nair", "Iyer", "Reddy", "Mehta",
    "Singh", "Das", "Sen", "Roy", "Chatterjee", "Banerjee", "Kumar", "Prasad", "Mishra", "Pandey",
    "Naidu", "Deshmukh", "Pillai", "Shetty", "Patil", "Jadhav", "Shinde", "Pawar", "Kulkarni", "Devi",
]


# ─── Named Customers (preserved for demo continuity) ─────────────

NAMED_CUSTOMERS = [
    {
        "id": "cust_0001", "name": "Ramesh Jadhav", "age": 52,
        "state": "Maharashtra", "district": "Amravati", "language": "marathi",
        "account_types": json.dumps(["KCC", "savings"]),
        "kcc_limit": 120000, "loan_amount": 0,
        "income_bracket": "low", "repayment_status": "clean",
        "dependents": 2, "digital_access": "both", "salary_source": None,
        "occupation": "Cotton Farmer", "business_type": None,
        "farm_size": 4.2, "crop_type": "Cotton",
        "credit_score": 712, "existing_loans": "KCC",
    },
    {
        "id": "cust_0002", "name": "Sunita Devi", "age": 34,
        "state": "Uttar Pradesh", "district": "Gorakhpur", "language": "hindi",
        "account_types": json.dumps(["jan_dhan", "savings"]),
        "kcc_limit": 0, "loan_amount": 0,
        "income_bracket": "low", "repayment_status": "clean",
        "dependents": 3, "digital_access": "sms_only", "salary_source": None,
        "occupation": "Weaver", "business_type": None,
        "farm_size": None, "crop_type": None,
        "credit_score": None, "existing_loans": "None",
    },
    {
        "id": "cust_0003", "name": "Priya Nair", "age": 29,
        "state": "Maharashtra", "district": "Pune", "language": "english",
        "account_types": json.dumps(["home_loan", "savings"]),
        "kcc_limit": 0, "loan_amount": 4500000,
        "income_bracket": "high", "repayment_status": "clean",
        "dependents": 0, "digital_access": "yono", "salary_source": "private",
        "occupation": "IT Professional", "business_type": None,
        "farm_size": None, "crop_type": None,
        "credit_score": 798, "existing_loans": "Home Loan",
    },
    {
        "id": "cust_0004", "name": "Anil Patil", "age": 42,
        "state": "Maharashtra", "district": "Yavatmal", "language": "marathi",
        "account_types": json.dumps(["KCC", "savings"]),
        "kcc_limit": 95000, "loan_amount": 0,
        "income_bracket": "low", "repayment_status": "clean",
        "dependents": 2, "digital_access": "sms_only", "salary_source": None,
        "occupation": "Farmer", "business_type": None,
        "farm_size": 3.5, "crop_type": "Soybean",
        "credit_score": 680, "existing_loans": "KCC",
    },
    {
        "id": "cust_0005", "name": "Meena Yadav", "age": 38,
        "state": "Uttar Pradesh", "district": "Varanasi", "language": "hindi",
        "account_types": json.dumps(["jan_dhan"]),
        "kcc_limit": 0, "loan_amount": 0,
        "income_bracket": "low", "repayment_status": "clean",
        "dependents": 4, "digital_access": "sms_only", "salary_source": None,
        "occupation": "Daily Wage Worker", "business_type": None,
        "farm_size": None, "crop_type": None,
        "credit_score": None, "existing_loans": "None",
    },
    {
        "id": "cust_0006", "name": "Vikram Shetty", "age": 45,
        "state": "Karnataka", "district": "Bengaluru", "language": "kannada",
        "account_types": json.dumps(["MSME", "savings"]),
        "kcc_limit": 0, "loan_amount": 1200000,
        "income_bracket": "high", "repayment_status": "clean",
        "dependents": 2, "digital_access": "yono", "salary_source": "private",
        "occupation": "MSME Owner", "business_type": "Textile",
        "farm_size": None, "crop_type": None,
        "credit_score": 810, "existing_loans": "MSME Loan",
    },
    {
        "id": "cust_0007", "name": "Rohit Mehta", "age": 41,
        "state": "Gujarat", "district": "Ahmedabad", "language": "hindi",
        "account_types": json.dumps(["home_loan", "savings"]),
        "kcc_limit": 0, "loan_amount": 2800000,
        "income_bracket": "medium", "repayment_status": "clean",
        "dependents": 2, "digital_access": "yono", "salary_source": "private",
        "occupation": "Civil Engineer", "business_type": None,
        "farm_size": None, "crop_type": None,
        "credit_score": 745, "existing_loans": "Home Loan",
    },
    {
        "id": "cust_0008", "name": "Lakshmi Iyer", "age": 48,
        "state": "Tamil Nadu", "district": "Chennai", "language": "tamil",
        "account_types": json.dumps(["home_loan", "savings"]),
        "kcc_limit": 0, "loan_amount": 4200000,
        "income_bracket": "high", "repayment_status": "clean",
        "dependents": 1, "digital_access": "both", "salary_source": "government",
        "occupation": "Government Employee", "business_type": None,
        "farm_size": None, "crop_type": None,
        "credit_score": 820, "existing_loans": "Home Loan",
    },
    {
        "id": "cust_0009", "name": "Suresh Kumar", "age": 50,
        "state": "Maharashtra", "district": "Akola", "language": "marathi",
        "account_types": json.dumps(["KCC"]),
        "kcc_limit": 110000, "loan_amount": 0,
        "income_bracket": "low", "repayment_status": "delayed",
        "dependents": 3, "digital_access": "sms_only", "salary_source": None,
        "occupation": "Rice Farmer", "business_type": None,
        "farm_size": 5.0, "crop_type": "Rice",
        "credit_score": 640, "existing_loans": "KCC",
    },
    {
        "id": "cust_0010", "name": "Geeta Bai", "age": 31,
        "state": "Uttar Pradesh", "district": "Gorakhpur", "language": "hindi",
        "account_types": json.dumps(["jan_dhan"]),
        "kcc_limit": 0, "loan_amount": 0,
        "income_bracket": "low", "repayment_status": "clean",
        "dependents": 2, "digital_access": "both", "salary_source": None,
        "occupation": "Self Employed", "business_type": None,
        "farm_size": None, "crop_type": None,
        "credit_score": None, "existing_loans": "None",
    },
]


def _generate_random_customer(i: int) -> dict:
    """Generate a single synthetic customer using deterministic random seed."""
    rng = random.Random(42 + i)

    state = rng.choice(list(STATES.keys()))
    district = rng.choice(STATES[state])
    account_type = rng.choice(ACCOUNT_TYPES)
    primary = account_type[0]

    occupation = rng.choice(OCCUPATIONS.get(primary, ["Professional"]))

    business_type = None
    farm_size = None
    crop_type = None

    if primary == "MSME":
        business_type = rng.choice(BUSINESS_TYPES)
    if primary == "KCC":
        farm_size = round(rng.uniform(1.0, 15.0), 1)
        crop_type = rng.choice(CROP_TYPES)

    kcc_limit = rng.choice([60000, 80000, 100000, 120000, 150000, 200000]) if "KCC" in account_type else 0
    loan_amount = rng.randint(1000000, 5000000) if "home_loan" in account_type else (
        rng.randint(500000, 2000000) if "MSME" in account_type else 0
    )

    credit_score = rng.randint(600, 850) if primary not in ["jan_dhan"] else None

    existing_loans = rng.choice(["None", "Personal Loan", "Vehicle Loan", "KCC", "Home Loan", "MSME Loan"])

    first = rng.choice(FIRST_NAMES)
    last = rng.choice(LAST_NAMES)

    return {
        "id": f"cust_{i:04d}",
        "name": f"{first} {last}",
        "age": rng.randint(22, 65),
        "state": state,
        "district": district,
        "language": LANGUAGE_MAP[state],
        "account_types": json.dumps(account_type),
        "kcc_limit": kcc_limit,
        "loan_amount": loan_amount,
        "income_bracket": rng.choice(["low", "low", "medium", "medium", "high"]),
        "repayment_status": rng.choice(["clean", "clean", "clean", "delayed"]),
        "dependents": rng.randint(0, 5),
        "digital_access": rng.choice(["sms_only", "sms_only", "yono", "both"]),
        "salary_source": rng.choice(["government", "private", None]) if primary == "salary" else None,
        "occupation": occupation,
        "business_type": business_type,
        "farm_size": farm_size,
        "crop_type": crop_type,
        "credit_score": credit_score,
        "existing_loans": existing_loans,
    }


def init_db():
    """Create and populate the customers database."""
    print(f"[init_db] Initializing SQLite database at: {DB_PATH}")

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Drop and recreate
    cursor.execute("DROP TABLE IF EXISTS customers;")

    cursor.execute("""
    CREATE TABLE customers (
        id TEXT PRIMARY KEY,
        name TEXT,
        age INTEGER,
        state TEXT,
        district TEXT,
        language TEXT,
        account_types TEXT,
        kcc_limit INTEGER,
        loan_amount INTEGER,
        income_bracket TEXT,
        repayment_status TEXT,
        dependents INTEGER,
        digital_access TEXT,
        salary_source TEXT,
        occupation TEXT,
        business_type TEXT,
        farm_size REAL,
        crop_type TEXT,
        credit_score INTEGER,
        existing_loans TEXT
    );
    """)

    # Insert named customers first (10)
    for cust in NAMED_CUSTOMERS:
        columns = ", ".join(cust.keys())
        placeholders = ", ".join([f":{k}" for k in cust.keys()])
        cursor.execute(f"INSERT INTO customers ({columns}) VALUES ({placeholders});", cust)

    # Generate 490 more synthetic customers
    for i in range(11, 501):
        cust = _generate_random_customer(i)
        columns = ", ".join(cust.keys())
        placeholders = ", ".join([f":{k}" for k in cust.keys()])
        cursor.execute(f"INSERT INTO customers ({columns}) VALUES ({placeholders});", cust)

    conn.commit()
    conn.close()

    print(f"[init_db] Database initialized with {len(NAMED_CUSTOMERS) + 490} customers.")
    print(f"[init_db]   10 named demo customers + 490 synthetic")
    print(f"[init_db]   Schema: id, name, age, state, district, language, account_types,")
    print(f"[init_db]           kcc_limit, loan_amount, income_bracket, repayment_status,")
    print(f"[init_db]           dependents, digital_access, salary_source, occupation,")
    print(f"[init_db]           business_type, farm_size, crop_type, credit_score, existing_loans")


if __name__ == "__main__":
    init_db()
