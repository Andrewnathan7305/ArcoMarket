"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";

type User = {
  name: string;
  email?: string;
  accountCreated: string;
  walletAddress?: string;
  network?: string;
};

export default function Header() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [showAuthCard, setShowAuthCard] = useState(false);
  const [authType, setAuthType] = useState<"signup" | "login">("signup");
  const [showMenu, setShowMenu] = useState(false);
  const [name, setName] = useState("");

  // Check for existing session on mount and listen for changes
  useEffect(() => {
    const checkAuth = () => {
      const savedUser = localStorage.getItem("arco_user");
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setIsLoggedIn(true);
      } else {
        setUser(null);
        setIsLoggedIn(false);
      }
    };

    // Check on mount
    checkAuth();

    // Listen for storage changes (logout from other tabs/components)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "arco_user") {
        checkAuth();
      }
    };

    // Listen for custom logout event
    const handleLogout = () => {
      checkAuth();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("logout", handleLogout);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("logout", handleLogout);
    };
  }, []);

  const login = (name: string, email?: string) => {
    const newUser: User = {
      name,
      email,
      accountCreated: new Date().toISOString(),
      walletAddress: "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
      network: "Ethereum Mainnet"
    };
    
    setUser(newUser);
    setIsLoggedIn(true);
    setShowAuthCard(false);
    localStorage.setItem("arco_user", JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    setIsLoggedIn(false);
    setShowAuthCard(false);
    localStorage.removeItem("arco_user");
  };

  const showAuth = (type: "signup" | "login") => {
    setAuthType(type);
    setShowAuthCard(true);
  };

  const hideAuth = () => {
    setShowAuthCard(false);
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      login(name.trim());
      setName("");
    }
  };
  return (
    <header className="w-full bg-black text-white flex items-center justify-between px-6 py-4 border-b border-primary-violet/20 relative z-50">
      {/* Background glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary-purple/5 via-transparent to-electric-blue/5" />
      
      <div className="flex items-center relative z-10">
        <span className="font-montserrat font-bold text-3xl tracking-tight bg-gradient-to-r from-primary-purple via-primary-violet to-electric-blue bg-clip-text text-transparent glow-purple">
          Arco Market
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
        {!isLoggedIn ? (
          <>
            <button 
              onClick={() => showAuth("signup")}
              className="px-6 py-2 rounded-xl bg-primary-gradient hover:bg-primary-gradient-hover transition-all duration-300 font-semibold text-white glow-purple hover:scale-105"
            >
              Sign Up
            </button>
            <button 
              onClick={() => showAuth("login")}
              className="px-6 py-2 rounded-xl border border-primary-violet hover:bg-primary-gradient hover:text-white transition-all duration-300 font-semibold text-primary-violet hover:scale-105 hover:border-transparent"
            >
              Login
            </button>
          </>
        ) : (
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
                <Link 
                  href="/account"
                  className="block px-4 py-3 text-white hover:bg-primary-violet/20 transition"
                  onClick={() => setShowMenu(false)}
                >
                  Account
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Auth Card */}
        {showAuthCard && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/50 z-[999999]"
              onClick={hideAuth}
            />
            {/* Auth Card */}
            <div className="fixed top-20 right-6 w-80 bg-neutral-900 border border-primary-violet/20 rounded-lg shadow-lg z-[999999] p-4" style={{ zIndex: 999999 }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-montserrat font-bold text-white">
                {authType === "signup" ? "Sign Up" : "Login"}
              </h3>
              <button 
                onClick={hideAuth}
                className="text-neutral-400 hover:text-white transition"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAuthSubmit}>
              <div className="mb-4">
                <label className="block text-sm text-neutral-300 mb-2">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-md bg-neutral-800 border border-primary-violet/30 px-3 py-2 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-violet"
                  placeholder="Enter your name"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full px-4 py-2 rounded-md bg-primary-gradient bg-primary-gradient-hover transition font-semibold"
              >
                {authType === "signup" ? "Sign Up" : "Login"}
              </button>
            </form>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
