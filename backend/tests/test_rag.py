"""
test_rag.py — Tests ChromaDB product RAG in isolation.
Run: python tests/test_rag.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agents.rag import load_products_into_chroma, get_relevant_products, get_product_by_id

def run_tests():
    print("Loading products into ChromaDB...")
    load_products_into_chroma()

    tests = [
        {
            "name": "Agricultural -> KCC",
            "signal": "IMD forecasts drought in Maharashtra. Weak monsoon.",
            "segment": "KCC",
            "expected_contains": ["PMFBY", "KCC_RESTRUCTURE"]
        },
        {
            "name": "Policy -> Home Loan",
            "signal": "RBI cuts repo rate by 25bps. Home loans to get cheaper.",
            "segment": "home_loan",
            "expected_contains": ["SBI_REFI"]
        },
        {
            "name": "Scheme -> Jan Dhan",
            "signal": "PM-KISAN installment of Rs 2000 credited to accounts.",
            "segment": "jan_dhan",
            "expected_contains": ["JD_RD", "SBI_SURAKSHA"]
        },
        {
            "name": "Economic -> MSME",
            "signal": "Budget expands MSME credit guarantee scheme coverage.",
            "segment": "MSME",
            "expected_contains": ["MSME_EMERGENCY", "MSME_MUDRA"]
        }
    ]

    passed = 0
    for test in tests:
        print(f"\nTest: {test['name']}")
        results = get_relevant_products(test["signal"], test["segment"], n=3)
        product_ids = [r["product_id"] for r in results]
        print(f"  Retrieved: {product_ids}")

        hit = any(exp in product_ids for exp in test["expected_contains"])
        if hit:
            print(f"  PASS [OK]")
            passed += 1
        else:
            print(f"  FAIL — Expected one of {test['expected_contains']}")

    print(f"\nGet by ID test:")
    product = get_product_by_id("PMFBY")
    if product:
        print(f"  PASS [OK] — Found: {product['name']}")
        passed += 1
    else:
        print("  FAIL — Product not found")

    print(f"\n{'='*40}")
    print(f"Results: {passed}/{len(tests)+1} passed")

if __name__ == "__main__":
    run_tests()
