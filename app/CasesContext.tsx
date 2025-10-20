"use client";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Outcome = {
  id: string;
  label: string;
  yesProbability: number; // 0..1
  noProbability: number; // 0..1
};

export type CaseItem = {
  id: string;
  title: string;
  imageUrl?: string;
  outcomes: Outcome[];
};

type CasesContextValue = {
  cases: CaseItem[];
  isLoading: boolean;
  error?: string;
  refresh: () => Promise<void>;
};

const CasesContext = createContext<CasesContextValue | undefined>(undefined);

async function fetchCasesMock(): Promise<CaseItem[]> {
  // Replace with real fetch to backend or contract
  await new Promise((r) => setTimeout(r, 300));
  return [
    {
      id: "1",
      title: "Bitcoin weekly close scenarios",
      imageUrl: "/window.svg",
      outcomes: [
        { id: "o1", label: "> $70k", yesProbability: 0.58, noProbability: 0.42 },
        { id: "o2", label: "$65k–$70k", yesProbability: 0.46, noProbability: 0.54 },
        { id: "o3", label: "$60k–$65k", yesProbability: 0.31, noProbability: 0.69 },
        { id: "o4", label: "$55k–$60k", yesProbability: 0.22, noProbability: 0.78 },
        { id: "o5", label: "< $55k", yesProbability: 0.14, noProbability: 0.86 },
      ],
    },
    {
      id: "2",
      title: "London Friday precipitation",
      imageUrl: "/globe.svg",
      outcomes: [
        { id: "o1", label: "> 10mm rain", yesProbability: 0.28, noProbability: 0.72 },
        { id: "o2", label: "5–10mm rain", yesProbability: 0.33, noProbability: 0.67 },
        { id: "o3", label: "1–5mm rain", yesProbability: 0.41, noProbability: 0.59 },
        { id: "o4", label: "< 1mm rain", yesProbability: 0.49, noProbability: 0.51 },
        { id: "o5", label: "No rain", yesProbability: 0.37, noProbability: 0.63 },
      ],
    },
    {
      id: "3",
      title: "US CPI YoY next print",
      imageUrl: "/file.svg",
      outcomes: [
        { id: "o1", label: "> 4.0%", yesProbability: 0.18, noProbability: 0.82 },
        { id: "o2", label: "3.5%–4.0%", yesProbability: 0.26, noProbability: 0.74 },
        { id: "o3", label: "3.0%–3.5%", yesProbability: 0.34, noProbability: 0.66 },
        { id: "o4", label: "2.5%–3.0%", yesProbability: 0.43, noProbability: 0.57 },
        { id: "o5", label: "< 2.5%", yesProbability: 0.19, noProbability: 0.81 },
      ],
    },
    {
      id: "4",
      title: "ETH price end of month",
      imageUrl: "/next.svg",
      outcomes: [
        { id: "o1", label: "> $4k", yesProbability: 0.21, noProbability: 0.79 },
        { id: "o2", label: "$3.5k–$4k", yesProbability: 0.27, noProbability: 0.73 },
        { id: "o3", label: "$3k–$3.5k", yesProbability: 0.39, noProbability: 0.61 },
        { id: "o4", label: "$2.5k–$3k", yesProbability: 0.31, noProbability: 0.69 },
        { id: "o5", label: "< $2.5k", yesProbability: 0.22, noProbability: 0.78 },
      ],
    },
    {
      id: "5",
      title: "US election winner (top party)",
      imageUrl: "/vercel.svg",
      outcomes: [
        { id: "o1", label: "Democrats", yesProbability: 0.52, noProbability: 0.48 },
        { id: "o2", label: "Republicans", yesProbability: 0.46, noProbability: 0.54 },
        { id: "o3", label: "Other", yesProbability: 0.02, noProbability: 0.98 },
        { id: "o4", label: "Hung parliament", yesProbability: 0.07, noProbability: 0.93 },
        { id: "o5", label: "Recount scenario", yesProbability: 0.11, noProbability: 0.89 },
      ],
    },
    {
      id: "6",
      title: "Apple quarterly iPhone shipments",
      imageUrl: "/file.svg",
      outcomes: [
        { id: "o1", label: "> 60M", yesProbability: 0.24, noProbability: 0.76 },
        { id: "o2", label: "55M–60M", yesProbability: 0.29, noProbability: 0.71 },
        { id: "o3", label: "50M–55M", yesProbability: 0.33, noProbability: 0.67 },
        { id: "o4", label: "45M–50M", yesProbability: 0.28, noProbability: 0.72 },
        { id: "o5", label: "< 45M", yesProbability: 0.17, noProbability: 0.83 },
      ],
    },
    {
      id: "7",
      title: "UEFA Champions League winner",
      imageUrl: "/globe.svg",
      outcomes: [
        { id: "o1", label: "Man City", yesProbability: 0.27, noProbability: 0.73 },
        { id: "o2", label: "Real Madrid", yesProbability: 0.25, noProbability: 0.75 },
        { id: "o3", label: "Bayern", yesProbability: 0.18, noProbability: 0.82 },
        { id: "o4", label: "PSG", yesProbability: 0.14, noProbability: 0.86 },
        { id: "o5", label: "Other", yesProbability: 0.16, noProbability: 0.84 },
      ],
    },
    {
      id: "8",
      title: "US GDP QoQ advance",
      imageUrl: "/window.svg",
      outcomes: [
        { id: "o1", label: "> 3.0%", yesProbability: 0.22, noProbability: 0.78 },
        { id: "o2", label: "2.5%–3.0%", yesProbability: 0.28, noProbability: 0.72 },
        { id: "o3", label: "2.0%–2.5%", yesProbability: 0.35, noProbability: 0.65 },
        { id: "o4", label: "1.5%–2.0%", yesProbability: 0.31, noProbability: 0.69 },
        { id: "o5", label: "< 1.5%", yesProbability: 0.19, noProbability: 0.81 },
      ],
    },
  ];
}

export function CasesProvider({ children }: { children: React.ReactNode }) {
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const refresh = useMemo(
    () => async () => {
      setIsLoading(true);
      setError(undefined);
      try {
        const data = await fetchCasesMock();
        setCases(data);
      } catch (e) {
        setError("Failed to load cases");
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value: CasesContextValue = {
    cases,
    isLoading,
    error,
    refresh,
  };

  return <CasesContext.Provider value={value}>{children}</CasesContext.Provider>;
}

export function useCases() {
  const ctx = useContext(CasesContext);
  if (!ctx) throw new Error("useCases must be used within CasesProvider");
  return ctx;
}


