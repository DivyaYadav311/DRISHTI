import { createContext, useContext, useState, type ReactNode } from "react";
import { personas, type Persona } from "./drishti-data";
import type { Journey } from "./api-client";

type SimState = {
  personaId: Persona["id"];
  setPersonaId: (id: Persona["id"]) => void;
  step: number; // index into thread, advances by 2 (drishti turn + customer reply)
  setStep: (n: number) => void;
  started: boolean;
  setStarted: (b: boolean) => void;
  reset: () => void;
  // Live mode — actual backend integration
  liveMode: boolean;
  setLiveMode: (b: boolean) => void;
  liveJourney: Journey | null;
  setLiveJourney: (j: Journey | null) => void;
  loading: boolean;
  setLoading: (b: boolean) => void;
  backendError: string | null;
  setBackendError: (e: string | null) => void;
};

const Ctx = createContext<SimState | null>(null);

export function SimulatorProvider({ children }: { children: ReactNode }) {
  const [personaId, setPersonaIdState] = useState<Persona["id"]>("ramesh");
  const [step, setStep] = useState(0);
  const [started, setStarted] = useState(false);
  const [liveMode, setLiveMode] = useState(false);
  const [liveJourney, setLiveJourney] = useState<Journey | null>(null);
  const [loading, setLoading] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);

  const setPersonaId = (id: Persona["id"]) => {
    setPersonaIdState(id);
    setStep(0);
    setStarted(false);
    setLiveJourney(null);
    setBackendError(null);
  };
  const reset = () => {
    setStep(0);
    setStarted(false);
    setLiveJourney(null);
    setBackendError(null);
  };

  return (
    <Ctx.Provider
      value={{
        personaId,
        setPersonaId,
        step,
        setStep,
        started,
        setStarted,
        reset,
        liveMode,
        setLiveMode,
        liveJourney,
        setLiveJourney,
        loading,
        setLoading,
        backendError,
        setBackendError,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useSimulator() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSimulator outside provider");
  return v;
}

export function getPersona(id: Persona["id"]) {
  return personas.find((p) => p.id === id)!;
}
