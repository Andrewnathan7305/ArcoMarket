"use client";
import React, { useMemo, useState, useEffect } from "react";
import { ethers } from "ethers";
import { useMetaMask } from "../hooks/useMetaMask";
import { CONTRACT_ADDRESSES } from "../config/network";
import { useCases } from "../CasesContext";
import Image from "next/image";
import Link from "next/link";
import OutcomeChart from "../components/OutcomeChart";
import Particles from "../components/Particles";

export default function CaseDetail({ params }: { params: { id: string } }) {
  const { cases } = useCases();
  const current = useMemo(() => cases.find((c) => c.id === params.id), [cases, params.id]);
  const [selectedOutcomeId, setSelectedOutcomeId] = useState<string | undefined>(current?.outcomes[0]?.id);
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState<number>(0);
  const [amountText, setAmountText] = useState<string>("0");

  // Wallet and contract setup
  const { isConnected, signer, account } = useMetaMask();
  const [managerContract, setManagerContract] = useState<ethers.Contract | null>(null);
  const [loading, setLoading] = useState(false);

  // Toast state
  const [toast, setToast] = useState<{ message: string; txHash?: string } | null>(null);

  // Initialize Manager Contract
  useEffect(() => {
    if (signer && isConnected) {
      const manager = new ethers.Contract(
        CONTRACT_ADDRESSES.MANAGER,
        [
          "function batchBet(uint256[] calldata _marketIds, uint8[] calldata _outcomes, uint256[] calldata _amounts) external payable",
        ],
        signer
      );
      setManagerContract(manager);
    }
  }, [signer, isConnected]);

  // Auto-dismiss toast after 5 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  if (!current) {
    return (
      <div className="relative min-h-screen">
        <div className="fixed inset-0 z-10 w-full h-full">
          <Particles
            particleCount={10000}
            particleSpread={15}
            speed={0.15}
            particleColors={['#FFFFFF']}
            moveParticlesOnHover={true}
            particleHoverFactor={1.2}
            alphaParticles={true}
            particleBaseSize={50}
            sizeRandomness={1.5}
            cameraDistance={25}
            disableRotation={false}
            className="w-full h-full"
          />
        </div>
        <div className="relative z-20 px-6 py-8 pt-24">
          <p className="text-neutral-300">Case not found.</p>
          <Link href="/" className="text-primary-purple hover:text-primary-violet underline">Go back</Link>
        </div>
      </div>
    );
  }

  const selected = current.outcomes.find((o) => o.id === selectedOutcomeId) ?? current.outcomes[0];

  // Function to execute Trade (BatchBet)
  const handleTrade = async () => {
    if (!isConnected || !managerContract || !selectedOutcomeId || amount <= 0) {
      setToast({ message: "❌ Please connect wallet and enter a valid amount." });
      return;
    }

    try {
      setLoading(true);
      const marketIds = [parseInt(current.id)];
      const outcomes = [parseInt(selectedOutcomeId.replace("o", ""))];
      const amounts = [ethers.parseEther(amount.toString())];
      const totalValue = amount.toString();

      console.log("⚙️ Executing batchBet for Trade:", {
        marketIds,
        outcomes,
        amounts,
        totalValue,
      });

      const tx = await managerContract.batchBet(marketIds, outcomes, amounts, {
        value: ethers.parseEther(totalValue),
        gasLimit: 5_000_000,
      });

      console.log("✅ Transaction sent:", tx.hash);
      
      // Show toast with transaction hash
      setToast({
        message: `✅ Trade Executed! Transaction sent:`,
        txHash: tx.hash,
      });

      // Wait for confirmation
      const receipt = await tx.wait();
      console.log("✅ Transaction confirmed:", receipt);

      // Reset form
      setAmountText("0");
      setAmount(0);
    } catch (err: any) {
      console.error("❌ Trade failed:", err);
      setToast({ message: `❌ Trade failed: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 z-10 w-full h-full">
        <Particles
          particleCount={10000}
          particleSpread={15}
          speed={0.15}
          particleColors={['#FFFFFF']}
          moveParticlesOnHover={true}
          particleHoverFactor={1.2}
          alphaParticles={true}
          particleBaseSize={50}
          sizeRandomness={1.5}
          cameraDistance={25}
          disableRotation={false}
          className="w-full h-full"
        />
      </div>

      <div className="relative z-20 px-6 py-8 pt-24 max-w-6xl mx-auto">
        {/* Market Header */}
        <div className="mb-6">
          <h1 className="font-montserrat font-bold text-2xl text-white">{current.data_question}</h1>
          <p className="text-neutral-400 text-sm mt-1">Market ID: {current.id}</p>
        </div>

        {/* Chart Section */}
        <div className="mb-6">
          <OutcomeChart
            data={current.chartData}
            outcomes={current.outcomes.map(o => ({ id: o.id, label: o.label, color: "#10B981" }))}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Outcomes List */}
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-primary-violet/20 bg-neutral-900/40 overflow-hidden">
              <div className="divide-y divide-neutral-800">
                {current.outcomes.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => setSelectedOutcomeId(o.id)}
                    className={`w-full text-left px-4 py-3 transition-all duration-200 ${
                      o.id === selected?.id
                        ? "bg-primary-violet/20 border-l-4 border-primary-violet text-white"
                        : "hover:bg-primary-violet/10 text-neutral-200"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span className={`font-medium ${o.id === selected?.id ? "text-white" : "text-neutral-200"}`}>
                        {o.label}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2 py-1 rounded-full bg-success-green/20 text-success-green">
                          Yes {Math.round(o.yesProbability * 100)}%
                        </span>
                        <span className="text-xs font-bold px-2 py-1 rounded-full bg-danger-red/20 text-danger-red">
                          No {Math.round(o.noProbability * 100)}%
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Trade Card */}
          <div className="lg:col-span-1">
            <div className="rounded-xl border border-accent-600/20 bg-neutral-900/60 p-4 shadow-inner">
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-md bg-neutral-800 flex items-center justify-center text-neutral-400">
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
              </div>

              {/* Buy/Sell Tabs */}
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

              {/* Amount Section */}
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

              {/* Trade Button with batchBet */}
              <button
                onClick={handleTrade}
                disabled={!isConnected || !managerContract || amount <= 0 || loading}
                className={`w-full px-4 py-3 rounded-md font-semibold transition ${
                  amount > 0 && !loading
                    ? "bg-accent-gradient hover:bg-accent-gradient-hover text-white"
                    : "bg-neutral-800 text-neutral-500 cursor-not-allowed"
                }`}
              >
                {loading ? "Processing..." : isConnected ? "Trade" : "Connect Wallet"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm animate-in fade-in slide-in-from-bottom-4">
          <div className="rounded-lg bg-neutral-900 border border-primary-violet/30 shadow-lg p-4">
            <p className="text-white text-sm font-semibold">{toast.message}</p>
            {toast.txHash && (
              <a
                href={`https://etherscan.io/tx/${toast.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-purple hover:text-primary-violet underline text-xs mt-2 block break-all"
              >
                {toast.txHash}
              </a>
            )}
            <p className="text-neutral-400 text-xs mt-2">Auto-dismissing in 5 seconds...</p>
          </div>
        </div>
      )}
    </div>
  );
}
