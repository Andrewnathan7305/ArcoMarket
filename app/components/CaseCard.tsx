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
    <Link href={`/${item.id}`} className="rounded-xl border border-accent-600/20 bg-neutral-900/40 overflow-hidden hover:border-accent-600/40 transition block">
      <div className="relative h-40 w-full bg-neutral-800">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.title}
            fill
            className="object-cover opacity-80"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={false}
          />
        ) : null}
      </div>

      <div className="p-4">
        <h3 className="font-montserrat font-bold text-lg text-white mb-2 line-clamp-2">
          {item.title}
        </h3>

        <div className="flex flex-col gap-2 mb-3">
          {preview.map((o) => (
            <div key={o.id} className="flex items-center justify-between gap-3">
              <span className="text-sm text-neutral-200 truncate">{o.label}</span>
              <span className="text-xs text-neutral-400">
                Yes {Math.round(o.yesProbability * 100)}% · No {Math.round(o.noProbability * 100)}%
              </span>
            </div>
          ))}
        </div>

        {/* Intentionally minimal card; actions handled on detail page */}
      </div>
    </Link>
  );
}


