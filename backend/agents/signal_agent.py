"""
signal_agent.py — Node 1: Enriches raw signals using Gemini.
"""

import json
from agents.llm import call_llm
from agents.prompts import SIGNAL_AGENT_PROMPT


def run_signal_agent(state: dict) -> dict:
    """
    Node 1: Takes raw signal from the queue.
    Enriches and structures it using Gemini.
    Returns enriched_signal in state.
    """
    raw = state.get("raw_signal", {})

    if not raw:
        return {"error": "No raw_signal provided", "enriched_signal": {}}

    user_message = f"""
Raw Signal Text: {raw.get('signal_text', '')}
Source: {raw.get('source', 'unknown')}
Date: {raw.get('timestamp', 'unknown')}

Analyze this signal and return the structured JSON.
"""

    try:
        raw_text = call_llm(
            user_message=user_message,
            system_prompt=SIGNAL_AGENT_PROMPT,
            max_tokens=600,
        )

        # Strip markdown fences if present
        if raw_text.startswith("```"):
            raw_text = raw_text.split("```")[1]
            if raw_text.startswith("json"):
                raw_text = raw_text[4:]
        raw_text = raw_text.strip()

        enriched = json.loads(raw_text)

        # Preserve original metadata
        enriched["id"] = raw.get("id", "sig_auto")
        enriched["source"] = raw.get("source", "unknown")
        enriched["timestamp"] = raw.get("timestamp", "")
        enriched["raw_text"] = raw.get("signal_text", "")

        print(f"[SignalAgent] Enriched signal: {enriched['type']} | "
              f"Segment: {enriched['affected_segment']} | "
              f"Urgency: {enriched['urgency']}")

        return {"enriched_signal": enriched, "error": None}

    except json.JSONDecodeError as e:
        print(f"[SignalAgent] JSON parse error: {e}")
        return {
            "error": f"Signal agent JSON parse failed: {str(e)}",
            "enriched_signal": {}
        }
    except Exception as e:
        print(f"[SignalAgent] Error: {e}")
        return {
            "error": f"Signal agent failed: {str(e)}",
            "enriched_signal": {}
        }
