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
    <section className="px-6 py-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {cases.map((c) => (
          <CaseCard key={c.id} item={c} />
        ))}
      </div>
    </section>
  );
}


