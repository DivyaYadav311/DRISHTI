/**
 * api-client.ts — Centralized client for calling the DRISHTI FastAPI backend.
 *
 * Base URL defaults to localhost:8000 (the uvicorn dev server).
 */

const API_BASE = "http://localhost:8000";

/* ─── Types ────────────────────────────────────────────────── */

export interface RawSignal {
  id: string;
  signal_text: string;
  source: string;
  timestamp: string;
}

export interface JourneyMessage {
  role: "drishti" | "customer";
  text: string;
  text_english: string;
  timestamp: string;
}

export interface Journey {
  journey_id: string;
  customer_id: string;
  customer_name: string;
  customer_language: string;
  customer_state: string;
  customer_district: string;
  signal_id: string;
  signal_text: string;
  signal_type: string;
  product_recommended: string;
  product_name: string;
  product_details: Record<string, unknown>;
  reasoning: string;
  urgency_score: number;
  channel: string;
  tone: string;
  status: "pending" | "active" | "converted" | "dropped";
  created_at: string;
  converted_at: string | null;
  messages: JourneyMessage[];
}

export interface PipelineResult {
  success: boolean;
  signal: Record<string, unknown>;
  matched_customers: number;
  journeys: Journey[];
  error: string | null;
}

export interface ContinueResult {
  success: boolean;
  journey: Journey;
}

export interface StatsResult {
  total_journeys: number;
  active_conversations: number;
  converted: number;
  conversion_rate: number;
  channels: { sms: number; yono: number; rm_alert: number };
}

/* ─── API Functions ────────────────────────────────────────── */

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `API error ${res.status}`);
  }

  return res.json() as Promise<T>;
}

/** Health check — verify backend is running */
export function checkHealth() {
  return apiFetch<{ status: string; llm: string }>("/api/health");
}

/** Get all available signals from the queue */
export function fetchSignals() {
  return apiFetch<{ signals: RawSignal[] }>("/api/signals");
}

/** Get the SBI product catalog */
export function fetchProducts() {
  return apiFetch<{ products: Record<string, unknown>[] }>("/api/products");
}

/** Run the full pipeline for a signal */
export function runPipeline(signal: RawSignal) {
  return apiFetch<PipelineResult>("/api/pipeline/run", {
    method: "POST",
    body: JSON.stringify(signal),
  });
}

/** Simulate a custom signal */
export function simulateSignal(signalText: string, source = "CUSTOM") {
  return apiFetch<PipelineResult>("/api/pipeline/simulate", {
    method: "POST",
    body: JSON.stringify({ signal_text: signalText, source }),
  });
}

/** Continue an existing conversation */
export function continueConversation(journeyId: string, customerReply: string) {
  return apiFetch<ContinueResult>("/api/pipeline/continue", {
    method: "POST",
    body: JSON.stringify({ journey_id: journeyId, customer_reply: customerReply }),
  });
}

/** Get all active journeys */
export function fetchJourneys() {
  return apiFetch<{ journeys: Journey[]; total: number }>("/api/journeys");
}

/** Get a specific journey */
export function fetchJourney(journeyId: string) {
  return apiFetch<{ journey: Journey }>(`/api/journeys/${journeyId}`);
}

/** Get pipeline stats */
export function fetchStats() {
  return apiFetch<StatsResult>("/api/stats");
}
