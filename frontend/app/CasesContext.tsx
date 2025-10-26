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
  data_question: string;
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

// ✅ FETCH FROM JSON FILE
async function fetchCasesFromJSON(): Promise<CaseItem[]> {
  try {
    const response = await fetch('/markets.json');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch markets: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("✅ Raw Data from /api/markets:", data);

    
    // Map the JSON data to CaseItem format
    const cases: CaseItem[] = data.map((market: any) => ({
      id: market.id || market.data_id,
      data_question: market.data_question || market.question,
      imageUrl: market.imageUrl || '/default-market.jpeg',
      outcomes: market.outcomes || [],
      chartData: market.chartData || []
    }));
    
    console.log("✅ Mapped Cases for Context:", cases);


    return cases;
  } catch (error) {
    console.error('Error fetching markets:', error);
    throw new Error('Failed to load markets from JSON');
  }
}

// ✅ ALTERNATIVE: FETCH FROM API ENDPOINT
async function fetchCasesFromAPI(): Promise<CaseItem[]> {
  try {
    const response = await fetch('/api/markets');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch markets: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Map the API response to CaseItem format
    const cases: CaseItem[] = data.map((market: any) => ({
      id: market.id || market.data_id,
      data_question: market.data_question || market.question,
      imageUrl: market.imageUrl || '/1.jpeg',
      outcomes: market.outcomes || [],
      chartData: market.chartData || []
    }));
    
    return cases;
  } catch (error) {
    console.error('Error fetching markets:', error);
    throw new Error('Failed to load markets from API');
  }
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
        // ✅ CHOOSE ONE: fetchCasesFromJSON or fetchCasesFromAPI
        const data = await fetchCasesFromAPI(); // ← Change to fetchCasesFromJSON if using JSON file
        setCases(data);
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Failed to load markets";
        setError(errorMessage);
        console.error(errorMessage);
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
