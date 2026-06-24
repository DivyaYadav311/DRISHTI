"""
relevance_agent.py — Node 2: Matches customers to signals and scores them using Gemini.
"""

import json
import sqlite3
import os
from agents.llm import call_llm
from agents.prompts import RELEVANCE_SCORING_PROMPT
from agents.rag import get_relevant_products

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "customers.db")

# Max customers to score per signal (keeps demo fast and under free API limits)
MAX_CUSTOMERS = 5
# Top N after scoring to pass to engagement
TOP_N = 5


def query_customers(segment: str, region: str, district: str | None) -> list:
    """
    Query Person 2's SQLite database for matching customers.
    """
    if not os.path.exists(DB_PATH):
        print(f"[RelevanceAgent] WARNING: customers.db not found at {DB_PATH}")
        print("[RelevanceAgent] Using mock customers for testing")
        return _mock_customers(segment, region)

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    query = "SELECT * FROM customers WHERE 1=1"
    params = []

    # Segment filter — account_types stored as JSON string
    if segment and segment != "all":
        query += " AND account_types LIKE ?"
        params.append(f"%{segment}%")

    # Region filter
    if region and region.lower() != "national":
        query += " AND state = ?"
        params.append(region)

    # District filter
    if district:
        cursor.execute("SELECT COUNT(*) FROM customers WHERE district = ?", (district,))
        db_has_district = cursor.fetchone()[0] > 0
        if db_has_district:
            query += " AND district = ?"
            params.append(district)
        else:
            print(f"[RelevanceAgent] District '{district}' not found in database. Skipping district filter.")

    query += f" LIMIT {MAX_CUSTOMERS}"

    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    customers = []
    for row in rows:
        c = dict(row)
        # Parse account_types JSON string back to list
        try:
            c["account_types"] = json.loads(c["account_types"])
        except Exception:
            c["account_types"] = []
        customers.append(c)

    return customers


def _mock_customers(segment: str, region: str) -> list:
    """
    Returns synthetic customers when DB is not available.
    Used for isolated testing of the pipeline.
    """
    return [
        {
            "id": "cust_0001",
            "name": "Ramesh Jadhav",
            "age": 52,
            "state": "Maharashtra",
            "district": "Amravati",
            "language": "marathi",
            "account_types": ["KCC", "savings"],
            "kcc_limit": 120000,
            "loan_amount": 0,
            "income_bracket": "low",
            "repayment_status": "clean",
            "dependents": 2,
            "digital_access": "sms_only",
            "salary_source": None
        },
        {
            "id": "cust_0002",
            "name": "Sunita Devi",
            "age": 38,
            "state": "Maharashtra",
            "district": "Nagpur",
            "language": "marathi",
            "account_types": ["KCC", "jan_dhan"],
            "kcc_limit": 80000,
            "loan_amount": 0,
            "income_bracket": "low",
            "repayment_status": "clean",
            "dependents": 3,
            "digital_access": "sms_only",
            "salary_source": None
        },
        {
            "id": "cust_0003",
            "name": "Vikram Patil",
            "age": 45,
            "state": "Maharashtra",
            "district": "Pune",
            "language": "marathi",
            "account_types": ["home_loan", "savings"],
            "kcc_limit": 0,
            "loan_amount": 3500000,
            "income_bracket": "medium",
            "repayment_status": "clean",
            "dependents": 1,
            "digital_access": "yono",
            "salary_source": "private"
        }
    ]


def score_customers_batch(customers: list, signal: dict, products: list) -> list:
    """
    Uses Gemini to score a batch of customers against the signal in a single call.
    Returns list of scoring dicts.
    """
    if not customers:
        return []

    prompt = RELEVANCE_SCORING_PROMPT.format(
        signal_text=signal["signal_text"],
        customers_json=json.dumps(customers, indent=2),
        products_json=json.dumps(products, indent=2)
    )

    try:
        raw_text = call_llm(
            user_message=prompt,
            max_tokens=2000,
        )

        if raw_text.startswith("```"):
            raw_text = raw_text.split("```")[1]
            if raw_text.startswith("json"):
                raw_text = raw_text[4:]
        raw_text = raw_text.strip()

        results = json.loads(raw_text)
        if not isinstance(results, list):
            results = [results]
        return results

    except Exception as e:
        print(f"[RelevanceAgent] Batch scoring failed: {e}")
        return []


def run_relevance_agent(state: dict) -> dict:
    """
    Node 2: Takes enriched_signal from signal_agent.
    Queries customer DB, scores each customer, returns top matches.
    """
    signal = state.get("enriched_signal", {})

    if not signal:
        return {
            "matched_customers": [],
            "error": "No enriched_signal in state"
        }

    # Step 1: Get customers from DB
    customers = query_customers(
        segment=signal.get("affected_segment", "all"),
        region=signal.get("region", "national"),
        district=signal.get("district")
    )

    print(f"[RelevanceAgent] Found {len(customers)} candidate customers")

    if not customers:
        return {
            "matched_customers": [],
            "enriched_signal": signal
        }

    # Step 2: Get relevant products via RAG
    products = get_relevant_products(
        signal_text=signal.get("signal_text", ""),
        segment=signal.get("affected_segment", "all")
    )

    print(f"[RelevanceAgent] Retrieved {len(products)} relevant products from RAG")

    # Step 3: Score customers in batches of 10
    scored = []
    
    # We batch up to 10 customers at a time to prevent rate limits
    BATCH_SIZE = 10
    for i in range(0, len(customers), BATCH_SIZE):
        batch = customers[i:i+BATCH_SIZE]
        print(f"[RelevanceAgent] Scoring batch of {len(batch)} customers...")
        
        batch_results = score_customers_batch(batch, signal, products)
        
        # Map results back to customers by ID
        result_map = {res.get("customer_id"): res for res in batch_results if isinstance(res, dict)}
        
        for customer in batch:
            score_result = result_map.get(customer["id"])
            if score_result and score_result.get("should_engage", False):
                merged = {
                    **customer,
                    **score_result
                }
                scored.append(merged)

    # Step 4: Sort by urgency score, take top N
    scored.sort(key=lambda x: float(x.get("urgency_score", 0)), reverse=True)
    top_customers = scored[:TOP_N]

    print(f"[RelevanceAgent] {len(top_customers)} customers selected for engagement")

    return {
        "matched_customers": top_customers,
        "enriched_signal": signal
    }
