"""
run_pipeline.py — Entry point for standalone pipeline testing.

Usage:
    python run_pipeline.py           # Quick test with mock signal
    from run_pipeline import run_pipeline
    result = run_pipeline(signal_dict)
"""

from agents.graph import pipeline
from agents.rag import load_products_into_chroma
import json
import os

_rag_loaded = False


def _ensure_rag_loaded():
    global _rag_loaded
    if not _rag_loaded:
        products_path = os.path.join(
            os.path.dirname(__file__), "data", "products.json"
        )
        if os.path.exists(products_path):
            load_products_into_chroma()
            _rag_loaded = True
        else:
            print("[Pipeline] WARNING: products.json not found. RAG not loaded.")
            print("[Pipeline] Place products.json in backend/data/")


def run_pipeline(raw_signal: dict) -> dict:
    """
    Main entry point. Takes a raw signal dict, runs the full agent pipeline.

    Args:
        raw_signal: {
            "id": str,
            "signal_text": str,
            "source": str,
            "timestamp": str
        }

    Returns:
        {
            "journeys": List[dict],
            "enriched_signal": dict,
            "matched_customers": List[dict],
            "error": str | None
        }
    """
    _ensure_rag_loaded()

    print(f"\n{'='*50}")
    print(f"[Pipeline] Starting for signal: {raw_signal.get('id', 'unknown')}")
    print(f"[Pipeline] Signal: {raw_signal.get('signal_text', '')[:80]}...")
    print(f"{'='*50}")

    initial_state = {
        "raw_signal": raw_signal,
        "enriched_signal": {},
        "matched_customers": [],
        "journeys": [],
        "error": None
    }

    try:
        final_state = pipeline.invoke(initial_state)

        journeys = final_state.get("journeys", [])
        error = final_state.get("error")

        print(f"\n[Pipeline] Complete:")
        print(f"  Signal type: {final_state.get('enriched_signal', {}).get('type', 'unknown')}")
        print(f"  Customers matched: {len(final_state.get('matched_customers', []))}")
        print(f"  Journeys created: {len(journeys)}")
        if error:
            print(f"  Error: {error}")

        return {
            "journeys": journeys,
            "enriched_signal": final_state.get("enriched_signal", {}),
            "matched_customers": final_state.get("matched_customers", []),
            "error": error
        }

    except Exception as e:
        print(f"[Pipeline] FATAL ERROR: {e}")
        return {
            "journeys": [],
            "enriched_signal": {},
            "matched_customers": [],
            "error": str(e)
        }


if __name__ == "__main__":
    # Quick test run with a mock signal
    test_signal = {
        "id": "sig_test_001",
        "signal_text": (
            "IMD forecasts 23% below normal rainfall over Vidarbha "
            "and Marathwada regions during Kharif 2026 season. "
            "Drought-like conditions expected by August."
        ),
        "source": "IMD",
        "timestamp": "2026-06-24T06:00:00"
    }

    result = run_pipeline(test_signal)

    print(f"\n{'='*50}")
    print("PIPELINE RESULT:")
    print(f"Journeys created: {len(result['journeys'])}")
    for j in result["journeys"]:
        print(f"\n  Customer: {j['customer_name']}")
        print(f"  Product: {j['product_name']}")
        print(f"  Channel: {j['channel']}")
        print(f"  Opening message:")
        try:
            print(f"    [{j['customer_language']}] {j['messages'][0]['text']}")
        except UnicodeEncodeError:
            # Safely encode/decode to avoid crash on Windows consoles
            safe_text = j['messages'][0]['text'].encode('utf-8', 'replace').decode('utf-8', 'replace')
            # Since standard print might still fail if terminal encoding is strict cp1252, we replace non-ascii
            safe_ascii = j['messages'][0]['text'].encode('ascii', 'ignore').decode('ascii').strip()
            print(f"    [{j['customer_language']}] {safe_ascii} (non-ASCII characters hidden for Windows terminal compatibility)")
        print(f"    [EN] {j['messages'][0]['text_english']}")
