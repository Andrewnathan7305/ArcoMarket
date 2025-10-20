"use client";
import React from "react";
import Image from "next/image";
import type { CaseItem } from "../CasesContext";
import Link from "next/link";

type Props = {
  item: CaseItem;
};

export default function CaseCard({ item }: Props) {
  const preview = item.outcomes.slice(0, 2);

  return (
    <Link href={`/${item.id}`} className="premium-card group cursor-pointer h-full flex flex-col">
      {/* Hero Image Section */}
      <div className="relative h-32 w-full overflow-hidden flex-shrink-0">
        <Image
          src={item.imageUrl}
          alt={item.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority={false}
        />
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-transparent to-transparent" />
        
        {/* Category badge */}
        <div className="absolute top-3 right-3 bg-glass rounded-full px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
          Market
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Title */}
        <h3 className="font-montserrat font-bold text-xl text-white mb-3 line-clamp-2 group-hover:text-primary-purple transition-colors">
          {item.title}
        </h3>

        {/* Outcomes Preview */}
        <div className="space-y-3 mb-4 flex-1">
          {preview.map((o, index) => (
            <div key={o.id} className="relative bg-neutral-800 rounded-lg p-3 hover:bg-neutral-700 transition-colors cursor-pointer">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-neutral-200 truncate">
                  {o.label}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-success-green bg-success-green/20 px-2 py-1 rounded-full">
                    Yes {Math.round(o.yesProbability * 100)}%
                  </span>
                  <span className="text-xs font-bold text-danger-red bg-danger-red/20 px-2 py-1 rounded-full">
                    No {Math.round(o.noProbability * 100)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer metadata */}
        <div className="flex items-center justify-between text-xs text-neutral-400 pt-2 border-t border-neutral-700">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              </svg>
              1.2k
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              2d left
            </span>
          </div>
          <span className="text-primary-purple font-medium">$45.2k</span>
        </div>
      </div>
    </Link>
  );
}


