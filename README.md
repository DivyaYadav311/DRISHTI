# DRISHTI 👁️
### SBI's World-Aware Anticipatory Banking Agent

> "Every banking AI reacts to what a customer did yesterday. DRISHTI reads what the world is doing today — and protects SBI's customers before they even feel it."

**Drishti** (दृष्टि) means *foresight* — and that's exactly what this system gives SBI.

---

## 🔍 The Problem

Every banking AI built today is **reactive**: a customer opens the app, asks a question, and the bot responds. That model works for digitally fluent, self-directed users.

It doesn't work for SBI — the bank that holds **500 million Indians**: farmers, weavers, Jan Dhan account holders, pensioners, and rural business owners. These customers don't ask. They wait, struggle silently, or never find out a relevant product existed until it's too late.

SBI's customer base *is* India's economy — which means public events (monsoon forecasts, RBI interest rate changes, government scheme calendars) hit SBI customers first, hardest, and most predictably. No one is using that.

---

## 💡 The Idea

DRISHTI is a multi-agent system that monitors **public world signals** — weather, monetary policy, government scheme calendars, economic news — and cross-references them against SBI's customer segments to **proactively trigger personalized banking outreach**, before the customer ever opens the app or walks into a branch.

```
World Signal Layer (public, free, zero PII)
        ↓
IMD monsoon forecasts · RBI policy announcements
PM-KISAN/scheme calendars · Budget & regulatory news
        +
Customer Signal Layer (synthetic data)
        ↓
Account type · Region · Repayment history · Income bracket
        =
Anticipatory Action
   → Right product, right customer, right moment — before they ask
```

### Why this is uniquely an SBI story

| Signal | Private Bank (HDFC/ICICI) | SBI |
|---|---|---|
| Monsoon forecast | Irrelevant — mostly urban customers | Critical — crore+ farmer accounts |
| PM-KISAN cycles | No Jan Dhan exposure | Core customer segment |
| Government salary release | Small slice of base | Largest government salary bank |
| Rural pincode coverage | Limited | Every district in India |

No fintech startup or private bank has the customer mix to make this meaningful. DRISHTI only makes sense for SBI.

---

## 🧩 Architecture Overview

```
┌─────────────────────────────────┐
│       WORLD SIGNAL AGENT        │
│  IMD · RBI · PIB · NewsAPI      │ (crawlers.py / scheduler.py)
│  Parses + tags incoming signals │
└──────────────┬───────────────────┘
               ↓
┌─────────────────────────────────┐
│     RELEVANCE MAPPING AGENT     │
│  Signal × Customer Segment      │ (relevance_agent.py)
│  Scores urgency + opportunity   │
└──────────────┬───────────────────┘
               ↓
┌─────────────────────────────────┐
│    ENGAGEMENT DELIVERY AGENT    │
│  Chooses channel & tone         │ (engagement_agent.py)
│  Runs multi-turn conversation   │
│  Hands off to RM if needed      │
└─────────────────────────────────┘
```

---

## ✨ Features Implemented

The prototype is complete with the following production-ready features:

### 1. Daily 6 AM Ingestion & Scheduler (`backend/scheduler.py` & `backend/ingest/crawlers.py`)
* **Real Crawlers**: Implements RSS feed parsing for the **RBI Press Releases** (`rbi.org.in`) and **IMD Weather Bulletins** (`mausam.imd.gov.in`) to fetch macroeconomic and agricultural events.
* **Cron Daemon**: Spawns a background thread on startup that checks the clock and automatically executes the pipeline when local time hits exactly `06:00:00` daily.

### 2. Three-Agent LangGraph Cognitive Pipeline
* **Signal Enrichment**: cleans, formats, and categorizes incoming events (agricultural, policy, scheme, economic).
* **Relevance Engine**: Queries candidate customers in `customers.db` matching the signal profile, retrieves optimal SBI product matches from ChromaDB using Vector RAG, and ranks candidate pairs.
* **Engagement Generation**: Writes context-aware, personalized opening messages in the customer's native tongue (Hindi, Marathi, English) optimized for the selected channel (WhatsApp, SMS, or YONO).

