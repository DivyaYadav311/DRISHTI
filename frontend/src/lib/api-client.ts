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

export interface CampaignContext {
  priority: string;
  explanation: string;
  customer_profile: {
    occupation: string;
    credit_score: number | null;
    farm_size: number | null;
    crop_type: string | null;
    business_type: string | null;
    income_bracket: string;
    existing_loans: string;
  };
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
  campaign_context?: CampaignContext;
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
  signals_in_queue: number;
  channels: { sms: number; yono: number; rm_alert: number };
}

export interface CustomerRecord {
  id: string;
  name: string;
  age: number;
  state: string;
  district: string;
  language: string;
  account_types: string[];
  kcc_limit: number;
  loan_amount: number;
  income_bracket: string;
  repayment_status: string;
  dependents: number;
  digital_access: string;
  salary_source: string | null;
  occupation: string;
  business_type: string | null;
  farm_size: number | null;
  crop_type: string | null;
  credit_score: number | null;
  existing_loans: string;
}

export interface FetchSignalsResult {
  success: boolean;
  fetched: number;
  new_added: number;
  signals: RawSignal[];
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

/** Fetch fresh signals from live crawlers */
export function triggerSignalFetch() {
  return apiFetch<FetchSignalsResult>("/api/signals/fetch", {
    method: "POST",
  });
}

/** Run a specific signal through the pipeline (background) */
export function runSignalById(signalId: string) {
  return apiFetch<{ status: string; signal_id: string; signal_text: string }>(
    `/api/signals/${signalId}/run`,
    { method: "POST" }
  );
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

/** Get customers from the database */
export function fetchCustomers(filters?: { segment?: string; state?: string; limit?: number }) {
  const params = new URLSearchParams();
  if (filters?.segment) params.set("segment", filters.segment);
  if (filters?.state) params.set("state", filters.state);
  if (filters?.limit) params.set("limit", String(filters.limit));
  const qs = params.toString();
  return apiFetch<{ customers: CustomerRecord[]; total: number }>(
    `/api/customers${qs ? `?${qs}` : ""}`
  );
}

/** Get a single customer profile */
export function fetchCustomer(customerId: string) {
  return apiFetch<{ customer: CustomerRecord }>(`/api/customers/${customerId}`);
}
