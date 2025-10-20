import React from "react";

export default function Header() {
  return (
    <header className="w-full bg-black text-white flex items-center justify-between px-6 py-3 shadow-md">
      <div className="flex items-center">
        <span className="font-montserrat font-bold text-2xl tracking-tight text-accent-500">
          Arco Market
        </span>
      </div>

      <div className="flex-grow max-w-xl mx-6">
        <div className="group relative">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 stroke-neutral-400 group-focus-within:stroke-accent-500 transition"
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
            className="w-full rounded-lg bg-neutral-900/60 border border-accent-600/30 pl-10 pr-4 py-2 text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-accent-600 focus:border-accent-600 transition"
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <button className="px-4 py-1 rounded-md bg-accent-gradient hover:opacity-90 transition font-semibold">
          Sign Up
        </button>
        <button className="px-4 py-1 rounded-md border border-accent-600 hover:bg-accent-600 hover:text-white transition font-semibold">
          Login
        </button>
        <button className="p-2 rounded-md hover:bg-accent-700/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-600 transition" aria-label="Menu">
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
      </div>
    </header>
  );
}
