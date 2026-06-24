"""
load_products.py — One-time setup script.
Run this before starting the pipeline for the first time.

Usage:
    python load_products.py
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agents.rag import load_products_into_chroma, get_relevant_products

if __name__ == "__main__":
    print("Loading SBI product catalog into ChromaDB...")
    load_products_into_chroma()

    print("\nVerification — querying for agricultural signal:")
    results = get_relevant_products(
        signal_text="IMD forecasts below normal rainfall in Vidarbha region",
        segment="KCC",
        n=3
    )
    for r in results:
        print(f"  [OK] {r['product_id']}: {r['name']}")

    print("\nVerification — querying for policy signal:")
    results = get_relevant_products(
        signal_text="RBI cuts repo rate by 25 basis points",
        segment="home_loan",
        n=3
    )
    for r in results:
        print(f"  [OK] {r['product_id']}: {r['name']}")

    print("\nChromaDB loaded successfully. Ready to run pipeline.")
