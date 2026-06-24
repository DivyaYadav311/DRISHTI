import { createContext, useContext, useState, type ReactNode } from "react";
import { personas, type Persona } from "./drishti-data";

type SimState = {
  personaId: Persona["id"];
  setPersonaId: (id: Persona["id"]) => void;
  step: number; // index into thread, advances by 2 (drishti turn + customer reply)
  setStep: (n: number) => void;
  started: boolean;
  setStarted: (b: boolean) => void;
  reset: () => void;
};

const Ctx = createContext<SimState | null>(null);

export function SimulatorProvider({ children }: { children: ReactNode }) {
  const [personaId, setPersonaIdState] = useState<Persona["id"]>("ramesh");
  const [step, setStep] = useState(0);
  const [started, setStarted] = useState(false);

  const setPersonaId = (id: Persona["id"]) => {
    setPersonaIdState(id);
    setStep(0);
    setStarted(false);
  };
  const reset = () => {
    setStep(0);
    setStarted(false);
  };

  return (
    <Ctx.Provider value={{ personaId, setPersonaId, step, setStep, started, setStarted, reset }}>
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
