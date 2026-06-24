import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useRef, useState } from "react";
import { Play, Pause, Cpu, Network, Send, ChevronRight, Terminal as TerminalIcon, Sparkles, Copy, Check } from "lucide-react";

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
  "[09:42:23] DEBUG google.genai       ↪ generate_content model=gemini-2.0-flash",
  "[09:42:24] OK    google.genai       ✓ 312 tokens in · 184 tokens out · cost ₹0.00 (free)",
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
        const rawLine = logLines[prev.length % logLines.length];
        const now = new Date();
        const timeStr = now.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        });
        const formattedLine = rawLine.replace(/\[\d{2}:\d{2}:\d{2}\]/, `[${timeStr}]`);
        const next = [...prev, formattedLine];
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
      <div className="flex items-center justify-between border-b border-border bg-card/60 px-3 py-2">
        <div className="flex items-center gap-2 text-xs min-w-0">
          <TerminalIcon className="h-3.5 w-3.5 text-cyan shrink-0" />
          <span className="font-mono font-semibold truncate text-[11px] text-foreground">drishti@sbi-loop:~</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="rounded-full border border-emerald/40 bg-emerald/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald">
            {playing ? "Live" : "Paused"}
          </span>
          <button
            onClick={() => setPlaying((p) => !p)}
            className="grid h-6 w-6 place-items-center rounded border border-border bg-card text-muted-foreground hover:text-foreground cursor-pointer"
          >
            {playing ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
          </button>
        </div>
      </div>
      <div
        ref={ref}
        className="h-72 overflow-y-auto bg-[oklch(0.1_0.03_252)] p-4 font-mono text-[11.5px] leading-relaxed text-emerald"
      >
        {lines.map((l, i) => (
          <div key={i} className="whitespace-pre-wrap break-words">
            <span
              className={
                l.includes("OK") ? "text-emerald" : l.includes("DEBUG") ? "text-slate-400" : "text-cyan"
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
    model: "gemini-2.0-flash + ChromaDB default embeddings",
    tokens: "312 in · 184 out",
    cost: "₹0.00 / cycle (free)",
  },
  {
    id: 2,
    title: "Relevance Mapping Agent",
    subtitle: "Cross-references vectors against SQLite indices",
    prompt:
      "Given a WorldSignal and the SBI customer index, return customer_ids whose (district, segment, product) overlap with affected_geography ∩ affected_sectors. Rank by exposure_score = balance × risk_weight.",
    model: "gemini-2.0-flash (scoring on SQLite data)",
    tokens: "1,840 in · 612 out",
    cost: "₹0.00 / cycle (free)",
  },
  {
    id: 3,
    title: "Engagement Delivery Agent",
    subtitle: "Generates localized prompts · selects channel · ships",
    prompt:
      "For each (customer, product) pair, produce a 1-2 turn message in the customer's preferred language. Match tone to segment (formal for premium, conversational for rural). Output: { channel, body, cta_options[], expected_response_schema }.",
    model: "gemini-2.0-flash + WhatsApp Cloud API / SBI SMS Gateway",
    tokens: "640 in · 220 out",
    cost: "₹0.00 / message (free)",
  },
];

function AgentGraph({ active, setActive }: { active: number; setActive: (n: number) => void }) {
  return (
    <div className="glass-card p-5">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-cyan">Multi-Agent Execution Loop</h3>
          <p className="text-xs text-muted-foreground">LangGraph state machine · Select a node to inspect prompt template</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
          <Sparkles className="h-3 w-3" /> LangGraph Pipeline
        </span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-stretch gap-3 sm:gap-4 relative">
        {nodes.map((n, i) => {
          const isActive = active === n.id;
          return (
            <div key={n.id} className="flex-1 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <button
                onClick={() => setActive(n.id)}
                className={`flex-1 group relative z-10 rounded-xl border p-4 text-left transition duration-300 flex flex-col justify-between h-full min-h-[125px] ${
                  isActive
                    ? "border-primary bg-primary/10 shadow-[0_0_15px_rgba(34,211,238,0.15)] ring-1 ring-primary/30"
                    : "border-border bg-card/40 hover:border-primary/40 hover:bg-card/70"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg font-mono text-xs font-bold transition-all duration-300 ${
                      isActive 
                        ? "bg-gradient-to-br from-cyan to-primary text-primary-foreground scale-110 shadow-md" 
                        : "bg-muted text-muted-foreground group-hover:bg-muted/80"
                    }`}
                  >
                    0{n.id}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold leading-tight text-foreground">{n.title}</div>
                    <div className="mt-1 text-[10px] text-muted-foreground leading-normal">{n.subtitle}</div>
                  </div>
                </div>
                <div className="mt-4 pt-2 border-t border-border/20 flex items-center gap-2 text-[10px] text-muted-foreground w-full">
                  <Cpu className="h-3 w-3 text-cyan/70" />
                  <span className="truncate font-mono">{n.tokens.split(" ")[0]} tokens</span>
                  <span className="ml-auto rounded bg-emerald/15 px-1.5 py-0.5 font-mono text-emerald text-[9px]">{n.cost}</span>
                </div>
              </button>
              {i < 2 && (
                <div className="flex items-center justify-center text-primary shrink-0 self-center">
                  <ChevronRight className="h-4 w-4 rotate-90 sm:rotate-0" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NodeInspector({ node }: { node: AgentNode }) {
  const [copied, setCopied] = useState(false);

  const copyPrompt = () => {
    navigator.clipboard.writeText(node.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between border-b border-border/40 pb-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-cyan">Node Inspector</div>
          <h3 className="mt-1 text-lg font-bold">{node.title}</h3>
        </div>
        <div className="rounded-md border border-primary/30 bg-primary/10 px-2.5 py-1 font-mono text-xs font-semibold text-primary">
          NODE 0{node.id}
        </div>
      </div>

      <div className="mt-4 grid gap-3 grid-cols-1 sm:grid-cols-3">
        <div className="rounded-lg border border-border/50 bg-card/40 p-3">
          <div className="text-[9px] uppercase tracking-wider text-muted-foreground">LLM Engine</div>
          <div className="mt-1 text-xs font-medium text-foreground">{node.model.split(" + ")[0]}</div>
          <div className="text-[10px] text-muted-foreground truncate">{node.model.split(" + ")[1] || "Direct invocation"}</div>
        </div>
        <div className="rounded-lg border border-border/50 bg-card/40 p-3">
          <div className="text-[9px] uppercase tracking-wider text-muted-foreground">I/O Throughput</div>
          <div className="mt-1 text-xs font-mono font-semibold text-foreground">{node.tokens}</div>
        </div>
        <div className="rounded-lg border border-emerald/20 bg-emerald/5 p-3">
          <div className="text-[9px] uppercase tracking-wider text-emerald">Estimated Cost</div>
          <div className="mt-1 text-xs font-mono font-bold text-emerald">{node.cost}</div>
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Active Prompt Template</span>
          <button 
            onClick={copyPrompt}
            className="flex items-center gap-1 text-[10px] text-cyan hover:underline transition-colors"
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? "Copied" : "Copy Template"}
          </button>
        </div>
        <pre className="overflow-x-auto rounded-lg border border-border bg-[#111827] p-4 font-mono text-[11px] leading-relaxed text-slate-200 whitespace-pre-wrap">
          {node.prompt}
        </pre>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-[9px]">
        {["temperature: 0.2", "max_tokens: 1024", "stream: true", "tool_choice: auto"].map((t) => (
          <span key={t} className="rounded border border-border/60 bg-card/40 px-2 py-1 font-mono text-muted-foreground">
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

function OutboundChannels() {
  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-cyan">
        <Send className="h-4 w-4" /> Outbound Distribution (Last Hr)
      </div>
      <div className="mt-4 space-y-4">
        {[
          { label: "WhatsApp Cloud API", value: 184, max: 184, tone: "emerald" },
          { label: "SBI SMS Gateway", value: 98, max: 184, tone: "cyan" },
          { label: "YONO Push (FCM)", value: 60, max: 184, tone: "primary" },
        ].map((b) => (
          <div key={b.label} className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="text-muted-foreground font-medium">{b.label}</span>
              <span className="font-mono text-foreground font-bold">{b.value} msg</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted/60">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(b.value / b.max) * 100}%`,
                  background: `var(--${b.tone})`,
                }}
              />
            </div>
          </div>
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
          <Network className="h-3.5 w-3.5" /> Cognitive Engine
        </div>
        <h1 className="mt-1 text-3xl font-black tracking-tight">Signal & Agent Canvas</h1>
        <p className="text-sm text-muted-foreground">
          Directed LangGraph state machine flow — transforming public signals into contextual customer conversations.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Main canvas / interactive diagram and details */}
        <div className="space-y-6 lg:col-span-2">
          <AgentGraph active={active} setActive={setActive} />
          <NodeInspector node={node} />
        </div>

        {/* Right Column - Terminal log stream and channel metrics */}
        <div className="space-y-6">
          <Terminal />
          <OutboundChannels />
        </div>
      </div>
    </div>
  );
}
