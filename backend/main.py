"""
main.py — FastAPI backend for DRISHTI.

Exposes the multi-agent pipeline as REST endpoints.
Start with: uvicorn main:app --reload --port 8000
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import json
import os

from run_pipeline import run_pipeline
from agents.engagement_agent import continue_conversation
from agents.rag import load_products_into_chroma

# ─── App Setup ─────────────────────────────────────────────────
app = FastAPI(
    title="DRISHTI API",
    description="SBI's World-Aware Anticipatory Banking Agent — Backend API",
    version="1.0.0",
)

# CORS — allow frontend on any localhost port
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── In-Memory Journey Store ──────────────────────────────────
# In production this would be a database. For the hackathon demo, in-memory is fine.
_journeys: dict[str, dict] = {}

# ─── Data Paths ───────────────────────────────────────────────
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
SIGNALS_PATH = os.path.join(DATA_DIR, "signal_queue.json")
PRODUCTS_PATH = os.path.join(DATA_DIR, "products.json")


# ─── Pydantic Models ──────────────────────────────────────────
class SignalInput(BaseModel):
    id: str
    signal_text: str
    source: str
    timestamp: str


class ConversationInput(BaseModel):
    journey_id: str
    customer_reply: str


class CustomSignalInput(BaseModel):
    signal_text: str
    source: Optional[str] = "CUSTOM"


# ─── Startup ──────────────────────────────────────────────────
@app.on_event("startup")
async def startup_event():
    """Load product catalog into ChromaDB and start scheduler on startup."""
    try:
        load_products_into_chroma()
        print("[DRISHTI API] Product catalog loaded into ChromaDB ✓")
    except Exception as e:
        print(f"[DRISHTI API] Warning: Could not load products: {e}")

    try:
        from scheduler import start_scheduler
        start_scheduler()
        print("[DRISHTI API] Daily 6 AM background scheduler initialized ✓")
    except Exception as e:
        print(f"[DRISHTI API] Warning: Could not start scheduler: {e}")


# ─── Endpoints ─────────────────────────────────────────────────

@app.get("/api/health")
def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "DRISHTI API",
        "version": "1.0.0",
        "agents": ["signal_agent", "relevance_agent", "engagement_agent"],
        "llm": "gemini-2.0-flash (free)",
    }


@app.get("/api/signals")
def get_signals():
    """Return available signals from the queue."""
    try:
        with open(SIGNALS_PATH, "r") as f:
            signals = json.load(f)
        return {"signals": signals}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/products")
def get_products():
    """Return the SBI product catalog."""
    try:
        with open(PRODUCTS_PATH, "r") as f:
            products = json.load(f)
        return {"products": products}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/pipeline/run")
def run_pipeline_endpoint(signal: SignalInput):
    """
    Run the full DRISHTI pipeline for a given signal.
    
    Takes a raw signal → enriches it → matches customers → generates outreach.
    Returns journeys with personalized messages.
    """
    raw_signal = signal.model_dump()

    result = run_pipeline(raw_signal)

    if result.get("error") and not result.get("journeys"):
        raise HTTPException(status_code=500, detail=result["error"])

    # Store journeys in memory for conversation continuation
    for journey in result.get("journeys", []):
        _journeys[journey["journey_id"]] = journey

    return {
        "success": True,
        "signal": result.get("enriched_signal", {}),
        "matched_customers": len(result.get("matched_customers", [])),
        "journeys": result.get("journeys", []),
        "error": result.get("error"),
    }


@app.post("/api/pipeline/simulate")
def simulate_signal(input: CustomSignalInput):
    """
    Simulate a custom signal through the pipeline.
    Useful for live demos — type any signal text and see DRISHTI respond.
    """
    from datetime import datetime

    raw_signal = {
        "id": f"sig_custom_{datetime.now().strftime('%H%M%S')}",
        "signal_text": input.signal_text,
        "source": input.source,
        "timestamp": datetime.now().isoformat(),
    }

    result = run_pipeline(raw_signal)

    for journey in result.get("journeys", []):
        _journeys[journey["journey_id"]] = journey

    return {
        "success": True,
        "signal": result.get("enriched_signal", {}),
        "matched_customers": len(result.get("matched_customers", [])),
        "journeys": result.get("journeys", []),
        "error": result.get("error"),
    }


@app.post("/api/pipeline/continue")
def continue_conversation_endpoint(input: ConversationInput):
    """
    Continue an existing customer conversation.
    
    Takes a journey_id + customer reply, runs the engagement agent 
    for the next turn, and returns the updated journey.
    """
    journey = _journeys.get(input.journey_id)
    if not journey:
        raise HTTPException(
            status_code=404,
            detail=f"Journey {input.journey_id} not found. Run the pipeline first."
        )

    updated = continue_conversation(journey, input.customer_reply)
    _journeys[input.journey_id] = updated

    return {
        "success": True,
        "journey": updated,
    }


@app.get("/api/journeys")
def get_journeys():
    """Return all active journeys."""
    return {
        "journeys": list(_journeys.values()),
        "total": len(_journeys),
    }


@app.get("/api/journeys/{journey_id}")
def get_journey(journey_id: str):
    """Return a specific journey by ID."""
    journey = _journeys.get(journey_id)
    if not journey:
        raise HTTPException(status_code=404, detail="Journey not found")
    return {"journey": journey}


@app.get("/api/stats")
def get_stats():
    """Return pipeline stats for the dashboard."""
    journeys = list(_journeys.values())
    converted = [j for j in journeys if j.get("status") == "converted"]
    active = [j for j in journeys if j.get("status") in ("pending", "active")]

    return {
        "total_journeys": len(journeys),
        "active_conversations": len(active),
        "converted": len(converted),
        "conversion_rate": round(len(converted) / max(len(journeys), 1) * 100, 1),
        "channels": {
            "sms": len([j for j in journeys if j.get("channel") == "sms"]),
            "yono": len([j for j in journeys if j.get("channel") == "yono"]),
            "rm_alert": len([j for j in journeys if j.get("channel") == "rm_alert"]),
        },
    }
