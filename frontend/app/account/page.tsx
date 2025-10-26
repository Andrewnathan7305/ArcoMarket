"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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

  const logout = () => {
    setUser(null);
    setIsLoggedIn(false);
    localStorage.removeItem("arco_user");
    // Dispatch custom event to notify other components
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
      </div>
    </div>
  );
}
