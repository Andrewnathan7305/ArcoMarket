"use client";
import React from "react";
import { useCases } from "../CasesContext";
import CaseCard from "./CaseCard";

export default function CasesLayout() {
  const { cases, isLoading, error } = useCases();

  if (isLoading) {
    return (
      <div className="px-6 py-8">
        <p className="text-neutral-300">Loading cases…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-6 py-8">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <section className="px-6 py-12">
      <div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {cases.map((c, index) => (
            <div 
              key={c.id} 
              className="animate-in fade-in slide-in-from-bottom-4 duration-500"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CaseCard item={c} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


