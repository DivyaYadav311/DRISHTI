import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useRef } from "react";
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
} from "lucide-react";
import { customers, signals, indianStates, productTypes, personas, type Signal } from "@/lib/drishti-data";
import { useQuery } from "@tanstack/react-query";
import { fetchStats, fetchJourneys } from "@/lib/api-client";

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

// Helper to dynamically build personas for custom/synthetic customers
function getCustomerPersona(c: any): any {
  const nameLower = c.name.toLowerCase();
  
  // Try to find matching static personas
  if (nameLower.includes("ramesh")) {
    return personas.find(p => p.id === "ramesh");
  }
  if (nameLower.includes("sunita")) {
    return personas.find(p => p.id === "sunita");
  }
  if (nameLower.includes("priya")) {
    return personas.find(p => p.id === "priya");
  }

  // Generate deterministic details based on character code sum
  const nameHash = c.name.split("").reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
  const age = 24 + (nameHash % 42);
  const creditScore = 620 + (nameHash % 190);
  
  let role = "Customer";
  if (c.segment === "KCC" || c.product === "PMFBY") role = "Farmer";
  else if (c.segment === "Jan Dhan" || c.product.includes("RD")) role = "Self-Employed Weaver";
  else if (c.segment === "Home Loan") role = "Civil Engineer";
  else if (c.segment === "Business") role = "Small Business Owner";
  else role = "Retail Operations Lead";

  const balance = c.segment === "Premium" 
    ? `₹${(12 + (nameHash % 15)).toFixed(1)} L` 
    : c.segment === "Jan Dhan" 
    ? `₹${(450 + (nameHash % 3200)).toLocaleString("en-IN")}`
    : `₹${(18000 + (nameHash % 95000)).toLocaleString("en-IN")}`;

  const vitals = c.segment === "KCC" ? [
    { label: "Land Holding", value: `${(2.2 + (nameHash % 4)).toFixed(1)} acres` },
    { label: "Last Yield", value: `${(9 + (nameHash % 5))} quintal/acre` },
    { label: "Insurance Status", value: c.status === "Converted" ? "Active (PMFBY)" : "Lapsed" },
    { label: "Repayment History", value: "On-time (12m)" }
  ] : c.segment === "Jan Dhan" ? [
    { label: "Account Age", value: `${(2 + (nameHash % 3)).toFixed(1)} years` },
    { label: "Avg Monthly Bal", value: `₹${(800 + (nameHash % 1200))}` },
    { label: "RuPay Card", value: "Active" },
    { label: "DBT Linked", value: "Linked ✓" }
  ] : [
    { label: "CIBIL Score", value: creditScore.toString() },
    { label: "Monthly Income", value: c.segment === "Premium" ? "₹1.5 L" : "₹38,000" },
    { label: "Existing Loans", value: c.segment === "Home Loan" ? "₹28.5 L outstanding" : "None" },
    { label: "Relationship Age", value: `${(1 + (nameHash % 8))} years` }
  ];

  const txns = [
    { date: "Yesterday", desc: c.segment === "KCC" ? "Agricultural Seeds" : c.segment === "Jan Dhan" ? "Local Payout" : "Grocery Debit", amount: `-₹${250 + (nameHash % 1800)}` },
    { date: "09 Jun", desc: "Digital Interest Credit", amount: `+₹${15 + (nameHash % 280)}` },
    { date: "01 Jun", desc: "Monthly Salary / Credit", amount: `+₹${12000 + (nameHash % 40000)}` },
    { date: "24 May", desc: "ATM Cash Withdrawal", amount: `-₹${1000 + (nameHash % 3000)}` }
  ];

  const thread = [
    {
      from: "drishti" as const,
      text: `Greetings ${c.name}. We observed a relevant update: ${c.hook}. Based on your profile, you qualify for pre-approved ${c.product}. Protect/Optimize your finances instantly.`,
      meta: `Auto-outreach · Channel: ${c.channel} · Cost: ₹0.02`
    },
    {
      from: "customer" as const,
      text: "(awaiting reply)",
      options: ["Check Details", "Opt-out"]
    }
  ];

  if (c.status === "Converted") {
    thread.push(
      {
        from: "customer" as const,
        text: "Please share the details.",
        options: []
      },
      {
        from: "drishti" as const,
        text: `The ${c.product} offer provides tailored terms. Repayment can be directly deducted from your active account limit. Proceed?`,
        meta: `Response generated · Relevance Score 0.96`
      },
      {
        from: "customer" as const,
        text: "Yes, enroll me.",
        options: []
      },
      {
        from: "drishti" as const,
        text: `✓ Enrolled! Reference ID: SBI-${nameHash}. Auto-debit configuration set up. A confirmation has been sent to your registered number.`,
        confirm: true,
        meta: `Conversion logged · Value ${c.value}`
      }
    );
  } else if (c.status === "In-Thread Chatting") {
    thread.push(
      {
        from: "customer" as const,
        text: "What are the rates?",
        options: []
      },
      {
        from: "drishti" as const,
        text: `The rate is 6.85% per annum with zero processing fees. Would you like to confirm registration?`,
        meta: `Awaiting response`
      }
    );
  }

  return {
    id: c.id,
    name: c.name,
    age,
    role,
    location: `${c.state}, India`,
    language: c.state === "Maharashtra" ? "Marathi" : c.state === "Uttar Pradesh" ? "Hindi" : "English",
    account: c.segment,
    balance,
    creditScore,
    channel: c.channel,
    trigger: { source: c.hook.split(" ")[0] || "SBI", title: c.hook },
    vitals,
    txns,
    thread
  };
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
  const [manualMessages, setManualMessages] = useState<Record<string, string[]>>({});

  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch stats and journeys dynamically from backend API
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

  // Map live backend journeys to customer objects
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

      const matchedMock = customers.find((c) => c.name.toLowerCase() === j.customer_name.toLowerCase());
      
      return {
        id: j.journey_id,
        name: j.customer_name,
        segment: segmentMap[j.product_details?.target_segment as string] || matchedMock?.segment || "KCC",
        state: j.customer_state,
        hook: j.signal_type === "agricultural" ? "IMD Drought Alert" : j.signal_type === "policy" ? "RBI Repo Cut" : "Live AI Trigger",
        channel: (channelMap[j.channel] || matchedMock?.channel || "WhatsApp") as any,
        status: (statusMap[j.status] || "Awaiting Reply") as any,
        product: j.product_name,
        value: matchedMock?.value || `₹${Math.round(j.urgency_score * 4000 + 1000).toLocaleString("en-IN")}`,
      };
    });
  }, [journeysData]);

  // Merge live backend customers and static mock customers, de-duplicating by name
  const allCustomers = useMemo(() => {
    const liveNames = new Set(liveCustomers.map((c) => c.name.toLowerCase()));
    const remainingStatic = customers.filter((c) => !liveNames.has(c.name.toLowerCase()));
    return [...liveCustomers, ...remainingStatic];
  }, [liveCustomers]);

  // Generates deterministically rich customer lists based on state/timeRange
  const generatedCustomers = useMemo(() => {
    let list = [...allCustomers];
    
    // Scale size based on selected time range
    let countToAdd = 0;
    if (timeRange === "7d") {
      countToAdd = 15;
    } else if (timeRange === "30d") {
      countToAdd = 45;
    } else if (timeRange === "custom" && customStartDate && customEndDate) {
      const diffTime = Math.abs(new Date(customEndDate).getTime() - new Date(customStartDate).getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
      countToAdd = Math.min(60, Math.max(2, Math.round(diffDays * 1.5)));
    }

    const firstNames = ["Rajesh", "Amit", "Sunil", "Vijay", "Sanjay", "Anil", "Sandip", "Karan", "Dinesh", "Rakesh", "Ganesh", "Prakash", "Jyoti", "Kiran", "Lata", "Asha", "Rekha", "Pooja", "Seema", "Geeta", "Arun", "Suresh", "Vikram", "Rohan", "Rahul"];
    const lastNames = ["Sharma", "Patel", "Verma", "Gupta", "Joshi", "Rao", "Nair", "Iyer", "Reddy", "Mehta", "Singh", "Das", "Sen", "Roy", "Chatterjee", "Banerjee", "Kumar", "Prasad", "Mishra", "Pandey", "Naidu", "Deshmukh", "Pillai", "Shetty"];
    
    const segmentPool = ["KCC", "Jan Dhan", "Home Loan", "Business", "Premium"];
    const hookPool = ["IMD Drought Alert", "PM-KISAN Credit", "RBI Repo Cut", "CGTMSE Expansion", "Agri Deficit Warning"];
    const productPool = ["PMFBY", "Micro RD", "Refi Top-up", "Emergency LoC", "Asset Refinancing"];
    const channelPool = ["WhatsApp", "SMS", "YONO Push"];

    for (let i = 0; i < countToAdd; i++) {
      const fn = firstNames[(i * 3) % firstNames.length];
      const ln = lastNames[(i * 7) % lastNames.length];
      const name = `${fn} ${ln}`;
      
      // Distribute customers deterministically across states (index 1 to end of states list)
      const stateIndex = (i % (indianStates.length - 1)) + 1;
      const state = indianStates[stateIndex];

      const segment = segmentPool[(i * 2) % segmentPool.length];
      const hook = hookPool[(i * 4) % hookPool.length];
      const product = productPool[(i * 5) % productPool.length];
      const channel = channelPool[(i * 6) % channelPool.length] as any;
      
      const statusIndex = (i * 9) % 100;
      let status: any = "Awaiting Reply";
      if (statusIndex < 35) status = "Converted";
      else if (statusIndex < 65) status = "In-Thread Chatting";
      else if (statusIndex < 85) status = "Awaiting Reply";
      else if (statusIndex < 95) status = "RM Escalated";
      else status = "Dropped";

      const valNum = Math.round(1500 + (i * 1250) % 55000);
      const valStr = valNum > 25000 ? `₹${(valNum / 1000).toFixed(1)} L` : `₹${valNum.toLocaleString("en-IN")}`;

      list.push({
        id: `synth-c-${i}-${timeRange}`,
        name,
        segment,
        state,
        hook,
        channel,
        status,
        product,
        value: valStr,
      });
    }

    return list;
  }, [allCustomers, timeRange, customStartDate, customEndDate]);

  // Compute active counts for each state
  const stateCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    let total = 0;
    
    generatedCustomers.forEach((c) => {
      counts[c.state] = (counts[c.state] || 0) + 1;
      total++;
    });
    
    counts["All India"] = total;
    return counts;
  }, [generatedCustomers]);

  // Filter based on State, Product, and Search Text
  const filtered = useMemo(() => {
    return generatedCustomers.filter((c) => {
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
  }, [generatedCustomers, stateFilter, productFilter, searchQuery]);

  // Calculate live converted value
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

  // Dynamic scaled statistics for the metrics dashboard
  const computedStats = useMemo(() => {
    const totalJourneysBase = 14837 + (stats?.total_journeys || 0);
    const activeConvBase = 342 + (stats?.active_conversations || 0);
    const convertedValueBase = 12.4 + (liveConvertedValue > 0 ? liveConvertedValue / 100000 : (stats?.converted || 0) * 0.1);
    const activeSignalsBase = Math.max(4, journeysData?.total || 0);

    let multiplier = 1;
    if (timeRange === "7d") {
      multiplier = 7.2;
    } else if (timeRange === "30d") {
      multiplier = 29.4;
    } else if (timeRange === "custom" && customStartDate && customEndDate) {
      const diffTime = Math.abs(new Date(customEndDate).getTime() - new Date(customStartDate).getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
      multiplier = diffDays * 1.05;
    }

    let totalJourneys = Math.round(totalJourneysBase * multiplier);
    let activeConv = Math.round(activeConvBase * multiplier);
    let convertedValue = convertedValueBase * multiplier;
    let activeSignals = Math.max(4, Math.round(activeSignalsBase * Math.min(3, multiplier * 0.4 + 0.6)));

    // Scale by active state portion
    if (stateFilter !== "All India") {
      const stateHash = stateFilter.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const fraction = 0.02 + (stateHash % 5) * 0.015; // 2% to 8%
      
      totalJourneys = Math.max(filtered.length * 2, Math.round(totalJourneys * fraction));
      activeConv = Math.max(filtered.filter(c => c.status === "In-Thread Chatting").length, Math.round(activeConv * fraction));
      
      const filteredConverted = filtered.filter(c => c.status === "Converted");
      const filterConvertedVal = filteredConverted.reduce((acc, c) => {
        const num = parseFloat(c.value.replace(/[^0-9.]/g, ""));
        return acc + (isNaN(num) ? 0 : num);
      }, 0);
      convertedValue = Math.max(filterConvertedVal / 100000, convertedValue * fraction);
      activeSignals = Math.max(1, Math.round(activeSignals * 0.4));
    }

    return {
      totalJourneys,
      activeConv,
      convertedValue,
      activeSignals
    };
  }, [stats, journeysData, liveConvertedValue, timeRange, customStartDate, customEndDate, stateFilter, filtered]);

  // Extract selected customer persona
  const activePersona = useMemo(() => {
    if (!selected) return null;
    const c = generatedCustomers.find((x) => x.id === selected);
    if (!c) return null;
    return getCustomerPersona(c);
  }, [selected, generatedCustomers]);

  // Combined messages including manual overrides
  const chatMessages = useMemo(() => {
    if (!activePersona) return [];
    const base = [...activePersona.thread];
    const manuals = manualMessages[activePersona.id] || [];
    manuals.forEach((msg) => {
      base.push({
        from: "drishti",
        text: msg,
        meta: "Manual Override · RM bypass active",
      });
    });
    return base;
  }, [activePersona, manualMessages]);

  const scrollCarousel = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const { scrollLeft } = scrollRef.current;
      const scrollTo = direction === "left" ? scrollLeft - 220 : scrollLeft + 220;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
    }
  };

  const handleSendOverride = () => {
    if (!overrideMsg.trim() || !activePersona) return;
    setManualMessages((prev) => ({
      ...prev,
      [activePersona.id]: [...(prev[activePersona.id] || []), overrideMsg.trim()],
    }));
    setOverrideMsg("");
  };

  return (
    <div className="space-y-6 p-6">
      {/* Title Header */}
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
        
        {/* Time filters & custom range */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 rounded-lg border border-border bg-card/60 p-1 text-xs">
            <button
              onClick={() => { setTimeRange("today"); setSelected(null); }}
              className={`rounded-md px-3 py-1 font-medium transition ${
                timeRange === "today" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Today
            </button>
            <button
              onClick={() => { setTimeRange("7d"); setSelected(null); }}
              className={`rounded-md px-3 py-1 font-medium transition ${
                timeRange === "7d" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => { setTimeRange("30d"); setSelected(null); }}
              className={`rounded-md px-3 py-1 font-medium transition ${
                timeRange === "30d" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              30 Days
            </button>
            <button
              onClick={() => { setTimeRange("custom"); setSelected(null); }}
              className={`rounded-md px-3 py-1 font-medium transition ${
                timeRange === "custom" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Custom Select
            </button>
          </div>

          {timeRange === "custom" && (
            <div className="flex items-center gap-2 rounded-lg border border-border bg-card/60 p-1 px-3 text-xs animate-fade-in">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="border-0 bg-transparent p-0 text-xs font-semibold text-foreground focus:outline-none focus:ring-0 w-28"
              />
              <span className="text-muted-foreground text-[10px]">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="border-0 bg-transparent p-0 text-xs font-semibold text-foreground focus:outline-none focus:ring-0 w-28"
              />
            </div>
          )}
        </div>
      </div>

      {/* State Carousel Selector */}
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

      {/* Metric Cards Grid */}
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

      {/* Main Grid Section */}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.7fr)]">
        {/* Customer tracker card stays in the same position for stable navigation */}
        <section className="glass-card p-5 transition-none">
          
          {/* Header area */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border/40 pb-4">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-foreground">
                {selected ? "Anticipatory Interaction Console" : "Active Customer Journey Tracker"}
              </h2>
              <p className="text-xs text-muted-foreground">
                {filtered.length} active agent-customer flows (State: <span className="text-primary font-bold">{stateFilter}</span>)
              </p>
            </div>
            
            {/* Global filtering dropdown (hidden in split view since state selection carousel is used) */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {!selected && (
                <>
                  <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                  <select
                    value={productFilter}
                    onChange={(e) => setProductFilter(e.target.value)}
                    className="rounded-md border border-border bg-card px-2.5 py-1 text-xs text-foreground focus:outline-none"
                  >
                    {productTypes.map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </select>
                </>
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

          {/* Render split pane or standard table */}
          {!selected ? (
            /* Tabular List View */
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
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-3 py-8 text-center text-xs text-muted-foreground">
                        No customers match the active filter for this state/timeframe.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            /* Focused customer detail workspace */
            <div className="grid max-h-[620px] min-h-[500px] grid-cols-1 gap-3 overflow-hidden rounded-2xl border border-border/50 bg-background/40 p-3 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-border/40 bg-card/60 p-2.5">
                <div className="mb-2 flex items-center justify-between gap-2 border-b border-border/30 pb-2">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Queue</p>
                    <p className="text-sm font-semibold text-foreground">Live conversations</p>
                  </div>
                  <span className="rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                    {filtered.length} live
                  </span>
                </div>

                <div className="relative flex-1 min-h-0 overflow-y-auto pr-1">
                  <div className="sticky top-0 z-10 mb-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search queue..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-md border border-border bg-background/80 py-2 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      {searchQuery && (
                        <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-2.5">
                          <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    {filtered.map((c) => {
                      const isSelected = selected === c.id;
                      return (
                        <div
                          key={c.id}
                          onClick={() => setSelected(c.id)}
                          className={`cursor-pointer rounded-lg border p-2.5 transition-all ${
                            isSelected
                              ? "border-primary/50 bg-primary/10 shadow-sm"
                              : "border-border/70 bg-card/70 hover:border-border hover:bg-muted/30"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h4 className="truncate text-xs font-bold text-foreground">{c.name}</h4>
                              <p className="truncate text-[10px] text-muted-foreground">{c.state} · {c.segment}</p>
                            </div>
                            <span className="shrink-0 text-[10px] font-semibold text-emerald-500">{c.value}</span>
                          </div>
                          <div className="mt-2 flex items-center justify-between gap-2 text-[10px]">
                            <span className="truncate text-muted-foreground">{c.hook}</span>
                            <span className={`rounded border px-1.5 py-0.2 text-[9px] font-bold ${statusTone[c.status]}`}>
                              {c.status}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-border/40 bg-gradient-to-br from-card via-card to-primary/5 p-3">
                {activePersona ? (
                  <>
                    <div className="mb-3 flex flex-wrap items-start justify-between gap-3 border-b border-border/30 pb-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                            {activePersona.account} Account
                          </span>
                          <span className="text-[10px] text-muted-foreground">ID {activePersona.id}</span>
                        </div>
                        <h3 className="mt-1 text-lg font-black tracking-tight text-foreground">{activePersona.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {activePersona.role} · {activePersona.age} yrs · {activePersona.location}
                        </p>
                      </div>
                      <div className="rounded-lg border border-emerald/25 bg-emerald/10 px-2.5 py-2 text-right">
                        <div className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Projected value</div>
                        <div className="text-lg font-black text-emerald">{activePersona.balance}</div>
                      </div>
                    </div>

                    <div className="mb-3 flex flex-wrap gap-2 rounded-full border border-border/40 bg-background/60 p-1 text-[11px]">
                      {[
                        { key: "chat", label: "Chat" },
                        { key: "vitals", label: "Vitals" },
                        { key: "txns", label: "Ledger" },
                        { key: "signal", label: "Signal" },
                      ].map((tab) => (
                        <button
                          key={tab.key}
                          onClick={() => setActiveTab(tab.key as typeof activeTab)}
                          className={`rounded-full px-3 py-1 font-semibold transition ${
                            activeTab === tab.key
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                      {activeTab === "chat" && (
                        <div className="flex h-full flex-col gap-2">
                          <div className="flex-1 space-y-3 overflow-y-auto rounded-lg border border-border/30 bg-muted/15 p-3">
                            {chatMessages.map((turn, idx) => {
                              const isDrishti = turn.from === "drishti";
                              return (
                                <div
                                  key={idx}
                                  className={`flex flex-col max-w-[90%] ${isDrishti ? "items-start" : "ml-auto items-end"}`}
                                >
                                  <div
                                    className={`rounded-lg p-2.5 text-xs ${
                                      isDrishti
                                        ? "border border-primary/20 bg-primary/10 text-foreground rounded-tl-none"
                                        : "rounded-tr-none bg-muted text-foreground"
                                    }`}
                                  >
                                    {turn.text}
                                  </div>
                                  {turn.meta && <span className="mt-1 px-1 text-[9px] text-muted-foreground">{turn.meta}</span>}
                                  {turn.options && turn.options.length > 0 && (
                                    <div className="mt-1.5 flex flex-wrap justify-end gap-1">
                                      {turn.options.map((opt, oIdx) => (
                                        <span key={oIdx} className="rounded-full border border-primary/30 bg-card px-2 py-0.5 text-[9px] font-medium text-primary">
                                          {opt}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          <div className="flex items-center gap-2 border-t border-border/30 pt-2">
                            <input
                              type="text"
                              placeholder="Override or guide the agent..."
                              value={overrideMsg}
                              onChange={(e) => setOverrideMsg(e.target.value)}
                              onKeyDown={(e) => e.key === "Enter" && handleSendOverride()}
                              className="flex-1 rounded-md border border-border bg-background/70 px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                            <button
                              onClick={handleSendOverride}
                              className="rounded-md bg-primary p-2 text-primary-foreground transition hover:bg-primary/80"
                            >
                              <Send className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      )}

                      {activeTab === "vitals" && (
                        <div className="grid grid-cols-2 gap-2.5">
                          <div className="rounded-lg border border-border bg-muted/10 p-2.5">
                            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">CIBIL</div>
                            <div className="mt-1 text-lg font-bold text-foreground">{activePersona.creditScore}</div>
                          </div>
                          <div className="rounded-lg border border-border bg-muted/10 p-2.5">
                            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Channel</div>
                            <div className="mt-1 text-lg font-bold text-cyan">{activePersona.channel}</div>
                          </div>
                          {activePersona.vitals.map((v: any, vIdx: number) => (
                            <div key={vIdx} className="rounded-lg border border-border bg-muted/10 p-2.5">
                              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{v.label}</div>
                              <div className="mt-1 text-sm font-semibold text-foreground">{v.value}</div>
                            </div>
                          ))}
                        </div>
                      )}

                      {activeTab === "txns" && (
                        <div className="space-y-2">
                          {activePersona.txns.map((txn: any, tIdx: number) => {
                            const isCredit = txn.amount.startsWith("+");
                            return (
                              <div key={tIdx} className="flex items-center justify-between rounded-lg border border-border bg-card/70 p-2.5 text-xs">
                                <div>
                                  <div className="font-semibold text-foreground">{txn.desc}</div>
                                  <div className="text-[10px] text-muted-foreground">{txn.date}</div>
                                </div>
                                <span className={`font-mono font-bold ${isCredit ? "text-emerald-500" : "text-foreground"}`}>
                                  {txn.amount}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {activeTab === "signal" && (
                        <div className="rounded-lg border border-border/40 bg-muted/10 p-3">
                          <div className="flex items-center gap-1.5">
                            <span className="rounded border border-primary/20 bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                              {activePersona.trigger.source}
                            </span>
                            <span className="text-xs font-semibold text-foreground">Context Hook</span>
                          </div>
                          <h4 className="mt-2 text-sm font-bold text-foreground">{activePersona.trigger.title}</h4>
                          <p className="mt-1 text-xs text-muted-foreground">
                            This public world-signal was ingested dynamically, evaluated for geographic relevance, and mapped to this customer profile. Out-bound recommendation generated using the RAG model from SBI Product catalog.
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="grid flex-1 place-items-center text-xs text-muted-foreground">
                    Failed to fetch profile details.
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Compact live signal feed positioned to the right of the tracker */}
        <section className="glass-card overflow-hidden p-0 transition-none" aria-label="Live world signal stream">
          <div className="border-b border-emerald/25 bg-emerald/10 px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-foreground">Live World-Signal Stream</h2>
                <p className="text-[10px] text-muted-foreground">High-priority global triggers · updated live</p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald/40 bg-emerald/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.2em] text-emerald">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald pulse-dot text-emerald" /> LIVE
              </span>
            </div>
          </div>
          <div className="max-h-[430px] space-y-2 overflow-y-auto p-3 pr-2">
            {signals.slice(0, 4).map((s) => (
              <SignalCard key={s.id} s={s} />
            ))}
          </div>
        </section>
      </div>

    </div>
  );
}
