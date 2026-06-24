import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Play, Pause, Cpu, Network, Send, ChevronRight, Terminal as TerminalIcon, Sparkles } from "lucide-react";

export const Route = createFileRoute("/agents")({
  head: () => ({
    meta: [
      { title: "Signal & Agent Canvas · DRISHTI" },
      { name: "description", content: "LangGraph multi-agent architecture for SBI's anticipatory banking system." },
    ],
  }),
  component: AgentsPage,
});

const logLines = [
  "[09:42:18] INFO  langgraph.runtime  → Starting cycle #88472",
  "[09:42:18] DEBUG signal.ingest      ↪ Polling https://mausam.imd.gov.in/rss/forecast.xml",
  "[09:42:19] OK    rss.parser         ✓ 14 districts parsed | 4 high-deficit flagged",
  "[09:42:19] DEBUG pdf.extract        ↪ rbi.org.in/PressRelease/2026-06-mpc.pdf (412 KB)",
  "[09:42:20] OK    pypdf2.extract     ✓ 8 pages | 1 actionable macro event detected",
  "[09:42:20] INFO  vector.embed       ↪ text-embedding-3-large on 14 chunks",
  "[09:42:21] OK    pinecone.upsert    ✓ namespace=world_signals · vectors=14",
  "[09:42:21] INFO  agent.world        → Emitting WorldSignal(id=sig-imd-001, urgency=HIGH)",
  "[09:42:22] INFO  agent.relevance    → SQLite: WHERE district IN ('Amravati','Yavatmal','Akola','Beed')",
  "[09:42:22] OK    sqlite.kcc_index   ✓ 847 KCC accounts matched · avg_limit=₹1.1L",
  "[09:42:23] INFO  agent.engagement   → Selecting prompt: prompts/pmfby_marathi_v3.j2",
  "[09:42:23] DEBUG anthropic.claude   ↪ messages.create model=claude-3-5-sonnet-20241022",
  "[09:42:24] OK    anthropic.claude   ✓ 312 tokens in · 184 tokens out · cost ₹0.04",
  "[09:42:24] INFO  channel.whatsapp   → POST graph.facebook.com/v19.0/messages",
  "[09:42:25] OK    whatsapp.cloud     ✓ message_id=wamid.HBgM... · status=delivered",
  "[09:42:25] INFO  langgraph.runtime  ↩ Cycle complete · state persisted",
  "",
];

function Terminal() {
  const [playing, setPlaying] = useState(true);
  const [lines, setLines] = useState<string[]>(logLines.slice(0, 4));
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setLines((prev) => {
        const next = [...prev, logLines[prev.length % logLines.length]];
        return next.slice(-22);
      });
    }, 700);
    return () => clearInterval(id);
  }, [playing]);

  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight });
  }, [lines]);

  return (
    <div className="glass-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-border bg-card/60 px-4 py-2">
        <div className="flex items-center gap-2 text-xs">
          <TerminalIcon className="h-3.5 w-3.5 text-cyan" />
          <span className="font-mono font-semibold">drishti@signal-parser ~ </span>
          <span className="text-muted-foreground">python -m drishti.ingest --stream</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-emerald/40 bg-emerald/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald">
            {playing ? "Streaming" : "Paused"}
          </span>
          <button
            onClick={() => setPlaying((p) => !p)}
            className="grid h-7 w-7 place-items-center rounded-md border border-border bg-card text-muted-foreground hover:text-foreground"
          >
            {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
      <div
        ref={ref}
        className="h-72 overflow-y-auto bg-[oklch(0.1_0.03_252)] p-4 font-mono text-[11.5px] leading-relaxed text-emerald"
      >
        {lines.map((l, i) => (
          <div key={i} className="whitespace-pre">
            <span
              className={
                l.includes("OK") ? "text-emerald" : l.includes("DEBUG") ? "text-muted-foreground" : "text-cyan"
              }
            >
              {l}
            </span>
          </div>
        ))}
        <div className="mt-1 inline-block h-3 w-2 animate-pulse bg-emerald" />
      </div>
    </div>
  );
}

type AgentNode = {
  id: number;
  title: string;
  subtitle: string;
  prompt: string;
  model: string;
  tokens: string;
  cost: string;
};

const nodes: AgentNode[] = [
  {
    id: 1,
    title: "World Signal Agent",
    subtitle: "Fetches macro data → extracts geo/economic vectors",
    prompt:
      "You are a macroeconomic signal extractor. Given raw RBI / IMD / PIB documents, output JSON: { signal_type, geography[], affected_sectors[], urgency, time_horizon }. Use ISO-3166-2 codes for Indian states.",
    model: "claude-3-5-sonnet-20241022 + text-embedding-3-large",
    tokens: "312 in · 184 out",
    cost: "₹0.04 / cycle",
  },
  {
    id: 2,
    title: "Relevance Mapping Agent",
    subtitle: "Cross-references vectors against SQLite indices",
    prompt:
      "Given a WorldSignal and the SBI customer index, return customer_ids whose (district, segment, product) overlap with affected_geography ∩ affected_sectors. Rank by exposure_score = balance × risk_weight.",
    model: "claude-3-5-sonnet-20241022 (tool-calling on SQLite MCP)",
    tokens: "1,840 in · 612 out",
    cost: "₹0.21 / cycle",
  },
  {
    id: 3,
    title: "Engagement Delivery Agent",
    subtitle: "Generates localized prompts · selects channel · ships",
    prompt:
      "For each (customer, product) pair, produce a 1-2 turn message in the customer's preferred language. Match tone to segment (formal for premium, conversational for rural). Output: { channel, body, cta_options[], expected_response_schema }.",
    model: "claude-3-5-sonnet-20241022 + WhatsApp Cloud API / SBI SMS Gateway",
    tokens: "640 in · 220 out",
    cost: "₹0.08 / message",
  },
];