### 3. Dynamic Multilingual Conversation & Language Detection
* **Real-time Translation & Switching**: When a customer replies in a different language mid-chat (e.g. replying to Hindi in English), the LLM dynamically detects the language swap, updates the journey state, and switches its responses to match the customer's chosen tongue.
* **Dynamic Header Rendering**: The simulated device screen header adapts in real-time to display the active language (e.g., `SMS · English`).

### 4. Interactive Device Simulator (`/simulator`)
* Renders fully custom iOS/Android frames for WhatsApp, YONO, and SMS.
* Features a **theme-responsive SMS chat interface** that handles light and dark mode styling with legible line-heights for Hindi and Marathi Devanagari text.
* Displays a **live-updating clock** in the mobile status bar synced with the user's system time.

### 5. Signal & Agent Canvas (`/agents`)
* Displays the LangGraph state machine loop interactively. Clicking nodes inspects prompt templates, model versions, token throughput, and estimated costs.
* Includes a **Copy Template** clipboard utility for prompt engineering.
* Runs a live log streaming terminal, complete with ticking real-time local timestamps to track pipeline executions.

### 6. Executive Control Room Dashboard (`/dashboard`)
* Polls stats and customer tracker journeys dynamically using React Query every 3 seconds.
* Merges simulated live conversations into the manager's ledger, updating key conversion counts and badges in real-time.
* Features a **Light/Dark Mode toggle** that switches stylesheet properties across all components.

---

## 🛠️ Tech Stack

* **Orchestration**: LangGraph, Python FastAPI, Uvicorn
* **Model**: Google Gemini 2.0 Flash (free tier)
* **Embeddings**: ChromaDB / Vector Search RAG
* **Frontend**: React, TanStack Start, Tailwind v4 CSS, Lucide Icons, Shadcn Sidebar
* **Database**: SQLite (synthetic customer data)

---

## 🚀 Getting Started & Execution Instructions

Follow these instructions to run the DRISHTI stack locally:

### 1. Backend API Server Setup
```bash
# Navigate to the backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows (PowerShell):
.\venv\Scripts\activate
# On macOS / Linux:
# source venv/bin/activate

# Install requirements
pip install -r requirements.txt

# Copy credentials template and insert your Gemini API Key
cp .env.example .env
# Edit .env and paste: GEMINI_API_KEY="your_api_key_here"

# Load the SBI product catalog into the ChromaDB vector index
python data/load_products.py

# (Optional) Run the command line test to verify the full multi-agent pipeline:
python run_pipeline.py

# Start the FastAPI server using Uvicorn
uvicorn main:app --reload --port 8000
```

### 2. Frontend React Client Setup
In a new, separate terminal window:
```bash
# Navigate to the root directory
cd DRISHTI

# Install package dependencies
npm install

# Start the Vite development server
npm run dev
```

* Open your browser and navigate to **[http://127.0.0.1:3000](http://127.0.0.1:3000)**.
* Ensure both servers are running simultaneously (Backend on port `8000`, Frontend on port `3000`).

---

## 🎯 Roadmap & Uncompleted Features

While the core pipeline and UI simulator are fully functional, the following items represent upcoming items on the roadmap:

- [ ] **Real-time WebSockets**: Upgrade the operations dashboard query engine from polling (every 3s) to a live WebSocket server in FastAPI to push signal alerts instantly.
- [ ] **Human Relationship Manager (RM) Handoff Screen**: Develop the dashboard interface where a relationship manager can claim a conversation if the customer requests human assistance (e.g. clicks "Talk to RM").
- [ ] **Bulk Signal Simulator**: Enable uploading CSV/Excel sheets of regional weather data (such as block-level rainfall logs) to trigger bulk matching for thousands of customer accounts at once.
- [ ] **Core Banking System (CBS) Integration**: Implement OAuth API integrations simulating connections to real core banking systems to query live balances, credit scores, and land registry numbers.
- [ ] **SMS Gateway Connector**: Bind the SMS engagement delivery agent to a real gateway (e.g., Twilio or SBI's SMS infrastructure) to route simulated alerts to actual mobile phone numbers.
