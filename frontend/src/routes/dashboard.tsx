import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useRef, useCallback } from "react";
import {
  Activity,
  CloudRain,
  Landmark,
  Newspaper,
  Wallet,
  Users,
  MessageSquare,
  TrendingUp,
  ChevronRight,
  ChevronLeft,
  Filter,
  Search,
  X,
  Send,
  Calendar,
  RefreshCw,
  Play,
  Loader2,
} from "lucide-react";
import { indianStates, productTypes } from "@/lib/drishti-data";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchStats, fetchJourneys, fetchSignals, triggerSignalFetch, runSignalById, continueConversation, type RawSignal, type Journey } from "@/lib/api-client";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Executive Control Room · DRISHTI" },
      { name: "description", content: "Live anticipatory banking operations cockpit for SBI." },
    ],
  }),
  component: DashboardPage,
});

const sourceIcon = {
  IMD: CloudRain,
  RBI: Landmark,
  PIB: Newspaper,
  BUDGET: Wallet,
  NEWS: Newspaper,
} as const;

const sourceTone: Record<Signal["source"], string> = {
  IMD: "bg-amber/15 text-amber border-amber/30",
  RBI: "bg-primary/15 text-primary border-primary/30",
  PIB: "bg-cyan/15 text-cyan border-cyan/30",
  BUDGET: "bg-emerald/15 text-emerald border-emerald/30",
  NEWS: "bg-muted text-muted-foreground border-border",
};

const urgencyTone = {
  High: "bg-destructive/20 text-destructive border-destructive/40",
  Medium: "bg-amber/20 text-amber border-amber/40",
  Info: "bg-cyan/15 text-cyan border-cyan/30",
} as const;

const statusTone: Record<string, string> = {
  "Awaiting Reply": "bg-amber/15 text-amber border-amber/30",
  "In-Thread Chatting": "bg-primary/15 text-primary border-primary/30",
  Converted: "bg-emerald/15 text-emerald border-emerald/30",
  "RM Escalated": "bg-destructive/15 text-destructive border-destructive/40",
  Dropped: "bg-muted text-muted-foreground border-border",
};

function MiniSpark({ values, tone = "primary" }: { values: number[]; tone?: "primary" | "emerald" | "amber" | "cyan" }) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const pts = values
    .map((v, i) => `${(i / (values.length - 1)) * 100},${30 - ((v - min) / range) * 28}`)
    .join(" ");
  const color = `var(--${tone})`;
  return (
    <svg viewBox="0 0 100 30" className="h-8 w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`sp-${tone}`} x1="0" x2="0" y1="0" x2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <polygon points={`${pts} 100,30 0,30`} fill={`url(#sp-${tone})`} />
    </svg>
  );
}

function Metric({
  label,
  value,
  sub,
  spark,
  tone,
  icon: Icon,
  pulse,
}: {
  label: string;
  value: string;
  sub: string;
  spark: number[];
  tone: "primary" | "emerald" | "amber" | "cyan";
  icon: any;
  pulse?: boolean;
}) {
  return (
    <div className="glass-card group relative overflow-hidden p-5 transition-all hover:-translate-y-0.5 hover:glow-cyan">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">{label}</span>
            {pulse && (
              <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald pulse-dot text-emerald" />
            )}
          </div>
          <div className="mt-2 text-3xl font-black tracking-tight text-foreground">{value}</div>
          <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
        </div>
        <div
          className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-border/60"
          style={{ background: `color-mix(in oklab, var(--${tone}) 18%, transparent)`, color: `var(--${tone})` }}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-3">
        <MiniSpark values={spark} tone={tone} />
      </div>
    </div>
  );
}

