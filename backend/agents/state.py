from typing import TypedDict, List, Optional


class DrishtiState(TypedDict):
    # Input — raw signal from Person 2's queue
    raw_signal: dict

    # After Signal Agent — enriched + structured signal
    enriched_signal: dict

    # After Relevance Agent — matched + scored customers
    matched_customers: List[dict]

    # After Engagement Agent — full journeys with messages
    journeys: List[dict]

    # Error tracking
    error: Optional[str]
