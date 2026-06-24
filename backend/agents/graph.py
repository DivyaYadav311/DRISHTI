"""
graph.py — Builds the LangGraph pipeline wiring the 3 agents together.
"""

from langgraph.graph import StateGraph, END
from agents.state import DrishtiState
from agents.signal_agent import run_signal_agent
from agents.relevance_agent import run_relevance_agent
from agents.engagement_agent import run_engagement_agent


def should_continue_after_signal(state: dict) -> str:
    """
    Conditional edge: if signal enrichment failed, stop early.
    """
    if state.get("error") or not state.get("enriched_signal"):
        return "end"
    return "relevance_agent"


def should_continue_after_relevance(state: dict) -> str:
    """
    Conditional edge: if no customers matched, stop early.
    """
    if not state.get("matched_customers"):
        return "end"
    return "engagement_agent"


def build_graph() -> object:
    """
    Builds and compiles the full DRISHTI LangGraph pipeline.

    Flow:
        signal_agent → relevance_agent → engagement_agent → END
        (with early exit conditions at each edge)
    """
    graph = StateGraph(DrishtiState)

    # Register nodes
    graph.add_node("signal_agent", run_signal_agent)
    graph.add_node("relevance_agent", run_relevance_agent)
    graph.add_node("engagement_agent", run_engagement_agent)

    # Entry point
    graph.set_entry_point("signal_agent")

    # Conditional edges
    graph.add_conditional_edges(
        "signal_agent",
        should_continue_after_signal,
        {
            "relevance_agent": "relevance_agent",
            "end": END
        }
    )

    graph.add_conditional_edges(
        "relevance_agent",
        should_continue_after_relevance,
        {
            "engagement_agent": "engagement_agent",
            "end": END
        }
    )

    graph.add_edge("engagement_agent", END)

    return graph.compile()


# Singleton — imported by run_pipeline.py and main.py
pipeline = build_graph()
