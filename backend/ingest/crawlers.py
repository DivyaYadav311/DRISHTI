"""
crawlers.py — Unified signal crawlers for DRISHTI.

Fetches real-world signals from:
  - RBI (Reserve Bank of India) press releases via RSS
  - IMD (India Meteorological Department) weather alerts
  - PIB (Press Information Bureau) government schemes
  - News API / Economic Times RSS headlines

Uses feedparser for RSS and urllib for direct HTTP.
Each crawler includes robust fallbacks for demo reliability.
"""

import urllib.request
import xml.etree.ElementTree as ET
import json
import os
from datetime import datetime

# ─── Attempt feedparser import (preferred for RSS) ────────────

try:
    import feedparser
    HAS_FEEDPARSER = True
except ImportError:
    HAS_FEEDPARSER = False
    print("[Crawler] WARNING: feedparser not installed. Using XML fallback.")
    print("[Crawler] Install with: pip install feedparser")


# ─── Helper ──────────────────────────────────────────────────

def fetch_url(url: str, timeout: int = 5) -> bytes | None:
    """Fetch URL with browser-like user agent."""
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"}
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as response:
            return response.read()
    except Exception as e:
        print(f"[Crawler] Error fetching {url}: {e}")
        return None


def fetch_google_news_rss(query: str, source_name: str, max_items: int = 3) -> list[dict]:
    """Helper to fetch from Google News RSS using a specific query string."""
    url = f"https://news.google.com/rss/search?q={urllib.parse.quote(query)}&hl=en-IN&gl=IN&ceid=IN:en"
    signals = []
    
    xml_data = fetch_url(url)
    if xml_data and HAS_FEEDPARSER:
        try:
            feed = feedparser.parse(xml_data)
            for entry in feed.entries[:max_items]:
                title = entry.get("title", "")
                signals.append({
                    "id": f"sig_{source_name.lower()}_live_{abs(hash(title)) % 100000}",
                    "signal_text": title[:300],
                    "source": source_name,
                    "timestamp": datetime.now().isoformat(),
                })
        except Exception as e:
            print(f"[Crawler] {source_name} parse error: {e}")
            
    return signals


# ─── RBI Crawler ─────────────────────────────────────────────

def fetch_rbi_signals() -> list[dict]:
    """Crawls RBI news via Google News RSS."""
    print("[Crawler] Polling RBI News...")
    signals = fetch_google_news_rss("RBI policy OR repo rate india", "RBI", max_items=2)

    # Static fallback for demo reliability
    if not signals:
        print("[Crawler] RBI: No live data. Using fallback signal.")
        signals.append({
            "id": f"sig_rbi_fallback_{datetime.now().strftime('%H%M%S')}",
            "signal_text": f"RBI updates monetary policy rules today, {datetime.now().strftime('%B %d')}. Expected to impact MSME and housing loan rates shortly.",
            "source": "RBI",
            "timestamp": datetime.now().isoformat(),
        })

    return signals


# ─── IMD Crawler ─────────────────────────────────────────────

def fetch_imd_signals() -> list[dict]:
    """Fetches IMD weather alerts via Google News RSS."""
    print("[Crawler] Polling IMD Weather Forecasts...")
    signals = fetch_google_news_rss("IMD weather forecast agriculture India OR monsoon", "IMD", max_items=2)

    # Fallback
    if not signals:
        print("[Crawler] IMD: Using fallback monsoon alert.")
        signals.append({
            "id": f"sig_imd_fallback_{datetime.now().strftime('%H%M%S')}",
            "signal_text": f"IMD issues new agricultural weather advisory for {datetime.now().strftime('%B')}. Farmers advised to monitor crop watering schedules closely.",
            "source": "IMD",
            "timestamp": datetime.now().isoformat(),
        })

    return signals


# ─── PIB Crawler ─────────────────────────────────────────────

def fetch_pib_signals() -> list[dict]:
    """Fetches PIB press releases via Google News RSS."""
    print("[Crawler] Polling PIB Release Feeds...")
    signals = fetch_google_news_rss("PIB government scheme agriculture OR MSME India", "PIB", max_items=2)

    if not signals:
        print("[Crawler] PIB: Using fallback welfare signal.")
        signals.append({
            "id": f"sig_pib_fallback_{datetime.now().strftime('%H%M%S')}",
            "signal_text": f"PIB Press Release: Govt announces expanded MSME and agricultural credit guarantee scheme for {datetime.now().strftime('%Y')}. Collateral-free loans up to Rs 5 crore now available.",
            "source": "PIB",
            "timestamp": datetime.now().isoformat(),
        })

    return signals


