"use client";
import React from "react";
import { useCases } from "../CasesContext";
import CaseCard from "./CaseCard";
import Particles from "./Particles";

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
    <section className="relative min-h-screen">
      {/* Fixed Particles Background */}
      <div className="fixed inset-0 z-0">
        <Particles
          particleCount={10000}
          particleSpread={15}
          speed={0.15}
          particleColors={['#ffffff']}
          moveParticlesOnHover={true}
          particleHoverFactor={1.2}
          alphaParticles={true}
          particleBaseSize={50}
          sizeRandomness={1.5}
          cameraDistance={25}
          disableRotation={false}
        />
      </div>
      
      {/* Content */}
      <div className="relative z-10 px-6 py-12 pt-24">
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
      </div>
    </section>
  );
}


