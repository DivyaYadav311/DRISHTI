"""
engagement_agent.py — Node 3: Generates customer outreach messages using Gemini.
"""

import json
import uuid
from datetime import datetime
from agents.llm import call_llm
from agents.prompts import ENGAGEMENT_OPENING_PROMPT, ENGAGEMENT_CONTINUATION_PROMPT
from agents.rag import get_product_by_id

LANGUAGE_DISPLAY = {
    "marathi": "Marathi",
    "hindi": "Hindi",
    "tamil": "Tamil",
    "telugu": "Telugu",
    "bengali": "Bengali",
    "punjabi": "Punjabi",
    "english": "English"
}


def generate_opening_message(customer: dict, signal: dict, product: dict) -> dict:
    """
    Generates the first proactive message from DRISHTI to the customer.
    Returns {message, message_english}.
    """
    language = customer.get("language", "hindi")
    lang_display = LANGUAGE_DISPLAY.get(language, "Hindi")

    prompt = ENGAGEMENT_OPENING_PROMPT.format(
        signal_text=signal.get("signal_text", ""),
        customer_name=customer.get("name", "Customer"),
        product_name=product.get("name", ""),
        product_benefit=product.get("benefit", ""),
        tone=customer.get("tone", "informative"),
        language=lang_display,
        channel=customer.get("channel", "sms")
    )

    try:
        raw_text = call_llm(
            user_message=prompt,
            max_tokens=400,
        )

        if raw_text.startswith("```"):
            raw_text = raw_text.split("```")[1]
            if raw_text.startswith("json"):
                raw_text = raw_text[4:]

        return json.loads(raw_text.strip())

    except Exception as e:
        print(f"[EngagementAgent] Opening message failed for {customer['id']}: {e}")
        return {
            "message": f"Namaste {customer.get('name', '')} ji. Kya aap hamare naye offer ke baare mein jaanna chahenge?",
            "message_english": f"Hello {customer.get('name', '')}. Would you like to know about our new offer?"
        }


def run_engagement_agent(state: dict) -> dict:
    """
    Node 3: Takes matched_customers + enriched_signal.
    Generates opening message for each customer.
    Creates journey objects.
    """
    signal = state.get("enriched_signal", {})
    customers = state.get("matched_customers", [])

    if not customers:
        return {"journeys": [], "enriched_signal": signal}

    journeys = []

    for customer in customers:
        product_id = customer.get("recommended_product", "")
        product = get_product_by_id(product_id)

        if not product:
            # Fallback product shell
            product = {
                "product_id": product_id,
                "name": product_id.replace("_", " ").title(),
                "benefit": "Financial protection and support",
                "description": "",
                "eligibility": ""
            }

        # Generate the opening outreach message
        msg_data = generate_opening_message(customer, signal, product)

        journey = {
            "journey_id": f"j_{uuid.uuid4().hex[:8]}",
            "customer_id": customer["id"],
            "customer_name": customer.get("name", ""),
            "customer_language": customer.get("language", "hindi"),
            "customer_state": customer.get("state", ""),
            "customer_district": customer.get("district", ""),
            "signal_id": signal.get("id", ""),
            "signal_text": signal.get("signal_text", ""),
            "signal_type": signal.get("type", ""),
            "product_recommended": product_id,
            "product_name": product.get("name", ""),
            "product_details": product,
            "reasoning": customer.get("reasoning", ""),
            "urgency_score": customer.get("urgency_score", 0.5),
            "channel": customer.get("channel", "sms"),
            "tone": customer.get("tone", "informative"),
            "status": "pending",
            "created_at": datetime.now().isoformat(),
            "converted_at": None,
            "messages": [
                {
                    "role": "drishti",
                    "text": msg_data["message"],
                    "text_english": msg_data["message_english"],
                    "timestamp": datetime.now().isoformat()
                }
            ]
        }

        journeys.append(journey)
        print(f"[EngagementAgent] Journey created for {customer.get('name')} "
              f"-> {product_id} via {customer.get('channel', 'sms')}")

    return {"journeys": journeys}


def continue_conversation(journey: dict, customer_reply: str) -> dict:
    """
    Handles customer reply in a multi-turn conversation.
    Called by FastAPI when customer responds.
    Updates journey status and appends messages.
    """
    language = journey.get("customer_language", "hindi")
    lang_display = LANGUAGE_DISPLAY.get(language, "Hindi")

    product = journey.get("product_details", {})

    # Build conversation history string
    history_lines = []
    for msg in journey.get("messages", []):
        role_label = "DRISHTI" if msg["role"] == "drishti" else "CUSTOMER"
        # Show English translation for context clarity
        text = msg.get("text_english", msg.get("text", ""))
        history_lines.append(f"{role_label}: {text}")
    conversation_history = "\n".join(history_lines)

    prompt = ENGAGEMENT_CONTINUATION_PROMPT.format(
        product_name=product.get("name", journey.get("product_recommended", "")),
        product_details=json.dumps(product, indent=2),
        conversation_history=conversation_history,
        customer_reply=customer_reply,
        language=lang_display
    )

    try:
        raw_text = call_llm(
            user_message=prompt,
            max_tokens=400,
        )

        if raw_text.startswith("```"):
            raw_text = raw_text.split("```")[1]
            if raw_text.startswith("json"):
                raw_text = raw_text[4:]

        reply_data = json.loads(raw_text.strip())

        # Update language if detected in output
        detected_lang = reply_data.get("detected_language")
        if detected_lang:
            detected_lang = detected_lang.lower().strip()
            if detected_lang in LANGUAGE_DISPLAY:
                journey["customer_language"] = detected_lang
                print(f"[EngagementAgent] Language switch detected: {detected_lang}")

    except Exception as e:
        print(f"[EngagementAgent] Continuation failed: {e}")
        reply_data = {
            "message": "Dhanyavaad. Hum aapko jald connect karenge.",
            "message_english": "Thank you. We will connect with you shortly.",
            "status": "active",
            "next_action": "Manual follow-up needed"
        }

    # Append customer reply
    journey["messages"].append({
        "role": "customer",
        "text": customer_reply,
        "text_english": customer_reply,
        "timestamp": datetime.now().isoformat()
    })

    # Append DRISHTI response
    journey["messages"].append({
        "role": "drishti",
        "text": reply_data["message"],
        "text_english": reply_data.get("message_english", reply_data["message"]),
        "timestamp": datetime.now().isoformat()
    })

    # Update status
    new_status = reply_data.get("status", "active")
    journey["status"] = new_status

    if new_status == "converted":
        journey["converted_at"] = datetime.now().isoformat()
        # Calculate conversion time in minutes
        created = datetime.fromisoformat(journey["created_at"])
        converted = datetime.now()
        delta_minutes = round((converted - created).total_seconds() / 60, 1)
        journey["conversion_time_minutes"] = delta_minutes
        print(f"[EngagementAgent] CONVERTED: {journey['customer_name']} "
              f"-> {journey['product_recommended']} in {delta_minutes} min")

    journey["last_action"] = reply_data.get("next_action", "")

    return journey