# ─── News / Economic Times Crawler ───────────────────────────

NEWS_FEEDS = [
    "https://economictimes.indiatimes.com/industry/banking/finance/rssfeeds/13358259.cms",
    "https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms",
    "https://economictimes.indiatimes.com/news/economy/rssfeeds/1373380680.cms",
]

NEWS_KEYWORDS = [
    "inflation", "monsoon", "economy", "agriculture", "loan", "credit",
    "MSME", "banking", "interest", "RBI", "budget", "GDP",
]


def fetch_news_signals() -> list[dict]:
    """Fetches economic headlines from ET RSS feeds or News API."""
    print("[Crawler] Polling News Headlines...")
    signals = []

    # Try Economic Times RSS via feedparser
    if HAS_FEEDPARSER:
        for feed_url in NEWS_FEEDS:
            try:
                feed = feedparser.parse(feed_url)
                for entry in feed.entries[:10]:
                    title = entry.get("title", "")
                    summary = entry.get("summary", "")
                    text = f"{title}. {summary}"

                    if any(kw.lower() in text.lower() for kw in NEWS_KEYWORDS):
                        signals.append({
                            "id": f"sig_news_live_{abs(hash(title)) % 100000}",
                            "signal_text": text[:300],
                            "source": "NEWS",
                            "timestamp": datetime.now().isoformat(),
                        })
            except Exception as e:
                print(f"[Crawler] News feed error ({feed_url}): {e}")

        if signals:
            print(f"[Crawler] News: Found {len(signals)} relevant headlines")

    # News API fallback
    if not signals:
        api_key = os.environ.get("NEWS_API_KEY", "")
        if api_key:
            url = f"https://newsapi.org/v2/top-headlines?country=in&category=business&apiKey={api_key}"
            try:
                req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
                with urllib.request.urlopen(req, timeout=5) as resp:
                    data = json.loads(resp.read().decode())
                    if data.get("status") == "ok":
                        for article in data.get("articles", [])[:3]:
                            title = article.get("title", "")
                            desc = article.get("description", "") or ""
                            signals.append({
                                "id": f"sig_news_api_{abs(hash(title)) % 100000}",
                                "signal_text": f"{title}. {desc}"[:300],
                                "source": "NEWS",
                                "timestamp": datetime.now().isoformat(),
                            })
            except Exception as e:
                print(f"[Crawler] News API failed: {e}")

    # Static fallback
    if not signals:
        print("[Crawler] News: Using fallback MSME/budget signal.")
        signals.append({
            "id": f"sig_news_fallback_{datetime.now().strftime('%H%M%S')}",
            "signal_text": "Finance Ministry expands MSME CGTMSE Credit Guarantee Scheme cover to Rs 5 Crore to support small businesses.",
            "source": "BUDGET",
            "timestamp": datetime.now().isoformat(),
        })

    return signals


# ─── Orchestrator ────────────────────────────────────────────

def crawl_all_signals() -> list[dict]:
    """Run all crawlers and return combined signal list."""
    all_signals = []
    all_signals.extend(fetch_imd_signals())
    all_signals.extend(fetch_rbi_signals())
    all_signals.extend(fetch_pib_signals())
    all_signals.extend(fetch_news_signals())
    print(f"[Crawler] Completed crawl. Gathered {len(all_signals)} raw signals.")
    return all_signals


def save_signals_to_queue(new_signals: list[dict], queue_path: str) -> list[dict]:
    """
    Merge new signals into the existing signal_queue.json,
    deduplicating by signal ID. Returns list of newly added signals.
    """
    try:
        with open(queue_path, "r") as f:
            existing = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        existing = []

    existing_ids = {s["id"] for s in existing}
    added = [s for s in new_signals if s["id"] not in existing_ids]

    if added:
        # Strict limit to prevent Gemini Free Tier rate limit exhaustion (max 2 per cycle)
        added = added[:2]
        
        combined = existing + added
        with open(queue_path, "w") as f:
            json.dump(combined, f, indent=2)
        print(f"[Crawler] Added {len(added)} new signals to queue (total: {len(combined)})")
    else:
        print(f"[Crawler] No new signals to add (queue has {len(existing)})")

    return added


if __name__ == "__main__":
    results = crawl_all_signals()
    for s in results:
        print(f"\n[{s['source']}] {s['id']}:\n  {s['signal_text']}")
