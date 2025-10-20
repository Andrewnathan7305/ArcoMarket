"use client";
import React, { useMemo, useState } from "react";
import { useCases } from "../CasesContext";
import Image from "next/image";
import Link from "next/link";

export default function CaseDetail({ params }: { params: { id: string } }) {
  const { cases } = useCases();
  const current = useMemo(() => cases.find((c) => c.id === params.id), [cases, params.id]);
  const [selectedOutcomeId, setSelectedOutcomeId] = useState<string | undefined>(current?.outcomes[0]?.id);
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState<number>(0);
  const [amountText, setAmountText] = useState<string>("0");

  if (!current) {
    return (
      <div className="px-6 py-8">
        <p className="text-neutral-300">Case not found.</p>
        <Link href="/" className="text-accent-500 hover:text-accent-600 underline">Go back</Link>
      </div>
    );
  }

  const selected = current.outcomes.find((o) => o.id === selectedOutcomeId) ?? current.outcomes[0];

  return (
    <div className="px-6 py-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="font-montserrat font-bold text-2xl text-white">{current.title}</h1>
        <p className="text-neutral-400 text-sm mt-1">Market ID: {current.id}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Outcomes list */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-accent-600/20 bg-neutral-900/40 overflow-hidden">
            {current.imageUrl ? (
              <div className="relative h-56 w-full bg-neutral-800">
                <Image
                  src={current.imageUrl}
                  alt={current.title}
                  fill
                  className="object-cover opacity-80"
                  sizes="100vw"
                />
              </div>
            ) : null}
            <div className="divide-y divide-neutral-800">
              {current.outcomes.map((o) => (
                <button
                  key={o.id}
                  onClick={() => setSelectedOutcomeId(o.id)}
                  className={`w-full text-left px-4 py-3 hover:bg-accent-700/10 transition ${
                    o.id === selected?.id ? "bg-accent-700/10" : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-neutral-200">{o.label}</span>
                    <span className="text-neutral-400 text-sm">
                      Yes {Math.round(o.yesProbability * 100)}% · No {Math.round(o.noProbability * 100)}%
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Trade card */
        }
        <div className="lg:col-span-1">
          <div className="rounded-xl border border-accent-600/20 bg-neutral-900/60 p-4 shadow-inner">
            {/* Header row */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-md bg-neutral-800 flex items-center justify-center text-neutral-400">
                  {/* simple icon square */}
                  <span className="text-xs">⧉</span>
                </div>
                <div>
                  <div className="font-montserrat font-bold text-white text-lg leading-tight">
                    {selected?.label}
                  </div>
                  <div className="text-neutral-400 text-xs">
                    Yes {Math.round((selected?.yesProbability ?? 0) * 100)}% · No {Math.round((selected?.noProbability ?? 0) * 100)}%
                  </div>
                </div>
              </div>
              <div>
                <select className="bg-neutral-900 border border-accent-600/30 text-neutral-200 text-sm rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-accent-600">
                  <option>Market</option>
                  <option>Binary</option>
                </select>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-4 border-b border-neutral-800 mb-4">
              <button
                className={`pb-2 text-sm font-semibold ${side === "buy" ? "text-white border-b-2 border-accent-600" : "text-neutral-400"}`}
                onClick={() => setSide("buy")}
              >
                Buy
              </button>
              <button
                className={`pb-2 text-sm font-semibold ${side === "sell" ? "text-white border-b-2 border-accent-600" : "text-neutral-400"}`}
                onClick={() => setSide("sell")}
              >
                Sell
              </button>
            </div>

            {/* Outcome pills */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                className="rounded-full px-3 py-2 text-sm font-semibold border transition bg-green-600/20 border-green-600 text-green-300 hover:opacity-80"
              >
                Yes · ${Math.round((selected?.yesProbability ?? 0) * 100)}
              </button>
              <button
                className="rounded-full px-3 py-2 text-sm font-semibold border transition bg-red-600/20 border-red-600 text-red-300 hover:opacity-80"
              >
                No · ${Math.round((selected?.noProbability ?? 0) * 100)}
              </button>
            </div>

            {/* Amount section */}
            <div className="mb-3 flex items-center justify-between">
              <label className="text-neutral-300 text-sm">Amount</label>
              <div className="text-white text-xl font-bold">${amount.toFixed(0)}</div>
            </div>
            <div className="flex items-center gap-2 mb-4">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={amountText}
                onFocus={() => { if (amountText === "0") setAmountText(""); }}
                onBlur={() => { if (amountText === "") setAmountText("0"); }}
                onChange={(e) => {
                  const digits = e.target.value.replace(/[^0-9]/g, "");
                  const normalized = digits.replace(/^0+(?=\d)/, "");
                  setAmountText(normalized);
                  setAmount(normalized === "" ? 0 : Number(normalized));
                }}
                className="flex-1 rounded-md bg-neutral-900 border border-accent-600/30 px-3 py-2 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-accent-600"
                placeholder="Enter amount"
              />
            </div>

            {/* Trade button */}
            <button
              disabled={amount <= 0}
              className={`w-full px-4 py-3 rounded-md font-semibold transition ${
                amount > 0 ? "bg-accent-gradient hover:opacity-90 text-white" : "bg-neutral-800 text-neutral-500 cursor-not-allowed"
              }`}
            >
              Trade
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