function SignalCard({ s }: { s: Signal }) {
  const Icon = sourceIcon[s.source];
  return (
    <div className="glass-card group p-4 transition hover:border-primary/40">
      <div className="flex items-start gap-3">
        <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-md border ${sourceTone[s.source]}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${sourceTone[s.source]}`}>
              {s.source}
            </span>
            <span className={`rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${urgencyTone[s.urgency]}`}>
              {s.urgency}
            </span>
            <span className="ml-auto font-mono text-[10px] text-muted-foreground">{s.time}</span>
          </div>
          <h4 className="mt-2 font-semibold leading-snug text-foreground">{s.title}</h4>
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{s.description}</p>
          <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
            <div>
              <div className="text-muted-foreground">Affects</div>
              <div className="text-xl font-bold tracking-tight text-foreground">{s.affected.toLocaleString("en-IN")}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Segment</div>
              <div className="truncate font-medium text-foreground">{s.segment}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Product</div>
              <div className="truncate font-medium text-cyan">{s.product}</div>
            </div>
          </div>
          <button className="mt-3 inline-flex items-center gap-1 rounded-md border border-primary/40 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary transition hover:bg-primary/20">
            View Target Pool <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

function LiveSignalCard({ s, onRun, isRunning }: { s: RawSignal; onRun: (id: string) => void; isRunning: boolean }) {
  const sourceMap: Record<string, string> = { RBI: "RBI", IMD: "IMD", PIB: "PIB", BUDGET: "BUDGET", NEWS: "NEWS", CUSTOM: "NEWS", EconomicTimes: "NEWS" };
  const src = sourceMap[s.source] || "NEWS";
  const Icon = sourceIcon[src as keyof typeof sourceIcon];
  const timeStr = new Date(s.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });

  return (
    <div className="glass-card group p-4 transition hover:border-primary/40">
      <div className="flex items-start gap-3">
        <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-md border ${sourceTone[src]}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${sourceTone[src]}`}>
              {s.source}
            </span>
            <span className="rounded border border-emerald/40 bg-emerald/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald">
              LIVE
            </span>
            <span className="ml-auto font-mono text-[10px] text-muted-foreground">{timeStr} IST</span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-foreground">{s.signal_text}</p>
          <div className="mt-3 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-primary/20 bg-primary/5 px-2.5 py-1 text-xs font-medium text-primary/70">
              <Loader2 className="h-3 w-3 animate-spin" />
              Auto-Processing
            </span>
            <span className="font-mono text-[10px] text-muted-foreground">{s.id}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardPage() {
  const [stateFilter, setStateFilter] = useState("All India");
  const [productFilter, setProductFilter] = useState("All Products");
  const [selected, setSelected] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<"today" | "7d" | "30d" | "custom">("today");
  const [customStartDate, setCustomStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split("T")[0];
  });
  const [customEndDate, setCustomEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"chat" | "vitals" | "txns" | "signal">("chat");
  const [overrideMsg, setOverrideMsg] = useState("");
  const [runningSignals, setRunningSignals] = useState<Set<string>>(new Set());
  const [fetchingSignals, setFetchingSignals] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: stats } = useQuery({
    queryKey: ["backend-stats"],
    queryFn: fetchStats,
    refetchInterval: 3000,
  });

  const { data: journeysData } = useQuery({
    queryKey: ["backend-journeys"],
    queryFn: fetchJourneys,
    refetchInterval: 3000,
  });

  const { data: liveSignalsData } = useQuery({
    queryKey: ["backend-signals"],
    queryFn: fetchSignals,
    refetchInterval: 5000,
  });

  const liveSignals = liveSignalsData?.signals ?? [];

  const handleFetchSignals = useCallback(async () => {
    setFetchingSignals(true);
    try {
      await triggerSignalFetch();
      queryClient.invalidateQueries({ queryKey: ["backend-signals"] });
    } catch (e) {
      console.error("Signal fetch failed:", e);
    } finally {
      setFetchingSignals(false);
    }
  }, [queryClient]);

  const handleRunSignal = useCallback(async (signalId: string) => {
    setRunningSignals((prev) => new Set(prev).add(signalId));
    try {
      await runSignalById(signalId);
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["backend-journeys"] });
        queryClient.invalidateQueries({ queryKey: ["backend-stats"] });
      }, 3000);
    } catch (e: any) {
      console.error("Run signal failed:", e);
      alert(`Pipeline failed: ${e.message || 'Rate limited or server error'}. Please wait a minute and try again.`);
    } finally {
      setRunningSignals((prev) => {
        const next = new Set(prev);
        next.delete(signalId);
        return next;
      });
    }
  }, [queryClient]);

  const liveCustomers = useMemo(() => {
    if (!journeysData?.journeys) return [];
    return journeysData.journeys.map((j) => {
      const statusMap: Record<string, string> = {
        pending: "Awaiting Reply",
        active: "In-Thread Chatting",
        converted: "Converted",
        dropped: "Dropped",
      };
      
      const channelMap: Record<string, string> = {
        sms: "SMS",
        yono: "YONO Push",
        rm_alert: "WhatsApp",
      };
 
      const segmentMap: Record<string, string> = {
        KCC: "KCC",
        jan_dhan: "Jan Dhan",
        home_loan: "Home Loan",
        MSME: "Business",
        salary: "Salary",
      };

      return {
        id: j.journey_id,
        name: j.customer_name,
        segment: segmentMap[j.product_details?.target_segment as string] || "KCC",
        state: j.customer_state,
        hook: j.signal_type === "agricultural" ? "IMD Drought Alert" : j.signal_type === "policy" ? "RBI Repo Cut" : "Live AI Trigger",
        channel: (channelMap[j.channel] || "WhatsApp") as any,
        status: (statusMap[j.status] || "Awaiting Reply") as any,
        product: j.product_name,
        value: `₹${Math.round(j.urgency_score * 4000 + 1000).toLocaleString("en-IN")}`,
      };
    });
  }, [journeysData]);

  const stateCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    let total = 0;
    
    liveCustomers.forEach((c) => {
      counts[c.state] = (counts[c.state] || 0) + 1;
      total++;
    });
    
    counts["All India"] = total;
    return counts;
  }, [liveCustomers]);

  const filtered = useMemo(() => {
    return liveCustomers.filter((c) => {
      const matchState = stateFilter === "All India" || c.state === stateFilter;
      const matchProduct = productFilter === "All Products" || c.segment === productFilter;
      const matchSearch =
        searchQuery.trim() === "" ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.segment.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchState && matchProduct && matchSearch;
    });
  }, [liveCustomers, stateFilter, productFilter, searchQuery]);

  const liveConvertedValue = useMemo(() => {
    if (!journeysData?.journeys) return 0;
    return journeysData.journeys
      .filter((j) => j.status === "converted")
      .reduce((acc, j) => {
        const c = liveCustomers.find((x) => x.id === j.journey_id);
        if (!c) return acc;
        const num = parseFloat(c.value.replace(/[^0-9.]/g, ""));
        return acc + (isNaN(num) ? 0 : num);
      }, 0);
  }, [journeysData, liveCustomers]);

  const computedStats = useMemo(() => {
    return {
      totalJourneys: stats?.total_journeys || 0,
      activeConv: stats?.active_conversations || 0,
      convertedValue: liveConvertedValue > 0 ? liveConvertedValue / 100000 : (stats?.converted || 0) * 0.1,
      activeSignals: stats?.signals_in_queue || liveSignals.length,
    };
  }, [stats, liveConvertedValue, liveSignals.length]);

  const scrollCarousel = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const { scrollLeft } = scrollRef.current;
      const scrollTo = direction === "left" ? scrollLeft - 220 : scrollLeft + 220;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
    }
  };

  const selectedLiveJourney: Journey | null = useMemo(() => {
    if (!selected || !journeysData?.journeys) return null;
    return journeysData.journeys.find((j) => j.journey_id === selected) ?? null;
  }, [selected, journeysData]);

  const handleSendOverride = useCallback(async () => {
    if (!overrideMsg.trim()) return;
    if (selectedLiveJourney) {
      setSendingReply(true);
      try {
        await continueConversation(selectedLiveJourney.journey_id, overrideMsg.trim());
        queryClient.invalidateQueries({ queryKey: ["backend-journeys"] });
        setOverrideMsg("");
      } catch (e) {
        console.error("Continue conversation failed:", e);
      } finally {
        setSendingReply(false);
      }
    }
  }, [overrideMsg, selectedLiveJourney, queryClient]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan">
            <Activity className="h-3.5 w-3.5 animate-pulse" /> Executive Control Room
          </div>
          <h1 className="mt-1 text-3xl font-black tracking-tight">Anticipatory Operations Cockpit</h1>
          <p className="text-sm text-muted-foreground">
            Live macro signals → customer relevance → autonomous engagement → measurable conversions.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 rounded-lg border border-border bg-card/60 p-1 text-xs">
            {["today", "7d", "30d", "custom"].map((range) => (
              <button
                key={range}
                onClick={() => { setTimeRange(range as any); setSelected(null); }}
                className={`rounded-md px-3 py-1 font-medium transition ${
                  timeRange === range ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {range.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="sticky top-3 z-20 flex items-center rounded-xl border border-border/80 bg-card/80 p-2 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/70">
        <button
          onClick={() => scrollCarousel("left")}
          className="absolute left-2 z-10 grid h-8 w-8 place-items-center rounded-full border border-border bg-card shadow-sm transition hover:bg-muted hover:text-primary"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto px-10 py-1 scroll-smooth overscroll-contain scrollbar-none"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {indianStates.map((state) => {
            const count = stateCounts[state] || 0;
            const isSelected = stateFilter === state;
            return (
              <button
                key={state}
                onClick={() => {
                  setStateFilter(state);
                  setSelected(null);
                }}
                className={`shrink-0 rounded-full border px-4 py-1.5 text-xs font-semibold transition-all ${
                  isSelected
                    ? "border-primary/50 bg-primary/20 text-primary shadow-sm shadow-primary/10 ring-1 ring-primary/30"
                    : "border-border/80 bg-card text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                }`}
              >
                {state}
                {count > 0 && (
                  <span className={`ml-1.5 rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                    isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => scrollCarousel("right")}
          className="absolute right-2 z-10 grid h-8 w-8 place-items-center rounded-full border border-border bg-card shadow-sm hover:bg-muted hover:text-primary transition"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="flex min-w-max gap-4">
        <Metric
          label="Active World Signals Tracked"
          value={`${computedStats.activeSignals} Active`}
          sub="IMD · RBI · PIB · Budget"
          tone="emerald"
          icon={CloudRain}
          spark={[2, 3, 2, 4, 3, 4, computedStats.activeSignals]}
          pulse
        />
        <Metric
          label="Targeted Cross-Segment Customers"
          value={computedStats.totalJourneys.toLocaleString("en-IN")}
          sub="Zero acquisition cost"
          tone="primary"
          icon={Users}
          spark={[8, 9, 10, 11, 12, 13, computedStats.totalJourneys / 1000]}
        />
        <Metric
          label="Active AI Conversations"
          value={computedStats.activeConv.toString()}
          sub="WhatsApp · YONO · SMS"
          tone="cyan"
          icon={MessageSquare}
          spark={[120, 180, 210, 260, 290, 320, computedStats.activeConv]}
        />
        <Metric
          label="Completed Value Conversions"
          value={`₹${computedStats.convertedValue.toFixed(2)} L`}
          sub="Risk mitigated + deposits locked"
          tone="amber"
          icon={TrendingUp}
          spark={[1.2, 3, 4.5, 6, 8, 10.2, computedStats.convertedValue]}
        />
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.7fr)]">
        <section className="glass-card p-5 transition-none">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border/40 pb-4">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-foreground">
                {selected ? "Anticipatory Interaction Console" : "Active Customer Journey Tracker"}
              </h2>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {!selected && (
                <select
                  value={productFilter}
                  onChange={(e) => setProductFilter(e.target.value)}
                  className="rounded-md border border-border bg-card px-2.5 py-1 text-xs text-foreground focus:outline-none"
                >
                  {productTypes.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              )}

              {selected && (
                <button
                  onClick={() => setSelected(null)}
                  className="flex items-center gap-1.5 rounded-md border border-border bg-card hover:bg-muted px-2.5 py-1 text-xs font-semibold text-foreground transition"
                >
                  <X className="h-3.5 w-3.5" /> Return to List
                </button>
              )}
            </div>
          </div>

          {!selected ? (
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold">Customer</th>
                    <th className="px-3 py-2 text-left font-semibold">Segment</th>
                    <th className="px-3 py-2 text-left font-semibold">Hook Signal</th>
                    <th className="px-3 py-2 text-left font-semibold">Channel</th>
                    <th className="px-3 py-2 text-left font-semibold">Value</th>
                    <th className="px-3 py-2 text-left font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => setSelected(c.id)}
                      className="cursor-pointer border-t border-border/60 transition hover:bg-primary/5"
                    >
                      <td className="px-3 py-2.5">
                        <div className="font-medium text-foreground">{c.name}</div>
                        <div className="text-[10px] text-muted-foreground">{c.state}</div>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground">{c.segment}</td>
                      <td className="px-3 py-2.5 text-xs">{c.hook}</td>
                      <td className="px-3 py-2.5 text-xs font-mono text-cyan">{c.channel}</td>
                      <td className="px-3 py-2.5 text-xs font-semibold">{c.value}</td>
                      <td className="px-3 py-2.5">
                        <span className={`rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusTone[c.status]}`}>
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid max-h-[620px] min-h-[500px] grid-cols-1 gap-3 overflow-hidden rounded-2xl border border-border/50 bg-background/40 p-3 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-border/40 bg-card/60 p-2.5">
                <div className="relative flex-1 min-h-0 overflow-y-auto pr-1">
                  <div className="space-y-2">
                    {filtered.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => setSelected(c.id)}
                        className={`cursor-pointer rounded-lg border p-2.5 transition-all ${
                          selected === c.id
                            ? "border-primary/50 bg-primary/10 shadow-sm"
                            : "border-border/70 bg-card/70 hover:border-border hover:bg-muted/30"
                        }`}
                      >
                        <h4 className="truncate text-xs font-bold text-foreground">{c.name}</h4>
                        <p className="truncate text-[10px] text-muted-foreground">{c.state} · {c.segment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-border/40 bg-gradient-to-br from-card via-card to-primary/5 p-3">
                <div className="mb-3 flex flex-wrap gap-2 rounded-full border border-border/40 bg-background/60 p-1 text-[11px]">
                  {["chat", "vitals", "txns", "signal"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab as any)}
                      className={`rounded-full px-3 py-1 font-semibold transition ${
                        activeTab === tab
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                  {activeTab === "chat" && (
                    <div className="flex h-full flex-col gap-2">
                      <div className="flex-1 space-y-3 overflow-y-auto rounded-lg border border-border/30 bg-muted/15 p-3">
                        {selectedLiveJourney?.messages.map((msg, idx) => (
                          <div key={idx} className={`flex flex-col max-w-[90%] ${msg.role === "drishti" ? "items-start" : "ml-auto items-end"}`}>
                            <div className={`rounded-lg p-2.5 text-xs ${msg.role === "drishti" ? "border border-primary/20 bg-primary/10" : "bg-muted"}`}>
                              {msg.text}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center gap-2 border-t border-border/30 pt-2">
                        <input
                          type="text"
                          value={overrideMsg}
                          onChange={(e) => setOverrideMsg(e.target.value)}
                          className="flex-1 rounded-md border border-border bg-background/70 px-3 py-2 text-xs focus:outline-none"
                        />
                        <button
                          onClick={handleSendOverride}
                          disabled={sendingReply}
                          className="rounded-md bg-primary p-2 text-primary-foreground"
                        >
                          {sendingReply ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {activeTab === "vitals" && (
                    <div className="space-y-3">
                      {selectedLiveJourney ? (
                        <>
                          <div className="flex justify-between border-b border-border/40 pb-2 text-xs">
                            <span className="text-muted-foreground">Occupation</span>
                            <span className="font-medium text-foreground text-right">{selectedLiveJourney.campaign_context?.customer_profile?.occupation || "N/A"}</span>
                          </div>
                          <div className="flex justify-between border-b border-border/40 pb-2 text-xs">
                            <span className="text-muted-foreground">Credit Score</span>
                            <span className="font-medium text-foreground text-right">{selectedLiveJourney.campaign_context?.customer_profile?.credit_score || "N/A"}</span>
                          </div>
                          <div className="flex justify-between border-b border-border/40 pb-2 text-xs">
                            <span className="text-muted-foreground">Existing Loans</span>
                            <span className="font-medium text-foreground text-right">{selectedLiveJourney.campaign_context?.customer_profile?.existing_loans || "None"}</span>
                          </div>
                        </>
                      ) : (
                        <div className="text-xs text-muted-foreground">No active customer selected.</div>
                      )}
                    </div>
                  )}

                  {activeTab === "signal" && (
                    <div className="space-y-4">
                      {selectedLiveJourney && (
                        <div className="rounded-md border border-border/40 bg-muted/20 p-3">
                          <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Signal Context</h4>
                          <p className="mt-1.5 text-xs text-foreground leading-relaxed">
                            {selectedLiveJourney.campaign_context?.explanation || selectedLiveJourney.signal_text}
                          </p>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-md border border-border/40 bg-muted/10 p-3">
                          <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Product Match</div>
                          <div className="mt-1 font-semibold text-cyan text-sm">{selectedLiveJourney?.product_name || "N/A"}</div>
                        </div>
                        <div className="rounded-md border border-border/40 bg-muted/10 p-3">
                          <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Tone & Strategy</div>
                          <div className="mt-1 font-semibold text-foreground text-sm capitalize">{selectedLiveJourney?.tone || "N/A"}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="glass-card overflow-hidden p-0 transition-none">
          <div className="border-b border-emerald/25 bg-emerald/10 px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-foreground">Live World-Signal Stream</h2>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald/20 bg-emerald/10 px-2 py-1 text-[10px] font-semibold text-emerald">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald opacity-75"></span>
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald"></span>
                </span>
                Auto-Syncing
              </span>
            </div>
          </div>
          <div className="max-h-[430px] space-y-2 overflow-y-auto p-3 pr-2">
            {liveSignals.map((s) => (
              <LiveSignalCard key={s.id} s={s} onRun={handleRunSignal} isRunning={runningSignals.has(s.id)} />
            ))}
            {liveSignals.length === 0 && (
              <div className="p-4 text-center text-xs text-muted-foreground">
                Monitoring live sources... Signals will automatically appear when detected.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
