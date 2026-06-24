# DRISHTI 👁️
### SBI's World-Aware Anticipatory Banking Agent

> "Every banking AI reacts to what a customer did yesterday. DRISHTI reads what the world is doing today — and protects SBI's customers before they even feel it."

**Drishti** (दृष्टि) means *foresight* — and that's exactly what this system gives SBI.

---

## 🔍 The Problem

Every banking AI built today is **reactive**: a customer opens the app, asks a question, and the bot responds. That model works for HDFC or ICICI customers who are digitally fluent and self-directed.

It doesn't work for SBI — the bank that holds **500 million Indians**: farmers, MNREGA workers, Jan Dhan account holders, pensioners, and government employees. These customers don't ask. They wait, struggle silently, or never find out a relevant product existed until it's too late.

SBI's customer base *is* India's economy — which means public events (monsoon forecasts, RBI policy changes, government scheme cycles) hit SBI customers first, hardest, and most predictably. No one is using that.

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

## ⚙️ How It Works — End to End

1. **6 AM trigger** — the World Signal Agent wakes up and pulls fresh data: IMD weather updates, RBI RSS feed, PIB scheme announcements, economic news.
2. **Signal parsing** — each item is tagged with type, urgency, region, and affected customer segment.
3. **Segment matching** — the Relevance Agent queries the customer base to find exactly who a signal applies to (e.g. *KCC holders in Maharashtra*).
4. **Opportunity scoring** — Claude reasons over the customer profile + signal + SBI product catalog to pick the right product and justify why.
5. **Engagement** — the Engagement Agent writes a personalized, multilingual message, picks the right channel (SMS / YONO / RM alert), and runs the full conversational onboarding.
6. **Conversion** — the customer replies, the agent completes onboarding in a few turns, and the dashboard logs the outcome in real time.

### Example
> IMD forecasts 23% below-normal rainfall in Vidarbha → DRISHTI flags 847 KCC holders at repayment risk → scores PMFBY crop insurance as a 91% match → sends a Marathi SMS asking if the customer wants crop cover → customer replies "Ho" → enrollment completes in 4 messages.
>
> **Result:** Acquisition cost ₹0. Time to conversion: 8 minutes. Risk mitigated: ₹1.4L.

---

## 🧩 Three-Agent Architecture

```
┌─────────────────────────────────┐
│       WORLD SIGNAL AGENT        │
│  IMD · RBI · PIB · NewsAPI      │
│  Parses + tags incoming signals │
└──────────────┬───────────────────┘
               ↓
┌─────────────────────────────────┐
│     RELEVANCE MAPPING AGENT     │
│  Signal × Customer Segment      │
│  Scores urgency + opportunity   │
└──────────────┬───────────────────┘
               ↓
┌─────────────────────────────────┐
│    ENGAGEMENT DELIVERY AGENT    │
│  Chooses channel & tone         │
│  Runs multi-turn conversation   │
│  Hands off to RM if needed      │
└─────────────────────────────────┘
```

## ✨ Core Features

1. **Signal Ingestion Engine** — pulls and structures live public data every morning into tagged signal objects (type, urgency, region, opportunity).
2. **Customer Segment Matcher** — a targeting engine (not a recommender) that runs explicit queries like `account_type = KCC AND state = Maharashtra AND repayment_status = current`.
3. **Opportunity Scorer** — Claude reasons over customer profile + signal + product catalog (grounded via RAG, no hallucination risk) to pick and justify a product.
4. **Multilingual Engagement Agent** — writes and runs the actual outreach conversation in the customer's regional language, end to end.
5. **Live Operations Dashboard** — a real-time view of world signals, active customer journeys, and conversion metrics.

---

## 🖥️ Application Pages

| Page | What it shows |
|---|---|
| **Command Center** | Live world-signal feed + active journey tracker + real-time conversion metrics |
| **Signal Intelligence** | Structured breakdown of every parsed signal; simulate new signals live |
| **Customer Segments & Matching** | Searchable synthetic customer base with a visual segment/filter builder |
| **Live Conversation Demo** | Phone-mockup view of an actual DRISHTI outreach conversation, in regional language |
| **Product Catalog & Scoring** | SBI products with relevance scores tied to active signals |
| **Impact & Analytics** | Conversion rates, cost of acquisition (₹0), risk mitigated, engagement trends |

---

## 🛠️ Tech Stack

| Layer | Tool |
|---|---|
| Multi-agent orchestration | LangGraph |
| Reasoning & conversation | Claude API |
| Product catalog RAG | ChromaDB |
| Backend / API | FastAPI |
| Frontend dashboard | React |
| Scraping (IMD / RBI) | BeautifulSoup |
| News signals | NewsAPI (free tier) |
| Customer data store | SQLite (synthetic data) |

---

## 📊 Data Sources — 100% Public, Zero PII

| Data | Source |
|---|---|
| Monsoon forecasts | IMD (imd.gov.in) |
| PM-KISAN installment calendar | PM-KISAN public portal |
| RBI policy announcements | rbi.org.in RSS feed |
| MSP / crop price announcements | CACP / PIB press releases |
| Economic news | NewsAPI / RSS |
| Festival & tax calendar | Static, hardcoded |
| Customer profiles | **Fully synthetic** — generated, not real |

No real customer data is used anywhere in this project. All synthetic data is generated for demo purposes only and contains no actual PII, which means there's nothing here for judges (or anyone else) to raise privacy concerns about.

---

## 🚀 Getting Started

```bash
# clone the repo
git clone <repo-url>
cd drishti

# backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

# frontend
cd frontend
npm install
npm run dev
```

> Add your API keys (Claude API, NewsAPI) to a `.env` file before running — see `.env.example`.

---

## 🎯 Roadmap

- [ ] Real-time WebSocket updates for the dashboard
- [ ] Expand product catalog beyond core 10–15 SBI products
- [ ] Plug in live IMD/RBI/PIB feeds (currently simulated for demo)
- [ ] Human RM handoff workflow with full context briefing
- [ ] Multi-language expansion beyond Hindi/Marathi

---

## 🏆 Why DRISHTI Wins

Every other team at this hackathon builds a system that reacts to *what a customer did*. DRISHTI reasons about *what the world is doing* — and connects that, in real time, to the only customer base in India large and diverse enough for it to matter at scale.

**This isn't a chatbot. It's foresight, built for the bank that needs it most.**
