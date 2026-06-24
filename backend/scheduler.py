import time
import threading
from datetime import datetime

def start_scheduler():
    """
    Spawns a daemon thread that polls the system clock.
    Triggers the crawl and pipeline loop every 5 minutes.
    """
    def scheduler_loop():
        print("[Scheduler] Automated background loop started. Polling every 5 minutes.")
        
        from main import SIGNALS_PATH, _journeys
        from ingest.crawlers import crawl_all_signals, save_signals_to_queue
        from run_pipeline import run_pipeline

        while True:
            try:
                print(f"[Scheduler] Running automated signal crawl at {datetime.now().strftime('%H:%M:%S')}...")
                
                # Fetch new signals
                raw_signals = crawl_all_signals()
                new_added = save_signals_to_queue(raw_signals, SIGNALS_PATH)
                
                if new_added:
                    print(f"[Scheduler] Found {len(new_added)} new signals! Auto-running pipeline...")
                    
                    for sig in new_added:
                        print(f"[Scheduler] Injecting signal into DRISHTI: {sig['id']}")
                        result = run_pipeline(sig)
                        
                        # Store in FastAPI in-memory store for dashboard
                        for journey in result.get("journeys", []):
                            _journeys[journey["journey_id"]] = journey
                            print(f"[Scheduler] Live journey created: {journey['journey_id']} for {journey['customer_name']}")
                        
                        # Wait 20 seconds between running signals to strictly respect Gemini 15 RPM Free Tier limits
                        if len(new_added) > 1:
                            print("[Scheduler] Sleeping 20s to prevent LLM rate limits...")
                            time.sleep(20)
                else:
                    print("[Scheduler] No new signals found this cycle.")

            except Exception as e:
                print(f"[Scheduler] Error running automated loop: {e}")
            
            # Wait 5 minutes before polling again
            time.sleep(300)

    thread = threading.Thread(target=scheduler_loop, daemon=True)
    thread.start()
