"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useMetaMask } from "../hooks/useMetaMask";

// ✅ Admin address that can create markets
const ADMIN_ADDRESS = "0x21522c86a586e696961b68aa39632948d9f11170";

export default function Header() {
  const {
    isConnected,
    account,
    balance,
    chainId,
    loading: walletLoading,
    error: walletError,
    connect,
    disconnect
  } = useMetaMask();

  const [showMenu, setShowMenu] = useState(false);
  const [showSignupForm, setShowSignupForm] = useState(false);
  const [userName, setUserName] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);

  // ✅ Check if current wallet is admin
  const isAdmin = account?.toLowerCase() === ADMIN_ADDRESS.toLowerCase();

  // Save user to localStorage when wallet connects
  useEffect(() => {
    if (isConnected && userName && account) {
      const userData = {
        name: userName,
        accountCreated: new Date().toISOString(),
        walletAddress: account,
        network: `Chain ID: ${chainId}`
      };
      localStorage.setItem("arco_user", JSON.stringify(userData));
    }
  }, [isConnected, account, chainId, userName]);

  // Load saved username only when wallet is connected
  useEffect(() => {
    if (isConnected) {
      const savedUser = localStorage.getItem("arco_user");
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        setUserName(userData.name);
      }
    }
  }, [isConnected]);

  // Clear localStorage when wallet disconnects
  useEffect(() => {
    if (!isConnected && localStorage.getItem("arco_user")) {
      localStorage.removeItem("arco_user");
      setUserName("");
    }
  }, [isConnected]);

  // Format wallet address for display
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Format balance for display
  const formatBalance = (balance: string) => {
    const num = parseFloat(balance);
    return num.toFixed(4);
  };

  // Handle signup form submission
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userName.trim()) {
      setIsConnecting(true);
      try {
        console.log('Connecting wallet after signup...');
        const success = await connect();
        console.log('Wallet connection result:', success);
        if (success) {
          setShowSignupForm(false);
        }
      } catch (error) {
        console.error('Wallet connection error:', error);
      } finally {
        setIsConnecting(false);
      }
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 w-full backdrop-blur-md text-white flex items-center justify-between px-6 py-4 border-b border-primary-violet/20 z-50">
      {/* Background glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary-purple/5 via-transparent to-electric-blue/5" />

      <div className="flex items-center relative z-10">
        <span className="font-montserrat font-bold text-3xl tracking-tight bg-gradient-to-r from-primary-purple via-primary-violet to-white bg-clip-text text-transparent glow-purple">
          Predictology
        </span>

      </div>

      <div className="flex-grow max-w-xl mx-6 relative z-10">
        <div className="group relative">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 stroke-neutral-400 group-focus-within:stroke-primary-violet transition-colors"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z" />
            </svg>
          </span>
          <input
            type="search"
            placeholder="Search markets..."
            className="w-full rounded-xl bg-glass border border-primary-violet/30 pl-10 pr-4 py-3 text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-violet focus:border-primary-violet transition-all duration-300 backdrop-blur-sm"
          />
        </div>
      </div>

      <div className="flex items-center space-x-4 relative z-10">
        {!isConnected ? (
          <button
            onClick={() => setShowSignupForm(true)}
            className="px-6 py-2 rounded-xl bg-primary-gradient hover:bg-primary-gradient-hover transition-all duration-300 font-semibold text-white glow-purple hover:scale-105"
          >
            Sign Up
          </button>
        ) : (
          <div className="flex items-center space-x-4">
            {/* ✅ Create Market Button (only for admin) */}
            {isAdmin && (
              <Link
                href="/account"
                className="px-4 py-2 rounded-xl bg-primary-gradient hover:bg-primary-gradient-hover transition-all duration-300 font-semibold text-white hover:scale-105 flex items-center gap-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Market
              </Link>
            )}

            {/* Wallet Status */}
            <div className="flex items-center space-x-2 bg-glass border border-primary-violet/20 rounded-lg px-3 py-2">
              <div className="w-2 h-2 bg-success-green rounded-full"></div>
              <span className="text-sm text-white font-medium">
                {userName || formatAddress(account)}
              </span>
              <span className="text-xs text-neutral-400">
                {formatBalance(balance)} ETH
              </span>
            </div>

            {/* Menu */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 rounded-md hover:bg-primary-violet/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-violet transition"
                aria-label="Menu"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {showMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-neutral-900 border border-primary-violet/20 rounded-lg shadow-lg z-[9999]">
                  <div className="px-4 py-3 border-b border-primary-violet/20">
                    <p className="text-xs text-neutral-400">Welcome, {userName}</p>
                    <p className="text-sm text-white font-medium">{formatAddress(account)}</p>
                    <p className="text-xs text-neutral-400">Chain ID: {chainId}</p>
                    {isAdmin && (
                      <p className="text-xs text-success-green mt-1">Admin</p>
                    )}
                  </div>
                  <Link
                    href="/account"
                    className="block px-4 py-3 text-white hover:bg-primary-violet/20 transition"
                    onClick={() => setShowMenu(false)}
                  >
                    Account
                  </Link>
                  <button
                    onClick={() => {
                      disconnect();
                      setShowMenu(false);
                      setUserName("");
                      localStorage.removeItem("arco_user");
                    }}
                    className="w-full text-left px-4 py-3 text-danger-red hover:bg-danger-red/10 transition"
                  >
                    Disconnect
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Signup Form */}
      {showSignupForm && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-[999999]"
            onClick={() => setShowSignupForm(false)}
          />
          <div className="fixed top-20 right-6 w-80 bg-neutral-900 border border-primary-violet/20 rounded-lg shadow-lg z-[999999] p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-montserrat font-bold text-white">Sign Up</h3>
              <button
                onClick={() => setShowSignupForm(false)}
                className="text-neutral-400 hover:text-white transition"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSignupSubmit}>
              <div className="mb-4">
                <label className="block text-sm text-neutral-300 mb-2">Name</label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full rounded-md bg-neutral-800 border border-primary-violet/30 px-3 py-2 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-violet"
                  placeholder="Enter your name"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isConnecting}
                className="w-full px-4 py-2 rounded-md bg-primary-gradient hover:bg-primary-gradient-hover transition font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </button>
            </form>
          </div>
        </>
      )}
    </header>
  );
}
