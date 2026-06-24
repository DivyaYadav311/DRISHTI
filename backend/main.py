"""
main.py — FastAPI backend for DRISHTI.

Exposes the multi-agent pipeline as REST endpoints.
Start with: uvicorn main:app --reload --port 8000
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import json
import os
import sqlite3

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
DB_PATH = os.path.join(DATA_DIR, "customers.db")


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


# ─── Helper Functions ──────────────────────────────────────────

def _load_signals() -> list[dict]:
    """Load signals from the queue file."""
    try:
        with open(SIGNALS_PATH, "r") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return []


def _save_signals(signals: list[dict]):
    """Save signals to the queue file."""
    with open(SIGNALS_PATH, "w") as f:
        json.dump(signals, f, indent=2)


# ─── Core Endpoints ───────────────────────────────────────────

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
        signals = _load_signals()
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


# ─── Signal Fetch & Run Endpoints ─────────────────────────────

@app.post("/api/signals/fetch")
def fetch_new_signals():
    """
    Trigger all crawlers to fetch fresh signals from live sources.
    Deduplicates against existing queue.
    Returns count of new signals added.
    """
    try:
        from ingest.crawlers import crawl_all_signals, save_signals_to_queue
        raw_signals = crawl_all_signals()
        added = save_signals_to_queue(raw_signals, SIGNALS_PATH)
        return {
            "success": True,
            "fetched": len(raw_signals),
            "new_added": len(added),
            "signals": added,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Crawl failed: {str(e)}")


@app.post("/api/signals/{signal_id}/run")
def run_signal_by_id(signal_id: str, background_tasks: BackgroundTasks):
    """
    Take a signal from the queue by ID and run it through the full pipeline.
    Processing happens in the background; results appear in /api/journeys.
    """
    signals = _load_signals()
    signal = next((s for s in signals if s["id"] == signal_id), None)
    if not signal:
        raise HTTPException(status_code=404, detail=f"Signal {signal_id} not found in queue")

    background_tasks.add_task(_process_signal_background, signal)
    return {
        "status": "processing_started",
        "signal_id": signal_id,
        "signal_text": signal["signal_text"][:100],
    }


def _process_signal_background(signal: dict):
    """Background task to process a signal through the pipeline."""
    try:
        result = run_pipeline(signal)
        for journey in result.get("journeys", []):
            _journeys[journey["journey_id"]] = journey
            print(f"[Pipeline] Journey created: {journey['journey_id']} → {journey['customer_name']}")
        print(f"[Pipeline] Signal {signal['id']} processed: {len(result.get('journeys', []))} journeys")
    except Exception as e:
        print(f"[Pipeline] Error processing signal {signal['id']}: {e}")


# ─── Pipeline Endpoints ───────────────────────────────────────

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


# ─── Journey Endpoints ────────────────────────────────────────

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


# ─── Customer Endpoints ───────────────────────────────────────

@app.get("/api/customers")
def get_customers(
    segment: Optional[str] = None,
    state: Optional[str] = None,
    district: Optional[str] = None,
    limit: int = 100,
):
    """
    Return customers from the SQLite database.
    Supports optional filtering by segment, state, and district.
    """
    if not os.path.exists(DB_PATH):
        raise HTTPException(status_code=500, detail="customers.db not found. Run: python -m data.init_db")

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    query = "SELECT * FROM customers WHERE 1=1"
    params = []

    if segment and segment != "all":
        query += " AND account_types LIKE ?"
        params.append(f"%{segment}%")
    if state:
        query += " AND state = ?"
        params.append(state)
    if district:
        query += " AND district = ?"
        params.append(district)

    query += f" LIMIT {min(limit, 500)}"

    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    customers = []
    for row in rows:
        c = dict(row)
        try:
            c["account_types"] = json.loads(c["account_types"])
        except Exception:
            c["account_types"] = []
        customers.append(c)

    return {
        "customers": customers,
        "total": len(customers),
    }


@app.get("/api/customers/{customer_id}")
def get_customer(customer_id: str):
    """Return a single customer's full profile."""
    if not os.path.exists(DB_PATH):
        raise HTTPException(status_code=500, detail="customers.db not found")

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM customers WHERE id = ?", (customer_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        raise HTTPException(status_code=404, detail=f"Customer {customer_id} not found")

    c = dict(row)
    try:
        c["account_types"] = json.loads(c["account_types"])
    except Exception:
        c["account_types"] = []

    return {"customer": c}


# ─── Stats Endpoint ────────────────────────────────────────────

@app.get("/api/stats")
def get_stats():
    """Return pipeline stats for the dashboard."""
    journeys = list(_journeys.values())
    converted = [j for j in journeys if j.get("status") == "converted"]
    active = [j for j in journeys if j.get("status") in ("pending", "active")]

    # Count signals in queue
    signals_count = 0
    try:
        signals = _load_signals()
        signals_count = len(signals)
    except Exception:
        pass

    return {
        "total_journeys": len(journeys),
        "active_conversations": len(active),
        "converted": len(converted),
        "conversion_rate": round(len(converted) / max(len(journeys), 1) * 100, 1),
        "signals_in_queue": signals_count,
        "channels": {
            "sms": len([j for j in journeys if j.get("channel") == "sms"]),
            "yono": len([j for j in journeys if j.get("channel") == "yono"]),
            "rm_alert": len([j for j in journeys if j.get("channel") == "rm_alert"]),
        },
    }
