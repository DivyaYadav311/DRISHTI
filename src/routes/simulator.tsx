import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Smartphone, Zap, RefreshCw, Check, Wifi, Signal, BatteryFull, CheckCheck } from "lucide-react";
import { personas, type ChatTurn } from "@/lib/drishti-data";
import { useSimulator, getPersona } from "@/lib/simulator-context";

export const Route = createFileRoute("/simulator")({
  head: () => ({
    meta: [
      { title: "Sandbox Simulator · DRISHTI" },
      { name: "description", content: "Interactive customer conversation simulator for SBI's DRISHTI agent." },
    ],
  }),
  component: SimulatorPage,
});

function PersonaSelect() {
  const { personaId, setPersonaId } = useSimulator();
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {personas.map((p) => {
        const active = personaId === p.id;
        return (
          <button
            key={p.id}
            onClick={() => setPersonaId(p.id)}
            className={`rounded-lg border p-3 text-left transition ${
              active ? "border-primary/60 bg-primary/10 glow-cyan" : "border-border bg-card/60 hover:border-primary/40"
            }`}
          >
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{p.account}</div>
            <div className="mt-1 truncate text-sm font-bold">{p.name}</div>
            <div className="truncate text-[11px] text-muted-foreground">{p.location}</div>
            <div className="mt-1 inline-flex items-center gap-1 rounded bg-cyan/15 px-1.5 py-0.5 font-mono text-[10px] text-cyan">
              {p.channel}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function CustomerMatrix() {
  const { personaId } = useSimulator();
  const p = getPersona(personaId);

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-cyan">Customer Profile Matrix</div>
          <h2 className="mt-1 text-xl font-bold">{p.name}</h2>
          <p className="text-xs text-muted-foreground">
            Age {p.age} · {p.role} · {p.location} · Speaks {p.language}
          </p>
        </div>
        <div className="grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-cyan to-primary text-lg font-black text-primary-foreground">
          {p.name
            .split(" ")
            .map((s) => s[0])
            .join("")}
        </div>
      </div>

      <PersonaSelect />

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Vital label="Account" value={p.account} />
        <Vital label="Balance" value={p.balance} />
        <Vital label="Credit Score" value={p.creditScore ? String(p.creditScore) : "NA"} tone="emerald" />
        <Vital label="Channel" value={p.channel} tone="cyan" />
      </div>

      <div className="mt-4">
        <div className="mb-2 text-[10px] uppercase tracking-wider text-muted-foreground">Core Vitals</div>
        <div className="grid grid-cols-2 gap-2">
          {p.vitals.map((v) => (
            <div key={v.label} className="rounded-md border border-border bg-card/60 p-2 text-xs">
              <div className="text-[10px] text-muted-foreground">{v.label}</div>
              <div className="mt-0.5 font-medium">{v.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-2 text-[10px] uppercase tracking-wider text-muted-foreground">Recent Transactions</div>
        <div className="divide-y divide-border rounded-md border border-border bg-card/60 text-xs">
          {p.txns.map((t, i) => (
            <div key={i} className="flex items-center justify-between px-3 py-2">
              <div>
                <div className="text-foreground">{t.desc}</div>
                <div className="font-mono text-[10px] text-muted-foreground">{t.date}</div>
              </div>
              <div className={`font-mono font-semibold ${t.amount.startsWith("+") ? "text-emerald" : "text-foreground"}`}>
                {t.amount}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-amber/40 bg-amber/10 p-3">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-amber">
          <Zap className="h-3 w-3" /> Active World Trigger
        </div>
        <div className="mt-1 text-sm font-bold text-foreground">{p.trigger.title}</div>
        <div className="text-[11px] text-muted-foreground">Source: {p.trigger.source}</div>
      </div>
    </div>
  );
}

function Vital({ label, value, tone }: { label: string; value: string; tone?: "emerald" | "cyan" }) {
  return (
    <div className="rounded-md border border-border bg-card/60 p-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div
        className="mt-0.5 truncate text-sm font-bold"
        style={tone ? { color: `var(--${tone})` } : undefined}
      >
        {value}
      </div>
    </div>
  );
}

/* ---------------- Phone shells ---------------- */

function PhoneFrame({ children, channel }: { children: React.ReactNode; channel: string }) {
  return (
    <div className="mx-auto w-full max-w-[360px]">
      <div className="relative rounded-[2.5rem] border-[10px] border-[oklch(0.08_0.02_252)] bg-[oklch(0.08_0.02_252)] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]">
        <div className="absolute left-1/2 top-2 z-10 h-5 w-28 -translate-x-1/2 rounded-full bg-[oklch(0.08_0.02_252)]" />
        <div className="overflow-hidden rounded-[1.8rem] bg-[oklch(0.95_0.005_240)] text-[oklch(0.15_0.02_250)]">
          {/* status bar */}
          <div className="flex items-center justify-between bg-black/0 px-5 pb-1 pt-2 text-[10px] font-semibold text-[oklch(0.2_0.02_250)]">
            <span>9:42</span>
            <span className="flex items-center gap-1">
              <Signal className="h-3 w-3" /> <Wifi className="h-3 w-3" /> <BatteryFull className="h-3.5 w-3.5" />
            </span>
          </div>
          {children}
        </div>
        <div className="mt-1 text-center text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{channel}</div>
      </div>
    </div>
  );
}

function WhatsAppShell({ children, name }: { children: React.ReactNode; name: string }) {
  return (
    <div className="flex h-[560px] flex-col bg-[#0b141a] text-white">
      <div className="flex items-center gap-3 bg-[#1f2c33] px-3 py-2">
        <div className="grid h-9 w-9 place-items-center rounded-full bg-[#00a884] text-sm font-bold">SBI</div>
        <div>
          <div className="text-sm font-semibold">SBI DRISHTI</div>
          <div className="text-[10px] text-white/60">online · end-to-end encrypted</div>
        </div>
      </div>
      <div
        className="flex-1 space-y-2 overflow-y-auto px-3 py-3"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "18px 18px",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function SMSShell({ children, name }: { children: React.ReactNode; name: string }) {
  return (
    <div className="flex h-[560px] flex-col bg-white">
      <div className="border-b border-black/10 bg-[oklch(0.97_0.005_240)] px-4 py-2 text-center">
        <div className="text-xs font-semibold">SBI-INBOX</div>
        <div className="text-[10px] text-black/50">SMS · Text Message</div>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto px-3 py-3">{children}</div>
    </div>
  );
}

function YonoShell({ children, name }: { children: React.ReactNode; name: string }) {
  return (
    <div className="flex h-[560px] flex-col bg-gradient-to-b from-[#003366] to-[#001a33] text-white">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="text-sm font-bold tracking-wider">YONO SBI</div>
        <div className="text-[10px] text-white/70">Premium · {name.split(" ")[0]}</div>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto px-3 py-3">{children}</div>
    </div>
  );
}

/* ---------------- Bubbles per channel ---------------- */

function Bubble({
  turn,
  channel,
  onChoose,
  isCurrent,
}: {
  turn: ChatTurn;
  channel: "WhatsApp" | "SMS" | "YONO Push";
  onChoose?: (opt: string) => void;
  isCurrent?: boolean;
}) {
  if (turn.confirm) {
    return (
      <div className="my-2 rounded-lg border-2 border-emerald bg-emerald/15 p-3 text-emerald-foreground" style={{ background: "color-mix(in oklab, var(--emerald) 25%, transparent)", borderColor: "var(--emerald)" }}>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider" style={{ color: "var(--emerald)" }}>
          <Check className="h-4 w-4" /> Enrollment Complete
        </div>
        <div className="mt-1 text-sm text-foreground">{turn.text}</div>
        <div className="mt-2 text-[10px] text-muted-foreground">{turn.meta}</div>
        <div className="mt-2 rounded border border-emerald/40 bg-background/40 px-2 py-1 text-[10px]" style={{ color: "var(--emerald)" }}>
          ✓ Account Credited/Insured · Dashboard Metrics Updated
        </div>
      </div>
    );
  }

  if (turn.from === "drishti") {
    if (channel === "WhatsApp") {
      return (
        <div className="max-w-[85%] animate-[fade-in_0.3s_ease-out]">
          <div className="rounded-lg rounded-tl-sm bg-[#202c33] px-3 py-2 text-sm text-white shadow">
            {turn.text}
            <div className="mt-1 text-right text-[9px] text-white/50">9:42 ✓✓</div>
          </div>
          {turn.meta && <div className="ml-1 mt-0.5 text-[9px] text-white/40">{turn.meta}</div>}
        </div>
      );
    }
    if (channel === "SMS") {
      return (
        <div className="max-w-[85%] animate-[fade-in_0.3s_ease-out]">
          <div className="rounded-2xl rounded-tl-sm bg-[oklch(0.92_0.01_240)] px-3 py-2 text-sm text-black">
            {turn.text}
          </div>
          {turn.meta && <div className="ml-2 mt-0.5 text-[9px] text-black/40">{turn.meta}</div>}
        </div>
      );
    }
    // YONO push card
    return (
      <div className="animate-[fade-in_0.3s_ease-out] rounded-xl border border-white/15 bg-white/10 p-3 backdrop-blur">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-white/70">
          <Zap className="h-3 w-3" /> DRISHTI Insight
        </div>
        <div className="mt-1 text-sm leading-snug">{turn.text}</div>
        {turn.meta && <div className="mt-1 text-[9px] text-white/50">{turn.meta}</div>}
      </div>
    );
  }

  // Customer reply waiting → show option buttons
  if (turn.options && isCurrent) {
    return (
      <div className="flex flex-col items-end gap-1.5">
        {turn.options.map((opt) => (
          <button
            key={opt}
            onClick={() => onChoose?.(opt)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              channel === "WhatsApp"
                ? "border border-[#00a884] bg-[#00a884]/20 text-[#a5f3d3] hover:bg-[#00a884]/40"
                : channel === "SMS"
                ? "border border-black/20 bg-black/5 text-black hover:bg-black/10"
                : "border border-cyan/50 bg-cyan/20 text-white hover:bg-cyan/30"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    );
  }

  // already-replied customer bubble
  if (turn.options && !isCurrent) {
    // show the picked option as a sent bubble (we don't track which; show first as default visible past message)
    return null;
  }
  return null;
}

function ChosenBubble({ text, channel }: { text: string; channel: "WhatsApp" | "SMS" | "YONO Push" }) {
  if (channel === "WhatsApp") {
    return (
      <div className="ml-auto max-w-[80%] animate-[fade-in_0.25s_ease-out]">
        <div className="rounded-lg rounded-tr-sm bg-[#005c4b] px-3 py-2 text-sm text-white shadow">
          {text}
          <div className="mt-1 text-right text-[9px] text-white/60">
            9:42 <CheckCheck className="inline h-3 w-3 text-[#53bdeb]" />
          </div>
        </div>
      </div>
    );
  }
  if (channel === "SMS") {
    return (
      <div className="ml-auto max-w-[80%] animate-[fade-in_0.25s_ease-out]">
        <div className="rounded-2xl rounded-tr-sm bg-[#007aff] px-3 py-2 text-sm text-white">{text}</div>
      </div>
    );
  }
  return (
    <div className="ml-auto max-w-[80%] animate-[fade-in_0.25s_ease-out]">
      <div className="rounded-xl rounded-tr-sm bg-cyan/30 px-3 py-2 text-sm text-white">{text}</div>
    </div>
  );
}

function ChatPanel() {
  const { personaId, step, setStep, started, setStarted, reset } = useSimulator();
  const p = getPersona(personaId);
  const [pulse, setPulse] = useState(false);
  const [chosen, setChosen] = useState<Record<number, string>>({});
  const [thinking, setThinking] = useState(false);

  // reset chosen when persona changes
  useEffect(() => {
    setChosen({});
  }, [personaId]);

  const visible = started ? p.thread.slice(0, step + 1) : [];

  const choose = (idx: number, opt: string) => {
    setChosen((c) => ({ ...c, [idx]: opt }));
    setThinking(true);
    setTimeout(() => {
      setThinking(false);
      setStep(Math.min(step + 1, p.thread.length - 1));
    }, 900);
  };

  const trigger = () => {
    setPulse(true);
    setTimeout(() => setPulse(false), 600);
    setStarted(true);
    setStep(0);
    setChosen({});
  };

  const Shell = p.channel === "WhatsApp" ? WhatsAppShell : p.channel === "SMS" ? SMSShell : YonoShell;

  return (
    <div className="glass-card p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-cyan">Live Device Simulator</div>
          <h2 className="mt-1 text-xl font-bold">{p.channel} · {p.language}</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={reset}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="h-3 w-3" /> Reset
          </button>
          <button
            onClick={trigger}
            className={`inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-cyan to-primary px-4 py-2 text-sm font-bold text-primary-foreground transition ${
              pulse ? "scale-95" : "hover:scale-105"
            } glow-cyan`}
          >
            <Zap className="h-4 w-4" /> Trigger DRISHTI Engine
          </button>
        </div>
      </div>

      <div className={`transition ${pulse ? "scale-[0.98]" : ""}`}>
        <PhoneFrame channel={`${p.channel} · ${p.language}`}>
          <Shell name={p.name}>
            {!started && (
              <div className="grid h-full place-items-center px-4 text-center text-xs text-black/60 sm:text-white/60">
                <div>
                  <Smartphone className="mx-auto mb-2 h-8 w-8 opacity-50" />
                  <div className="font-semibold">Awaiting trigger…</div>
                  <div className="mt-1">Click <span className="text-cyan">Trigger DRISHTI Engine</span> to start the conversation.</div>
                </div>
              </div>
            )}
            {visible.map((turn, idx) => {
              const isCurrent = idx === step;
              const isCustomerWaiting = turn.from === "customer" && isCurrent && !chosen[idx];
              const wasChosen = chosen[idx];
              return (
                <div key={idx}>
                  {turn.from === "drishti" && <Bubble turn={turn} channel={p.channel} isCurrent={isCurrent} />}
                  {turn.from === "customer" && wasChosen && (
                    <ChosenBubble text={wasChosen} channel={p.channel} />
                  )}
                  {isCustomerWaiting && (
                    <Bubble turn={turn} channel={p.channel} isCurrent onChoose={(opt) => choose(idx, opt)} />
                  )}
                </div>
              );
            })}
            {thinking && (
              <div className="max-w-[60%] animate-[fade-in_0.2s_ease-out]">
                <div
                  className={`rounded-lg px-3 py-2 text-xs ${
                    p.channel === "WhatsApp" ? "bg-[#202c33] text-white/70" : p.channel === "SMS" ? "bg-black/10 text-black/60" : "bg-white/10 text-white/70"
                  }`}
                >
                  <span className="inline-flex gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:120ms]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:240ms]" />
                  </span>
                  <span className="ml-2">DRISHTI is composing…</span>
                </div>
              </div>
            )}
          </Shell>
        </PhoneFrame>
      </div>

      <div className="mt-4 flex items-center justify-between text-[10px] text-muted-foreground">
        <span className="font-mono">turn {Math.min(step + (started ? 1 : 0), p.thread.length)} / {p.thread.length}</span>
        <span className="font-mono">latency 0.9s · structured JSON · model: claude-3-5-sonnet</span>
      </div>
    </div>
  );
}

function SimulatorPage() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan">
          <Smartphone className="h-3.5 w-3.5" /> Sandbox Simulator
        </div>
        <h1 className="mt-1 text-3xl font-black tracking-tight">Customer Conversation Studio</h1>
        <p className="text-sm text-muted-foreground">
          Pick a persona, fire the engine, and watch DRISHTI execute an end-to-end anticipatory conversion.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <CustomerMatrix />
        <ChatPanel />
      </div>
    </div>
  );
}
