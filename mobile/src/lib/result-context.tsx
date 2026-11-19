import { createContext, useContext, useState, type ReactNode } from "react";
import type { ExplainResult } from "./types";

type Value = { result: ExplainResult | null; setResult: (r: ExplainResult | null) => void };

const ResultContext = createContext<Value>({ result: null, setResult: () => {} });

// Holds the latest explanation so the results screen can show it.
// Nothing is saved to the phone.
export function ResultProvider({ children }: { children: ReactNode }) {
  const [result, setResult] = useState<ExplainResult | null>(null);
  return <ResultContext.Provider value={{ result, setResult }}>{children}</ResultContext.Provider>;
}

export const useResult = () => useContext(ResultContext);
