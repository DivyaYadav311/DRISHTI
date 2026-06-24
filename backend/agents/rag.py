"""
rag.py — ChromaDB-based product catalog retrieval.
Uses ChromaDB's default embedding function (no Anthropic dependency).
"""

import chromadb
from chromadb.utils import embedding_functions
import json
import os

# Path to persist ChromaDB
CHROMA_PATH = os.path.join(os.path.dirname(__file__), "..", "chroma_db")
PRODUCTS_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "products.json")

_client = None
_collection = None


def _get_collection():
    global _client, _collection
    if _collection is None:
        _client = chromadb.PersistentClient(path=CHROMA_PATH)
        ef = embedding_functions.DefaultEmbeddingFunction()
        _collection = _client.get_or_create_collection(
            name="sbi_products",
            embedding_function=ef
        )
    return _collection


def load_products_into_chroma():
    """
    Run once to populate ChromaDB with the SBI product catalog.
    Safe to run multiple times (checks for existing IDs).
    """
    collection = _get_collection()

    with open(PRODUCTS_PATH, "r") as f:
        products = json.load(f)

    existing = collection.get()["ids"]

    for product in products:
        if product["product_id"] not in existing:
            # Build a rich text document for embedding
            doc_text = (
                f"{product['name']}. "
                f"{product['description']}. "
                f"Target: {product['target_segment']}. "
                f"Eligibility: {product['eligibility']}. "
                f"Benefit: {product['benefit']}. "
                f"Trigger signals: {product.get('trigger_signals', '')}"
            )
            collection.add(
                documents=[doc_text],
                ids=[product["product_id"]],
                metadatas={
                    "segment": product["target_segment"],
                    "product_json": json.dumps(product)
                }
            )

    print(f"Loaded {len(products)} products into ChromaDB")


def get_relevant_products(signal_text: str, segment: str, n: int = 3) -> list:
    """
    Query ChromaDB for the most relevant SBI products given a signal + segment.
    Returns a list of product dicts.
    """
    collection = _get_collection()

    # If collection is empty, auto-load
    if collection.count() == 0:
        load_products_into_chroma()

    query = f"Signal: {signal_text}. Customer segment: {segment}."

    try:
        results = collection.query(
            query_texts=[query],
            n_results=min(n, collection.count()),
            where={"segment": segment} if segment != "all" else None
        )
    except Exception:
        # Fallback without segment filter
        results = collection.query(
            query_texts=[query],
            n_results=min(n, collection.count())
        )

    products = []
    for meta in results["metadatas"][0]:
        try:
            products.append(json.loads(meta["product_json"]))
        except Exception:
            pass

    return products


def get_product_by_id(product_id: str) -> dict | None:
    """
    Fetch a specific product by ID directly.
    """
    try:
        with open(PRODUCTS_PATH, "r") as f:
            products = json.load(f)
        return next((p for p in products if p["product_id"] == product_id), None)
    except Exception:
        return None


if __name__ == "__main__":
    load_products_into_chroma()
    results = get_relevant_products(
        signal_text="IMD forecasts below normal rainfall in Vidarbha",
        segment="KCC"
    )
    print("Top products for agricultural signal:")
    for r in results:
        print(f"  - {r['name']}: {r['benefit']}")
