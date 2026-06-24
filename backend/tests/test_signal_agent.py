"""
test_signal_agent.py — Tests the Signal Agent in isolation.
Run: python tests/test_signal_agent.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agents.signal_agent import run_signal_agent

TEST_SIGNALS = [
    {
        "id": "t001",
        "signal_text": "IMD forecasts 23% below normal rainfall over Vidarbha region this Kharif season.",
        "source": "IMD",
        "timestamp": "2026-06-24T06:00:00"
    },
    {
        "id": "t002",
        "signal_text": "RBI MPC cuts repo rate by 25bps to 6.0%. All floating rate loans to be repriced.",
        "source": "RBI",
        "timestamp": "2026-06-24T10:00:00"
    },
    {
        "id": "t003",
        "signal_text": "PM-KISAN 20th installment of Rs 2000 will be credited to Jan Dhan accounts on Aug 1.",
        "source": "PIB",
        "timestamp": "2026-06-24T09:00:00"
    }
]

def run_tests():
    passed = 0
    failed = 0

    for signal in TEST_SIGNALS:
        print(f"\nTesting signal: {signal['id']} [{signal['source']}]")
        print(f"Input: {signal['signal_text'][:60]}...")

        state = {"raw_signal": signal}
        result = run_signal_agent(state)

        enriched = result.get("enriched_signal", {})
        error = result.get("error")

        if error or not enriched:
            print(f"  FAIL — Error: {error}")
            failed += 1
            continue

        # Validate required fields
        required = ["type", "urgency", "affected_segment", "opportunity_hint"]
        missing = [f for f in required if f not in enriched]

        if missing:
            print(f"  FAIL — Missing fields: {missing}")
            failed += 1
        else:
            print(f"  PASS")
            print(f"    Type: {enriched['type']}")
            print(f"    Urgency: {enriched['urgency']}")
            print(f"    Segment: {enriched['affected_segment']}")
            print(f"    Opportunity: {enriched['opportunity_hint']}")
            print(f"    Reasoning: {enriched['reasoning']}")
            passed += 1

    print(f"\n{'='*40}")
    print(f"Results: {passed} passed, {failed} failed")

if __name__ == "__main__":
    run_tests()
