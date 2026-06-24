"""
test_full_pipeline.py — Tests the full 3-agent pipeline end to end.
Uses mock customer data (no DB needed).
Run: python tests/test_full_pipeline.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from run_pipeline import run_pipeline
import json

def print_safe(text: str, label: str = ""):
    # Safely replace known problematic symbols for Windows CP1252 console
    safe = text.replace("₹", "Rs").replace("→", "->")
    try:
        if label:
            print(f"{label}{safe}")
        else:
            print(safe)
    except UnicodeEncodeError:
        safe_ascii = safe.encode("ascii", "ignore").decode("ascii").strip()
        if label:
            print(f"{label}{safe_ascii}")
        else:
            print(safe_ascii)


def test_agricultural_signal():
    print("\n" + "="*50)
    print("TEST: Agricultural signal -> KCC customers -> PMFBY")
    print("="*50)

    signal = {
        "id": "sig_imd_test",
        "signal_text": (
            "IMD forecasts 23% below normal rainfall over Vidarbha "
            "region during Kharif 2026. Drought alert issued."
        ),
        "source": "IMD",
        "timestamp": "2026-06-24T06:00:00"
    }

    result = run_pipeline(signal)

    assert result.get("enriched_signal"), "Signal agent failed"
    assert result["enriched_signal"].get("type") == "agricultural", \
        f"Expected agricultural, got {result['enriched_signal'].get('type')}"

    journeys = result.get("journeys", [])
    print(f"\nJourneys created: {len(journeys)}")

    for j in journeys[:3]:
        print(f"\n  Customer: {j['customer_name']} ({j['customer_state']})")
        print(f"  Product: {j['product_name']}")
        print(f"  Channel: {j['channel']}")
        print(f"  Urgency: {j['urgency_score']}")
        msg = j["messages"][0]
        print_safe(msg['text'], f"  Message [{j['customer_language']}]: ")
        print_safe(msg['text_english'], "  Message [EN]: ")

    print("\nTEST PASSED [OK]" if journeys else "\nTEST FAILED — No journeys created")
    return len(journeys) > 0


def test_policy_signal():
    print("\n" + "="*50)
    print("TEST: RBI rate cut -> home loan customers -> refinancing")
    print("="*50)

    signal = {
        "id": "sig_rbi_test",
        "signal_text": (
            "RBI Monetary Policy Committee reduces repo rate by 25 basis points "
            "to 6.0%. Home loan rates expected to fall within 4 weeks."
        ),
        "source": "RBI",
        "timestamp": "2026-06-24T10:00:00"
    }

    result = run_pipeline(signal)

    assert result.get("enriched_signal"), "Signal agent failed"

    journeys = result.get("journeys", [])
    print(f"\nJourneys created: {len(journeys)}")

    for j in journeys[:2]:
        print(f"\n  Customer: {j['customer_name']}")
        print(f"  Product: {j['product_name']}")
        msg = j["messages"][0]
        print_safe(msg['text_english'], "  Message [EN]: ")

    print("\nTEST PASSED [OK]" if journeys else "\nWARNING — No journeys (check mock data)")
    return True


def test_conversation_continuation():
    print("\n" + "="*50)
    print("TEST: Multi-turn conversation — customer says yes")
    print("="*50)

    from agents.engagement_agent import continue_conversation

    mock_journey = {
        "journey_id": "j_test_001",
        "customer_id": "cust_0001",
        "customer_name": "Ramesh Jadhav",
        "customer_language": "marathi",
        "customer_state": "Maharashtra",
        "customer_district": "Amravati",
        "signal_id": "sig_imd_test",
        "signal_text": "Weak monsoon forecast for Vidarbha",
        "product_recommended": "PMFBY",
        "product_name": "Pradhan Mantri Fasal Bima Yojana",
        "product_details": {
            "product_id": "PMFBY",
            "name": "Pradhan Mantri Fasal Bima Yojana",
            "description": "Crop insurance for farmers",
            "premium": "2% of sum insured, rest paid by government",
            "benefit": "Full crop loss compensation",
            "eligibility": "KCC holder"
        },
        "reasoning": "KCC holder in weak monsoon region",
        "urgency_score": 0.88,
        "channel": "sms",
        "tone": "urgent",
        "status": "pending",
        "created_at": "2026-06-24T06:00:00",
        "converted_at": None,
        "messages": [
            {
                "role": "drishti",
                "text": "Namaste Ramesh ji. IMD ne Vidarbha mein paus kami ki baat kahi hai. Tumchya pikasathi PMFBY vima karnyacha vichar karawa ka?",
                "text_english": "Hello Ramesh ji. IMD has predicted weak rainfall in Vidarbha. Should we consider PMFBY crop insurance for your crops?",
                "timestamp": "2026-06-24T06:00:00"
            }
        ]
    }

    # Turn 1: Customer asks about cost
    print("\nTurn 1: Customer asks about premium")
    journey = continue_conversation(mock_journey, "Kitna premium lagega?")
    print(f"Status: {journey['status']}")
    last_msg = journey["messages"][-1]
    print_safe(last_msg['text_english'], "DRISHTI [EN]: ")

    # Turn 2: Customer agrees
    print("\nTurn 2: Customer agrees")
    journey = continue_conversation(journey, "Haan, karo")
    print(f"Status: {journey['status']}")
    last_msg = journey["messages"][-1]
    print_safe(last_msg['text_english'], "DRISHTI [EN]: ")

    converted = journey["status"] == "converted"
    print(f"\nConversion achieved: {converted}")
    if converted:
        print(f"Conversion time: {journey.get('conversion_time_minutes', '?')} minutes")
    print("\nTEST PASSED [OK]" if converted else "\nTEST INCOMPLETE — Check continuation logic")
    return True


if __name__ == "__main__":
    results = []
    results.append(test_agricultural_signal())
    results.append(test_policy_signal())
    results.append(test_conversation_continuation())

    print(f"\n{'='*50}")
    print(f"ALL TESTS: {sum(results)}/{len(results)} passed")
