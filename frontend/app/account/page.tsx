"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ethers } from 'ethers';
import { useMetaMask } from '../hooks/useMetaMask';
import { useContract } from '../hooks/useContract';
import { CONTRACT_ADDRESSES } from '../config/network';

// Contract ABIs
const MARKET_FACTORY_ABI = [
  "function createMarket(string memory _question, uint256 _numOutcomes, uint256 _closingTime) external payable returns (uint256)",
  "function getMarket(uint256 _marketId) external returns (address)",
  "function getTotalMarkets() external returns (uint256)",
  "function getTotalVolume() external returns (uint256)"
];

type OutcomeData = {
  id: string;
  label: string;
  yesProbability: number;
  noProbability: number;
};

type User = {
  name: string;
  email?: string;
  accountCreated: string;
  walletAddress?: string;
  network?: string;
};

export default function AccountPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  // Wallet and contract state
  const {
    isConnected,
    account,
    signer,
    loading: walletLoading
  } = useMetaMask();

  const {
    error: contractError,
    callFactory,
    clearError
  } = useContract();

  // Market creation state
  const [factoryContract, setFactoryContract] = useState<ethers.Contract | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [createdMarket, setCreatedMarket] = useState<any>(null);
  const [marketCompleteData, setMarketCompleteData] = useState<any>(null);

  // New state for dynamic outcomes
  const [numOutcomes, setNumOutcomes] = useState<number>(2);
  const [outcomeLabels, setOutcomeLabels] = useState<string[]>(['', '']);
  const [imageUrl, setImageUrl] = useState<string>('');

  useEffect(() => {
    const savedUser = localStorage.getItem("arco_user");
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      setIsLoggedIn(true);
    } else {
      router.push("/");
    }
  }, [router]);

  // Initialize contract when signer is available
  useEffect(() => {
    if (signer && isConnected) {
      const factory = new ethers.Contract(CONTRACT_ADDRESSES.MARKET_FACTORY, MARKET_FACTORY_ABI, signer);
      setFactoryContract(factory);
    }
  }, [signer, isConnected]);

  // Update outcome labels when numOutcomes changes
  useEffect(() => {
    const newNumOutcomes = parseInt(numOutcomes.toString());
    if (newNumOutcomes !== outcomeLabels.length) {
      const updatedLabels = Array(newNumOutcomes).fill('').map((_, i) => outcomeLabels[i] || '');
      setOutcomeLabels(updatedLabels);
    }
  }, [numOutcomes]);

  // Generate color for outcomes
  const getOutcomeColor = (index: number): string => {
    const colors = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];
    return colors[index % colors.length];
  };

  // Market creation function
  const createMarket = async (question: string, numOutcomesInt: number, closingTime: number, deposit: string) => {
    if (!factoryContract) {
      setError('Contract not initialized');
      return;
    }

    // Validate all outcome labels are filled
    if (outcomeLabels.some(label => !label.trim())) {
      setError('Please fill in all outcome labels');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const depositWei = ethers.parseEther(deposit);
      console.log('Creating market with params:', {
        question,
        numOutcomesInt,
        closingTime,
        deposit: depositWei.toString(),
        contractAddress: CONTRACT_ADDRESSES.MARKET_FACTORY,
        outcomes: outcomeLabels
      });

      // Check if contract exists at address
      const code = await signer?.provider?.getCode(CONTRACT_ADDRESSES.MARKET_FACTORY);
      console.log('Contract code length:', code?.length || 0);

      if (!code || code === '0x') {
        setError('Contract not deployed at the specified address. Please check the contract address.');
        return;
      }

      // Estimate gas first
      try {
        const gasEstimate = await factoryContract.createMarket.estimateGas(question, numOutcomesInt, closingTime, {
          value: depositWei
        });
        console.log('Gas estimate:', gasEstimate.toString());
      } catch (gasError: any) {
        console.error('Gas estimation failed:', gasError);
        setError(`Gas estimation failed: ${gasError.message}`);
        return;
      }

      const tx = await factoryContract.createMarket(question, numOutcomesInt, closingTime, {
        value: depositWei,
        gasLimit: 5000000
      });

      console.log('Transaction sent:', tx.hash);
      setSuccess('Market creation transaction sent! Waiting for confirmation...');

      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);

      if (receipt.status === 0) {
        setError('Transaction failed. The contract call was reverted.');
        return;
      }

      // Get the market ID from the transaction logs
      let marketId = 'Unknown';
      for (const log of receipt.logs) {
        if (log.topics[0] === '0x2b91ffc4f3ea962a05a3f50785d7fb3f21291480f14fb1475381f92dd553e304') {
          marketId = ethers.getBigInt(log.topics[1]).toString();
          break;
        }
      }

      // Build createdMarket for on-chain reference
      const createdMarketData = {
        id: marketId.toString(),
        question,
        numOutcomes: numOutcomesInt,
        closingTime,
        deposit,
        txHash: tx.hash,
        blockNumber: receipt.blockNumber
      };

      // Build outcomes array with labels and default probabilities
      const outcomesData: OutcomeData[] = outcomeLabels.map((label, index) => ({
        id: `o${index + 1}`,
        label: label,
        yesProbability: 0.5,
        noProbability: 0.5
      }));

      // Generate unique data_id (could be timestamp or market ID)
      const dataId = marketId;

      // Build complete market data for JSON storage
      const marketCompleteDataFinal = {
        ...createdMarketData,
        data_id: marketId,
        data_question: question,
        imageUrl: imageUrl || '/default-market.jpeg', // Use provided image or default
        outcomes: outcomesData,
        chartData: [], // Empty as requested
        creator: account,
        createdAt: new Date().toISOString(),
        status: 'active',
        totalTradeVolume: '0',
        participantsCount: 0
      };

      console.log('💾 Setting createdMarket:', createdMarketData);
      console.log('💾 Setting marketCompleteData:', marketCompleteDataFinal);

      // Trigger both state updates
      setCreatedMarket(createdMarketData);
      setMarketCompleteData(marketCompleteDataFinal);

      // Save only marketCompleteData to JSON file
      try {
        const response = await fetch('/api/markets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(marketCompleteDataFinal)
        });

        if (response.ok) {
          console.log('✅ marketCompleteData saved to JSON file');
        } else {
          console.error('❌ Failed to save');
        }
      } catch (error) {
        console.error('❌ Error saving to JSON:', error);
      }

      setSuccess(`Market created successfully! Market ID: ${marketId}`);
    } catch (err: any) {
      console.error('Market creation error:', err);

      if (err.code === 'CALL_EXCEPTION') {
        setError('Contract call failed. The contract may not be deployed or the function call is invalid.');
      } else if (err.code === 'INSUFFICIENT_FUNDS') {
        setError('Insufficient funds for transaction.');
      } else if (err.code === 'UNPREDICTABLE_GAS_LIMIT') {
        setError('Transaction would fail. Please check your inputs and contract state.');
      } else {
        setError(`Failed to create market: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setIsLoggedIn(false);
    localStorage.removeItem("arco_user");
    window.dispatchEvent(new CustomEvent("logout"));
    router.push("/");
  };

  if (!isLoggedIn || !user) {
    return (
      <div className="px-6 py-8 pt-24">
        <p className="text-neutral-300">Redirecting...</p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="px-6 py-8 pt-24 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="font-montserrat font-bold text-3xl text-white mb-2">Account</h1>
        <p className="text-neutral-400">Manage your account settings and view your information</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Account Information */}
        <div className="rounded-xl border border-primary-violet/20 bg-neutral-900/40 p-6 animate-fade-in-up hover:scale-105 transition-transform duration-200">
          <h2 className="font-montserrat font-bold text-xl text-white mb-4">Account Information</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-neutral-400 mb-1">Name</label>
              <p className="text-white font-medium">{user.name}</p>
            </div>

            {user.email && (
              <div>
                <label className="block text-sm text-neutral-400 mb-1">Email</label>
                <p className="text-white font-medium">{user.email}</p>
              </div>
            )}

            <div>
              <label className="block text-sm text-neutral-400 mb-1">Account Created</label>
              <p className="text-white font-medium">{formatDate(user.accountCreated)}</p>
            </div>
          </div>
        </div>

        {/* Wallet Information */}
        <div className="rounded-xl border border-primary-violet/20 bg-neutral-900/40 p-6 animate-fade-in-up animate-delay-100 hover:scale-105 transition-transform duration-200">
          <h2 className="font-montserrat font-bold text-xl text-white mb-4">Wallet Information</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-neutral-400 mb-1">Wallet Address</label>
              <p className="text-white font-mono text-sm break-all">{user.walletAddress}</p>
            </div>

            <div>
              <label className="block text-sm text-neutral-400 mb-1">Network</label>
              <p className="text-white font-medium">{user.network}</p>
            </div>
          </div>
        </div>

        {/* Trading Stats */}
        <div className="rounded-xl border border-primary-violet/20 bg-neutral-900/40 p-6 animate-fade-in-up animate-delay-200 hover:scale-105 transition-transform duration-200">
          <h2 className="font-montserrat font-bold text-xl text-white mb-4">Trading Stats</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary-purple">0</p>
              <p className="text-sm text-neutral-400">Total Trades</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary-purple">$0</p>
              <p className="text-sm text-neutral-400">Total Volume</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary-purple">0%</p>
              <p className="text-sm text-neutral-400">Win Rate</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary-purple">$0</p>
              <p className="text-sm text-neutral-400">P&L</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="rounded-xl border border-primary-violet/20 bg-neutral-900/40 p-6 animate-fade-in-up animate-delay-300 hover:scale-105 transition-transform duration-200">
          <h2 className="font-montserrat font-bold text-xl text-white mb-4">Actions</h2>

          <div className="space-y-3">
            <button
              onClick={logout}
              className="w-full px-4 py-2 rounded-md border border-red-600 text-red-400 hover:bg-red-600/10 transition font-semibold"
            >
              Logout
            </button>

            <Link
              href="/"
              className="block w-full px-4 py-2 rounded-md bg-primary-gradient hover:bg-primary-gradient-hover transition-all duration-300 font-semibold text-center text-white hover:scale-105"
            >
              Back to Markets
            </Link>
          </div>
        </div>

        {/* Market Creation */}
        <div className="lg:col-span-2 rounded-xl border border-primary-violet/20 bg-neutral-900/40 p-6 animate-fade-in-up animate-delay-300 hover:scale-105 transition-transform duration-200">
          <h2 className="font-montserrat font-bold text-xl text-white mb-4">Create Market</h2>

          {!isConnected ? (
            <div className="text-center py-8">
              <p className="text-neutral-400 mb-4">Please connect your wallet to create markets</p>
              <Link
                href="/"
                className="inline-block px-6 py-2 rounded-xl bg-primary-gradient hover:bg-primary-gradient-hover transition-all duration-300 font-semibold text-white hover:scale-105"
              >
                Connect Wallet
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Question Input */}
              <div>
                <label className="block text-sm text-neutral-400 mb-2">Question</label>
                <input
                  type="text"
                  className="w-full rounded-md bg-neutral-800 border border-primary-violet/30 px-3 py-2 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-violet"
                  placeholder="What will be the outcome?"
                  id="question"
                  defaultValue="Will this test market work?"
                />
              </div>

              {/* Image URL Input */}
              <div>
                <label className="block text-sm text-neutral-400 mb-2">Image URL</label>
                <input
                  type="text"
                  className="w-full rounded-md bg-neutral-800 border border-primary-violet/30 px-3 py-2 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-violet"
                  placeholder="/market-image.jpeg"
                  id="imageUrl"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
              </div>

              {/* Number of Outcomes Input */}
              <div>
                <label className="block text-sm text-neutral-400 mb-2">Number of Outcomes</label>
                <input
                  type="number"
                  className="w-full rounded-md bg-neutral-800 border border-primary-violet/30 px-3 py-2 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-violet"
                  placeholder="2"
                  id="numOutcomes"
                  value={numOutcomes}
                  onChange={(e) => setNumOutcomes(parseInt(e.target.value) || 2)}
                  min="2"
                  max="8"
                />
              </div>

              {/* Dynamic Outcome Labels */}
              <div className="border border-primary-violet/20 rounded-lg p-4 bg-neutral-800/30">
                <h3 className="text-white font-semibold mb-3">Outcome Labels</h3>
                <div className="space-y-3">
                  {outcomeLabels.map((label, index) => (
                    <div key={`outcome-${index}`} className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: getOutcomeColor(index) }}
                      ></div>
                      <input
                        type="text"
                        className="flex-1 rounded-md bg-neutral-800 border border-primary-violet/30 px-3 py-2 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-violet"
                        placeholder={`Outcome ${index + 1}`}
                        value={label}
                        onChange={(e) => {
                          const newLabels = [...outcomeLabels];
                          newLabels[index] = e.target.value;
                          setOutcomeLabels(newLabels);
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Closing Time Input */}
              <div>
                <label className="block text-sm text-neutral-400 mb-2">Closing Time (Unix timestamp)</label>
                <input
                  type="number"
                  className="w-full rounded-md bg-neutral-800 border border-primary-violet/30 px-3 py-2 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-violet"
                  placeholder={(Math.floor(Date.now() / 1000) + 3600).toString()}
                  id="closingTime"
                  defaultValue={(Math.floor(Date.now() / 1000) + 3600).toString()}
                />
              </div>

              {/* Deposit Input */}
              <div>
                <label className="block text-sm text-neutral-400 mb-2">Deposit (ETH)</label>
                <input
                  type="text"
                  className="w-full rounded-md bg-neutral-800 border border-primary-violet/30 px-3 py-2 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-violet"
                  placeholder="0.01"
                  id="deposit"
                  defaultValue="0.01"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    const question = (document.getElementById('question') as HTMLInputElement)?.value;
                    const numOutcomesInput = (document.getElementById('numOutcomes') as HTMLInputElement)?.value;
                    const closingTime = (document.getElementById('closingTime') as HTMLInputElement)?.value;
                    const deposit = (document.getElementById('deposit') as HTMLInputElement)?.value;

                    // Validate inputs
                    if (!question || !numOutcomesInput || !closingTime || !deposit) {
                      setError('Please fill in all fields');
                      return;
                    }

                    const numOutcomesInt = parseInt(numOutcomesInput);
                    const closingTimeInt = parseInt(closingTime);

                    if (numOutcomesInt < 2) {
                      setError('Number of outcomes must be at least 2');
                      return;
                    }

                    if (closingTimeInt <= Math.floor(Date.now() / 1000)) {
                      setError('Closing time must be in the future');
                      return;
                    }

                    createMarket(question, numOutcomesInt, closingTimeInt, deposit);
                  }}
                  disabled={!isConnected || !factoryContract || loading}
                  className="flex-1 px-4 py-2 rounded-md bg-primary-gradient hover:bg-primary-gradient-hover transition font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating Market...' : 'Create Market'}
                </button>

                <button
                  onClick={async () => {
                    console.log('Testing contract connection...');
                    console.log('Contract address:', CONTRACT_ADDRESSES.MARKET_FACTORY);
                    console.log('Factory contract:', factoryContract);

                    if (factoryContract && signer) {
                      try {
                        const code = await signer.provider?.getCode(CONTRACT_ADDRESSES.MARKET_FACTORY);
                        console.log('Contract code length:', code?.length || 0);
                        console.log('Contract has code:', code !== '0x');

                        if (code === '0x') {
                          setError('Contract not deployed at address: ' + CONTRACT_ADDRESSES.MARKET_FACTORY);
                          return;
                        }

                        const totalMarkets = await factoryContract.getTotalMarkets();
                        console.log('✅ Contract is working! Total markets:', totalMarkets.toString());
                        setSuccess('Contract connection successful! Total markets: ' + totalMarkets.toString());
                      } catch (error: any) {
                        console.error('❌ Contract test error:', error);
                        setError(`Contract test failed: ${error.message}`);
                      }
                    } else {
                      setError('Contract or signer not available');
                    }
                  }}
                  className="px-4 py-2 rounded-md border border-primary-violet text-primary-violet hover:bg-primary-violet/10 transition font-semibold"
                >
                  Test Contract
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 rounded-md bg-danger-red/20 border border-danger-red/30">
                  <p className="text-danger-red text-sm">{error}</p>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="p-3 rounded-md bg-success-green/20 border border-success-green/30">
                  <p className="text-success-green text-sm">{success}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Market Created Success Section */}
        {createdMarket && (
          <div className="lg:col-span-2 rounded-xl border border-success-green/20 bg-success-green/10 p-6 animate-fade-in-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-success-green flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="font-montserrat font-bold text-xl text-success-green">Market Created Successfully!</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm text-success-green/70 mb-1">Market ID</label>
                <p className="text-white font-mono text-sm">{createdMarket.id}</p>
              </div>

              <div>
                <label className="block text-sm text-success-green/70 mb-1">Question</label>
                <p className="text-white font-medium">{createdMarket.question}</p>
              </div>

              <div>
                <label className="block text-sm text-success-green/70 mb-1">Outcomes</label>
                <p className="text-white font-medium">{createdMarket.numOutcomes}</p>
              </div>

              <div>
                <label className="block text-sm text-success-green/70 mb-1">Deposit</label>
                <p className="text-white font-medium">{createdMarket.deposit} ETH</p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm text-success-green/70 mb-1">Transaction Hash</label>
                <p className="text-white font-mono text-xs break-all">{createdMarket.txHash}</p>
              </div>

              <div>
                <label className="block text-sm text-success-green/70 mb-1">Block Number</label>
                <p className="text-white font-medium">{createdMarket.blockNumber}</p>
              </div>
            </div>

            {/* Display Outcomes Created */}
            {marketCompleteData && marketCompleteData.outcomes && (
              <div className="mb-4 border-t border-success-green/20 pt-4">
                <h4 className="text-white font-semibold mb-3">Market Outcomes</h4>
                <div className="space-y-2">
                  {marketCompleteData.outcomes.map((outcome: OutcomeData) => (
                    <div key={outcome.id} className="flex items-center gap-2 text-white text-sm">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: getOutcomeColor(parseInt(outcome.id.replace('o', '')) - 1) }}
                      ></div>
                      <span>{outcome.label}</span>
                      <span className="text-neutral-400">- Yes: {(outcome.yesProbability * 100).toFixed(0)}% | No: {(outcome.noProbability * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Link
                href="/"
                className="px-4 py-2 rounded-md bg-primary-gradient hover:bg-primary-gradient-hover transition font-semibold text-white"
              >
                View Markets
              </Link>
              <button
                onClick={() => {
                  setCreatedMarket(null);
                  setOutcomeLabels(Array(2).fill(''));
                  setImageUrl('');
                }}
                className="px-4 py-2 rounded-md border border-neutral-600 text-neutral-300 hover:bg-neutral-700 transition font-semibold"
              >
                Create Another
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
