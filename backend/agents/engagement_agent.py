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
    "english": "English",
    "kannada": "Kannada",
    "gujarati": "Gujarati",
    "malayalam": "Malayalam",
    "odia": "Odia",
    "assamese": "Assamese",
    "urdu": "Urdu",
}


def generate_opening_messages_batch(customers: list, signal: dict, products_map: dict) -> list:
    """
    Generates the first proactive message from DRISHTI to a batch of customers in one LLM call.
    Returns list of message dicts.
    """
    if not customers:
        return []

    # Prepare lightweight customer data for prompt
    lang_override = signal.get("language_override")
    if lang_override:
        lang_override = lang_override.lower()

    customers_data = []
    for c in customers:
        lang = lang_override if lang_override else c.get("language", "hindi")
        product_id = c.get("recommended_product", "")
        product = products_map.get(product_id, {})
        
        customers_data.append({
            "id": c.get("id"),
            "name": c.get("name", "Customer"),
            "language": LANGUAGE_DISPLAY.get(lang, "Hindi"),
            "channel": c.get("channel", "sms"),
            "tone": c.get("tone", "informative"),
            "product_name": product.get("name", product_id),
            "product_benefit": product.get("benefit", "")
        })

    prompt = ENGAGEMENT_OPENING_PROMPT.format(
        signal_text=signal.get("signal_text", ""),
        customers_data=json.dumps(customers_data, indent=2)
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

        results = json.loads(raw_text.strip())
        if not isinstance(results, list):
            results = [results]
        return results

    except Exception as e:
        print(f"[EngagementAgent] Batch opening messages failed: {e}")
        return []


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
    
    # 1. Fetch products for all customers to create a products_map
    products_map = {}
    for customer in customers:
        p_id = customer.get("recommended_product", "")
        if p_id and p_id not in products_map:
            p_data = get_product_by_id(p_id)
            if not p_data:
                p_data = {
                    "product_id": p_id,
                    "name": p_id.replace("_", " ").title(),
                    "benefit": "Financial protection and support",
                    "description": "",
                    "eligibility": ""
                }
            products_map[p_id] = p_data

    # 2. Batch generate opening messages
    print(f"[EngagementAgent] Batch generating opening messages for {len(customers)} customers...")
    batch_results = generate_opening_messages_batch(customers, signal, products_map)
    
    # Create lookup map
    msg_map = {res.get("customer_id"): res for res in batch_results if isinstance(res, dict)}

    for customer in customers:
        product_id = customer.get("recommended_product", "")
        product = products_map.get(product_id, {})

        # Build campaign context (from Drishti_Backend's campaign_orchestrator + explanation_agent)
        segment = signal.get("affected_segment", "all")
        priority = "HIGH" if segment in ("KCC",) else "MEDIUM" if segment in ("MSME", "home_loan") else "LOW"

        campaign_context = {
            "priority": priority,
            "explanation": (
                f"Signal: {signal.get('signal_text', '')[:120]}. "
                f"Customer {customer.get('name', '')} ({customer.get('occupation', 'N/A')}) "
                f"matched via {segment} segment in {customer.get('district', 'N/A')}, "
                f"{customer.get('state', 'N/A')}. "
                f"Recommended {product.get('name', product_id)} due to: {customer.get('reasoning', 'profile match')}."
            ),
            "customer_profile": {
                "occupation": customer.get("occupation", "N/A"),
                "credit_score": customer.get("credit_score"),
                "farm_size": customer.get("farm_size"),
                "crop_type": customer.get("crop_type"),
                "business_type": customer.get("business_type"),
                "income_bracket": customer.get("income_bracket", "N/A"),
                "existing_loans": customer.get("existing_loans", "None"),
            },
        }

        # Get generated message from map, fallback if missing
        msg_data = msg_map.get(customer["id"])
        if not msg_data:
            msg_data = {
                "message": f"Namaste {customer.get('name', '')} ji. Kya aap hamare naye offer ke baare mein jaanna chahenge?",
                "message_english": f"Hello {customer.get('name', '')}. Would you like to know about our new offer?"
            }

        lang_override = signal.get("language_override")
        if lang_override:
            lang_override = lang_override.lower()

        journey = {
            "journey_id": f"j_{uuid.uuid4().hex[:8]}",
            "customer_id": customer["id"],
            "customer_name": customer.get("name", ""),
            "customer_language": lang_override if lang_override else customer.get("language", "hindi"),
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
            "campaign_context": campaign_context,
            "created_at": datetime.now().isoformat(),
            "converted_at": None,
            "messages": [
                {
                    "role": "drishti",
                    "text": msg_data.get("message", ""),
                    "text_english": msg_data.get("message_english", ""),
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