function AgentGraph({ active, setActive }: { active: number; setActive: (n: number) => void }) {
  return (
    <div className="glass-card p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-[0.15em]">Multi-Agent Execution Loop</h3>
          <p className="text-xs text-muted-foreground">LangGraph state machine · click a node for prompt & cost</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
          <Sparkles className="h-3 w-3" /> Anthropic · LangGraph
        </span>
      </div>

      <div className="relative grid gap-4 md:grid-cols-3">
        {/* connectors */}
        <div className="pointer-events-none absolute inset-x-0 top-1/2 hidden h-px -translate-y-1/2 md:block">
          <div className="mx-auto h-px w-[80%] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        </div>
        {nodes.map((n, i) => {
          const isActive = active === n.id;
          return (
            <button
              key={n.id}
              onClick={() => setActive(n.id)}
              className={`group relative z-10 rounded-xl border p-4 text-left transition ${
                isActive
                  ? "border-primary/60 bg-primary/10 glow-cyan"
                  : "border-border bg-card/60 hover:border-primary/40"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg font-mono font-bold ${
                    isActive ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                  }`}
                >
                  0{n.id}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold">{n.title}</div>
                  <div className="truncate text-[11px] text-muted-foreground">{n.subtitle}</div>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground">
                <Cpu className="h-3 w-3" />
                <span className="truncate font-mono">{n.tokens}</span>
                <span className="ml-auto rounded bg-emerald/15 px-1.5 py-0.5 font-mono text-emerald">{n.cost}</span>
              </div>
              {i < 2 && (
                <ChevronRight className="absolute -right-3 top-1/2 hidden h-5 w-5 -translate-y-1/2 text-primary md:block" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function NodeInspector({ node }: { node: AgentNode }) {
  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-cyan">Node Inspector</div>
          <h3 className="mt-1 text-xl font-bold">{node.title}</h3>
        </div>
        <div className="rounded-md border border-primary/30 bg-primary/10 px-2 py-1 font-mono text-xs text-primary">
          NODE 0{node.id}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-md border border-border bg-card/60 p-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Model</div>
          <div className="mt-1 text-xs font-mono">{node.model}</div>
        </div>
        <div className="rounded-md border border-border bg-card/60 p-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Token Throughput</div>
          <div className="mt-1 text-xs font-mono">{node.tokens}</div>
        </div>
        <div className="rounded-md border border-emerald/30 bg-emerald/5 p-3">
          <div className="text-[10px] uppercase tracking-wider text-emerald">Cost</div>
          <div className="mt-1 text-xs font-mono">{node.cost}</div>
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">Active Prompt Template</div>
        <pre className="overflow-x-auto rounded-md border border-border bg-[oklch(0.12_0.035_252)] p-3 font-mono text-[11.5px] leading-relaxed text-foreground/90">
{node.prompt}
        </pre>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-[10px]">
        {["temperature: 0.2", "max_tokens: 1024", "stream: true", "tool_choice: auto"].map((t) => (
          <span key={t} className="rounded border border-border bg-card/60 px-2 py-1 font-mono text-muted-foreground">
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

function AgentsPage() {
  const [active, setActive] = useState(1);
  const node = nodes.find((n) => n.id === active)!;
  return (
    <div className="space-y-6 p-6">
      <div>
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan">
          <Network className="h-3.5 w-3.5" /> Signal Ingestion & Multi-Agent Canvas
        </div>
        <h1 className="mt-1 text-3xl font-black tracking-tight">LangGraph Cognitive Pipeline</h1>
        <p className="text-sm text-muted-foreground">
          Three specialized agents run in a directed graph — from raw macro events to in-pocket customer messages.
        </p>
      </div>

      <Terminal />
      <AgentGraph active={active} setActive={setActive} />
      <NodeInspector node={node} />

      <div className="glass-card p-5">
        <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.15em]">
          <Send className="h-4 w-4 text-cyan" /> Outbound Channel Distribution (last hour)
        </div>
        <div className="mt-4 space-y-3">
          {[
            { label: "WhatsApp Cloud API", value: 184, tone: "emerald" },
            { label: "SBI SMS Gateway", value: 98, tone: "cyan" },
            { label: "YONO Push (FCM)", value: 60, tone: "primary" },
          ].map((b) => (
            <div key={b.label} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{b.label}</span>
                <span className="font-mono">{b.value} msg</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(b.value / 184) * 100}%`,
                    background: `var(--${b.tone})`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
