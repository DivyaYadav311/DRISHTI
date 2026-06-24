import time
import threading
from datetime import datetime

def start_scheduler():
    """
    Spawns a daemon thread that polls the system clock.
    Triggers the crawl and pipeline loop at exactly 6:00 AM daily.
    """
    def scheduler_loop():
        print("[Scheduler] Daily 6 AM scheduler thread started.")
        while True:
            now = datetime.now()
            
            # Wakes up at 6:00 AM
            if now.hour == 6 and now.minute == 0:
                print(f"[Scheduler] Clock reached 6:00 AM. Ingesting signals...")
                try:
                    from ingest.crawlers import crawl_all_signals
                    from run_pipeline import run_pipeline
                    from main import _journeys  # runtime import to prevent circular dependency
                    
                    raw_signals = crawl_all_signals()
                    for sig in raw_signals:
                        print(f"[Scheduler] Injecting signal into DRISHTI: {sig['id']}")
                        result = run_pipeline(sig)
                        
                        # Store in FastAPI in-memory store for dashboard and simulator APIs
                        for journey in result.get("journeys", []):
                            _journeys[journey["journey_id"]] = journey
                            print(f"[Scheduler] Live journey created: {journey['journey_id']} for {journey['customer_name']}")
                            
                except Exception as e:
                    print(f"[Scheduler] Error running daily 6 AM trigger: {e}")
                
                # Sleep 60 seconds to cross the 6:00 minute boundary safely
                time.sleep(60)
                
            # Check time every 10 seconds
            time.sleep(10)

    thread = threading.Thread(target=scheduler_loop, daemon=True)
    thread.start()
