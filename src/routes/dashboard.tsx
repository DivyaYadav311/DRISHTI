import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
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
  Filter,
} from "lucide-react";
import { customers, signals, indianStates, productTypes, type Signal } from "@/lib/drishti-data";

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

const statusTone = {
  "Awaiting Reply": "bg-amber/15 text-amber border-amber/30",
  "In-Thread Chatting": "bg-primary/15 text-primary border-primary/30",
  Converted: "bg-emerald/15 text-emerald border-emerald/30",
  "RM Escalated": "bg-destructive/15 text-destructive border-destructive/40",
} as const;

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
        <linearGradient id={`sp-${tone}`} x1="0" x2="0" y1="0" y2="1">
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
              <div className="font-bold text-foreground">{s.affected.toLocaleString("en-IN")}</div>
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

function DashboardPage() {
  const [stateFilter, setStateFilter] = useState("All India");
  const [productFilter, setProductFilter] = useState("All Products");
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      customers.filter(
        (c) =>
          (stateFilter === "All India" || c.state === stateFilter) &&
          (productFilter === "All Products" || c.segment === productFilter),
      ),
    [stateFilter, productFilter],
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan">
            <Activity className="h-3.5 w-3.5" /> Executive Control Room
          </div>
          <h1 className="mt-1 text-3xl font-black tracking-tight">Anticipatory Operations Cockpit</h1>
          <p className="text-sm text-muted-foreground">
            Live macro signals → customer relevance → autonomous engagement → measurable conversions.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card/60 p-1 text-xs">
          <span className="px-2 text-muted-foreground">Today</span>
          <button className="rounded-md bg-primary/20 px-2 py-1 font-medium text-primary">24h</button>
          <button className="rounded-md px-2 py-1 text-muted-foreground hover:text-foreground">7d</button>
          <button className="rounded-md px-2 py-1 text-muted-foreground hover:text-foreground">30d</button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          label="Active World Signals Tracked"
          value="4 Active"
          sub="IMD · RBI · PIB · Budget"
          tone="emerald"
          icon={CloudRain}
          spark={[2, 3, 2, 4, 3, 4, 4]}
          pulse
        />
        <Metric
          label="Targeted Cross-Segment Customers"
          value="14,837"
          sub="Zero acquisition cost"
          tone="primary"
          icon={Users}
          spark={[8, 9, 10, 11, 12, 13, 14.8]}
        />
        <Metric
          label="Active AI Conversations"
          value="342"
          sub="WhatsApp · YONO · SMS"
          tone="cyan"
          icon={MessageSquare}
          spark={[120, 180, 210, 260, 290, 320, 342]}
        />
        <Metric
          label="Completed Value Conversions"
          value="₹12.4 L"
          sub="Risk mitigated + deposits locked"
          tone="amber"
          icon={TrendingUp}
          spark={[1.2, 3, 4.5, 6, 8, 10.2, 12.4]}
        />
      </div>

      {/* Two column */}
      <div className="grid gap-6 xl:grid-cols-5">
        {/* Signal feed */}
        <section className="glass-card xl:col-span-2 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-foreground">Live World-Signal Stream</h2>
              <p className="text-xs text-muted-foreground">External triggers ingested in the last 24 hours</p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald/40 bg-emerald/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald pulse-dot text-emerald" /> Streaming
            </span>
          </div>
          <div className="space-y-3 max-h-[640px] overflow-y-auto pr-2">
            {signals.map((s) => (
              <SignalCard key={s.id} s={s} />
            ))}
          </div>
        </section>

        {/* Customer journey */}
        <section className="glass-card xl:col-span-3 p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-foreground">Active Customer Journey Tracker</h2>
              <p className="text-xs text-muted-foreground">{filtered.length} live agent-customer interactions</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
              <select
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
                className="rounded-md border border-border bg-card px-2 py-1 text-xs"
              >
                {indianStates.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
              <select
                value={productFilter}
                onChange={(e) => setProductFilter(e.target.value)}
                className="rounded-md border border-border bg-card px-2 py-1 text-xs"
              >
                {productTypes.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>
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
                    onClick={() => setSelected(c.id === selected ? null : c.id)}
                    className={`cursor-pointer border-t border-border/60 transition hover:bg-primary/5 ${
                      selected === c.id ? "bg-primary/10" : ""
                    }`}
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
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-xs text-muted-foreground">
                      No customers match the active filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {selected && (() => {
            const c = customers.find((x) => x.id === selected)!;
            return (
              <div className="mt-4 rounded-lg border border-primary/30 bg-primary/5 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-cyan">Quick Profile</div>
                    <div className="mt-1 text-lg font-bold">{c.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {c.segment} · {c.state} · Hooked by <span className="text-foreground">{c.hook}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] uppercase text-muted-foreground">Projected Value</div>
                    <div className="text-2xl font-black text-emerald">{c.value}</div>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                  <div className="rounded border border-border bg-card/60 p-2">
                    <div className="text-[10px] text-muted-foreground">Channel</div>
                    <div className="font-mono">{c.channel}</div>
                  </div>
                  <div className="rounded border border-border bg-card/60 p-2">
                    <div className="text-[10px] text-muted-foreground">Product</div>
                    <div>{c.product}</div>
                  </div>
                  <div className="rounded border border-border bg-card/60 p-2">
                    <div className="text-[10px] text-muted-foreground">Status</div>
                    <div>{c.status}</div>
                  </div>
                </div>
              </div>
            );
          })()}
        </section>
      </div>
    </div>
  );
}
