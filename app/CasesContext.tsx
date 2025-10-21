"use client";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Outcome = {
  id: string;
  label: string;
  yesProbability: number; // 0..1
  noProbability: number; // 0..1
  color: string; // Chart color
};

export type CaseItem = {
  id: string;
  title: string;
  imageUrl: string;
  outcomes: Outcome[];
  chartData: Array<{ time: string; [key: string]: string | number }>;
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
      imageUrl: "/1.jpeg",
      outcomes: [
        { id: "o1", label: "> $70k", yesProbability: 0.58, noProbability: 0.42, color: "#10B981" },
        { id: "o2", label: "$65k–$70k", yesProbability: 0.46, noProbability: 0.54, color: "#3B82F6" },
        { id: "o3", label: "$60k–$65k", yesProbability: 0.31, noProbability: 0.69, color: "#8B5CF6" },
        { id: "o4", label: "$55k–$60k", yesProbability: 0.22, noProbability: 0.78, color: "#F59E0B" },
        { id: "o5", label: "< $55k", yesProbability: 0.14, noProbability: 0.86, color: "#EF4444" },
      ],
      chartData: [
        { time: "Jan 1", o1: 45, o2: 35, o3: 15, o4: 3, o5: 2 },
        { time: "Jan 2", o1: 52, o2: 28, o3: 12, o4: 5, o5: 3 },
        { time: "Jan 3", o1: 48, o2: 32, o3: 14, o4: 4, o5: 2 },
        { time: "Jan 4", o1: 55, o2: 25, o3: 13, o4: 4, o5: 3 },
        { time: "Jan 5", o1: 58, o2: 24, o3: 12, o4: 4, o5: 2 },
        { time: "Jan 6", o1: 61, o2: 22, o3: 11, o4: 4, o5: 2 },
        { time: "Jan 7", o1: 58, o2: 26, o3: 10, o4: 4, o5: 2 },
        { time: "Jan 8", o1: 62, o2: 20, o3: 9, o4: 5, o5: 4 },
        { time: "Jan 9", o1: 59, o2: 24, o3: 11, o4: 4, o5: 2 },
        { time: "Jan 10", o1: 64, o2: 18, o3: 8, o4: 6, o5: 4 },
        { time: "Jan 11", o1: 57, o2: 26, o3: 13, o4: 3, o5: 1 },
        { time: "Jan 12", o1: 60, o2: 23, o3: 10, o4: 5, o5: 2 },
        { time: "Jan 13", o1: 63, o2: 19, o3: 9, o4: 6, o5: 3 },
        { time: "Jan 14", o1: 56, o2: 27, o3: 12, o4: 4, o5: 1 },
      ],
    },
    {
      id: "2",
      title: "London Friday precipitation",
      imageUrl: "/1.jpeg",
      outcomes: [
        { id: "o1", label: "> 10mm rain", yesProbability: 0.28, noProbability: 0.72, color: "#EF4444" },
        { id: "o2", label: "5–10mm rain", yesProbability: 0.33, noProbability: 0.67, color: "#F59E0B" },
        { id: "o3", label: "1–5mm rain", yesProbability: 0.41, noProbability: 0.59, color: "#3B82F6" },
        { id: "o4", label: "< 1mm rain", yesProbability: 0.49, noProbability: 0.51, color: "#10B981" },
        { id: "o5", label: "No rain", yesProbability: 0.37, noProbability: 0.63, color: "#6B7280" },
      ],
      chartData: [
        { time: "Jan 1", o1: 15, o2: 25, o3: 35, o4: 20, o5: 5 },
        { time: "Jan 2", o1: 18, o2: 28, o3: 32, o4: 18, o5: 4 },
        { time: "Jan 3", o1: 12, o2: 22, o3: 38, o4: 22, o5: 6 },
        { time: "Jan 4", o1: 20, o2: 30, o3: 30, o4: 15, o5: 5 },
        { time: "Jan 5", o1: 16, o2: 26, o3: 34, o4: 19, o5: 5 },
        { time: "Jan 6", o1: 14, o2: 24, o3: 36, o4: 21, o5: 5 },
        { time: "Jan 7", o1: 17, o2: 27, o3: 33, o4: 18, o5: 5 },
        { time: "Jan 8", o1: 19, o2: 29, o3: 31, o4: 16, o5: 5 },
        { time: "Jan 9", o1: 13, o2: 23, o3: 37, o4: 20, o5: 7 },
        { time: "Jan 10", o1: 21, o2: 31, o3: 29, o4: 14, o5: 5 },
        { time: "Jan 11", o1: 15, o2: 25, o3: 35, o4: 19, o5: 6 },
        { time: "Jan 12", o1: 11, o2: 21, o3: 39, o4: 23, o5: 6 },
        { time: "Jan 13", o1: 18, o2: 28, o3: 32, o4: 17, o5: 5 },
        { time: "Jan 14", o1: 16, o2: 26, o3: 34, o4: 19, o5: 5 },
      ],
    },
    {
      id: "3",
      title: "US CPI YoY next print",
      imageUrl: "/1.jpeg",
      outcomes: [
        { id: "o1", label: "> 4.0%", yesProbability: 0.18, noProbability: 0.82, color: "#EF4444" },
        { id: "o2", label: "3.5%–4.0%", yesProbability: 0.26, noProbability: 0.74, color: "#F59E0B" },
        { id: "o3", label: "3.0%–3.5%", yesProbability: 0.34, noProbability: 0.66, color: "#8B5CF6" },
        { id: "o4", label: "2.5%–3.0%", yesProbability: 0.43, noProbability: 0.57, color: "#3B82F6" },
        { id: "o5", label: "< 2.5%", yesProbability: 0.19, noProbability: 0.81, color: "#10B981" },
      ],
      chartData: [
        { time: "Jan 1", o1: 8, o2: 15, o3: 25, o4: 40, o5: 12 },
        { time: "Jan 2", o1: 10, o2: 18, o3: 28, o4: 35, o5: 9 },
        { time: "Jan 3", o1: 12, o2: 20, o3: 30, o4: 32, o5: 6 },
        { time: "Jan 4", o1: 9, o2: 16, o3: 26, o4: 38, o5: 11 },
        { time: "Jan 5", o1: 11, o2: 19, o3: 29, o4: 34, o5: 7 },
        { time: "Jan 6", o1: 13, o2: 21, o3: 31, o4: 30, o5: 5 },
        { time: "Jan 7", o1: 10, o2: 17, o3: 27, o4: 36, o5: 10 },
        { time: "Jan 8", o1: 14, o2: 22, o3: 33, o4: 28, o5: 3 },
        { time: "Jan 9", o1: 7, o2: 14, o3: 24, o4: 42, o5: 13 },
        { time: "Jan 10", o1: 15, o2: 23, o3: 32, o4: 26, o5: 4 },
        { time: "Jan 11", o1: 6, o2: 13, o3: 23, o4: 44, o5: 14 },
        { time: "Jan 12", o1: 16, o2: 24, o3: 34, o4: 24, o5: 2 },
        { time: "Jan 13", o1: 5, o2: 12, o3: 22, o4: 46, o5: 15 },
        { time: "Jan 14", o1: 17, o2: 25, o3: 35, o4: 22, o5: 1 },
      ],
    },
    {
      id: "4",
      title: "ETH price end of month",
      imageUrl: "/1.jpeg",
      outcomes: [
        { id: "o1", label: "> $4k", yesProbability: 0.21, noProbability: 0.79, color: "#10B981" },
        { id: "o2", label: "$3.5k–$4k", yesProbability: 0.27, noProbability: 0.73, color: "#3B82F6" },
        { id: "o3", label: "$3k–$3.5k", yesProbability: 0.39, noProbability: 0.61, color: "#8B5CF6" },
        { id: "o4", label: "$2.5k–$3k", yesProbability: 0.31, noProbability: 0.69, color: "#F59E0B" },
        { id: "o5", label: "< $2.5k", yesProbability: 0.22, noProbability: 0.78, color: "#EF4444" },
      ],
      chartData: [
        { time: "Jan 1", o1: 12, o2: 18, o3: 35, o4: 25, o5: 10 },
        { time: "Jan 2", o1: 15, o2: 20, o3: 32, o4: 23, o5: 10 },
        { time: "Jan 3", o1: 18, o2: 22, o3: 30, o4: 20, o5: 10 },
        { time: "Jan 4", o1: 14, o2: 19, o3: 33, o4: 24, o5: 10 },
        { time: "Jan 5", o1: 16, o2: 21, o3: 31, o4: 22, o5: 10 },
        { time: "Jan 6", o1: 19, o2: 23, o3: 29, o4: 19, o5: 10 },
        { time: "Jan 7", o1: 17, o2: 20, o3: 32, o4: 21, o5: 10 },
      ],
    },
    {
      id: "5",
      title: "US election winner (top party)",
      imageUrl: "/1.jpeg",
      outcomes: [
        { id: "o1", label: "Democrats", yesProbability: 0.52, noProbability: 0.48, color: "#3B82F6" },
        { id: "o2", label: "Republicans", yesProbability: 0.46, noProbability: 0.54, color: "#EF4444" },
        { id: "o3", label: "Other", yesProbability: 0.02, noProbability: 0.98, color: "#6B7280" },
        { id: "o4", label: "Hung parliament", yesProbability: 0.07, noProbability: 0.93, color: "#F59E0B" },
        { id: "o5", label: "Recount scenario", yesProbability: 0.11, noProbability: 0.89, color: "#8B5CF6" },
      ],
      chartData: [
        { time: "Jan 1", o1: 48, o2: 44, o3: 2, o4: 4, o5: 2 },
        { time: "Jan 2", o1: 50, o2: 42, o3: 2, o4: 4, o5: 2 },
        { time: "Jan 3", o1: 49, o2: 43, o3: 2, o4: 4, o5: 2 },
        { time: "Jan 4", o1: 51, o2: 41, o3: 2, o4: 4, o5: 2 },
        { time: "Jan 5", o1: 52, o2: 40, o3: 2, o4: 4, o5: 2 },
        { time: "Jan 6", o1: 50, o2: 42, o3: 2, o4: 4, o5: 2 },
        { time: "Jan 7", o1: 49, o2: 43, o3: 2, o4: 4, o5: 2 },
      ],
    },
    {
      id: "6",
      title: "Apple quarterly iPhone shipments",
      imageUrl: "/1.jpeg",
      outcomes: [
        { id: "o1", label: "> 60M", yesProbability: 0.24, noProbability: 0.76, color: "#10B981" },
        { id: "o2", label: "55M–60M", yesProbability: 0.29, noProbability: 0.71, color: "#3B82F6" },
        { id: "o3", label: "50M–55M", yesProbability: 0.33, noProbability: 0.67, color: "#8B5CF6" },
        { id: "o4", label: "45M–50M", yesProbability: 0.28, noProbability: 0.72, color: "#F59E0B" },
        { id: "o5", label: "< 45M", yesProbability: 0.17, noProbability: 0.83, color: "#EF4444" },
      ],
      chartData: [
        { time: "Jan 1", o1: 15, o2: 22, o3: 28, o4: 25, o5: 10 },
        { time: "Jan 2", o1: 18, o2: 25, o3: 30, o4: 22, o5: 5 },
        { time: "Jan 3", o1: 20, o2: 27, o3: 32, o4: 18, o5: 3 },
        { time: "Jan 4", o1: 16, o2: 24, o3: 29, o4: 24, o5: 7 },
        { time: "Jan 5", o1: 19, o2: 26, o3: 31, o4: 20, o5: 4 },
        { time: "Jan 6", o1: 22, o2: 28, o3: 33, o4: 15, o5: 2 },
        { time: "Jan 7", o1: 17, o2: 25, o3: 30, o4: 22, o5: 6 },
      ],
    },
    {
      id: "7",
      title: "UEFA Champions League winner",
      imageUrl: "/1.jpeg",
      outcomes: [
        { id: "o1", label: "Man City", yesProbability: 0.27, noProbability: 0.73, color: "#10B981" },
        { id: "o2", label: "Real Madrid", yesProbability: 0.25, noProbability: 0.75, color: "#3B82F6" },
        { id: "o3", label: "Bayern", yesProbability: 0.18, noProbability: 0.82, color: "#8B5CF6" },
        { id: "o4", label: "PSG", yesProbability: 0.14, noProbability: 0.86, color: "#F59E0B" },
        { id: "o5", label: "Other", yesProbability: 0.16, noProbability: 0.84, color: "#6B7280" },
      ],
      chartData: [
        { time: "Jan 1", o1: 22, o2: 20, o3: 15, o4: 12, o5: 31 },
        { time: "Jan 2", o1: 25, o2: 22, o3: 16, o4: 10, o5: 27 },
        { time: "Jan 3", o1: 28, o2: 24, o3: 18, o4: 8, o5: 22 },
        { time: "Jan 4", o1: 26, o2: 23, o3: 17, o4: 11, o5: 23 },
        { time: "Jan 5", o1: 29, o2: 25, o3: 19, o4: 9, o5: 18 },
        { time: "Jan 6", o1: 31, o2: 27, o3: 20, o4: 7, o5: 15 },
        { time: "Jan 7", o1: 27, o2: 24, o3: 18, o4: 10, o5: 21 },
      ],
    },
    {
      id: "8",
      title: "US GDP QoQ advance",
      imageUrl: "/1.jpeg",
      outcomes: [
        { id: "o1", label: "> 3.0%", yesProbability: 0.22, noProbability: 0.78, color: "#10B981" },
        { id: "o2", label: "2.5%–3.0%", yesProbability: 0.28, noProbability: 0.72, color: "#3B82F6" },
        { id: "o3", label: "2.0%–2.5%", yesProbability: 0.35, noProbability: 0.65, color: "#8B5CF6" },
        { id: "o4", label: "1.5%–2.0%", yesProbability: 0.31, noProbability: 0.69, color: "#F59E0B" },
        { id: "o5", label: "< 1.5%", yesProbability: 0.19, noProbability: 0.81, color: "#EF4444" },
      ],
      chartData: [
        { time: "Jan 1", o1: 15, o2: 20, o3: 30, o4: 25, o5: 10 },
        { time: "Jan 2", o1: 18, o2: 23, o3: 32, o4: 22, o5: 5 },
        { time: "Jan 3", o1: 20, o2: 25, o3: 35, o4: 18, o5: 2 },
        { time: "Jan 4", o1: 16, o2: 22, o3: 33, o4: 24, o5: 5 },
        { time: "Jan 5", o1: 19, o2: 24, o3: 34, o4: 20, o5: 3 },
        { time: "Jan 6", o1: 22, o2: 26, o3: 36, o4: 15, o5: 1 },
        { time: "Jan 7", o1: 17, o2: 23, o3: 34, o4: 22, o5: 4 },
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



// async function fetchCasesMock(): Promise<CaseItem[]> {
//   // Replace with real fetch to backend or contract
//   await new Promise((r) => setTimeout(r, 300));
//   return [
//     {
//       id: "1",
//       title: "Bitcoin weekly close scenarios",
//       // ... all the hardcoded data ...
//     },
//     // ... more cases ...
//   ];
// }




// async function fetchCasesFromAPI(): Promise<CaseItem[]> {
//   const response = await fetch("https://your-backend-api.com/api/cases");
  
//   if (!response.ok) {
//     throw new Error(`Failed to fetch cases: ${response.status}`);
//   }
  
//   const data: CaseItem[] = await response.json();
//   return data;
// }


// const data = await fetchCasesMock();  // ← Line 240
// const data = await fetchCasesFromAPI();  // ← Change function name
