"use client";

import React, { useMemo, useState } from "react";
import { usePathname } from "next/navigation";

type Filter = { id: string; label: string };

export default function ContentFilters() {
  const pathname = usePathname() || "";
  const isAdmin = pathname.startsWith("/admin-secret-xyz");

  const filters = useMemo<Filter[]>(
    () => [
      { id: "popular", label: "🔥 Mais Vistos" },
      { id: "price_desc", label: "💎 Mais Caros" },
      { id: "price_asc", label: "💰 Mais Baratos" },
      { id: "editor", label: "🧠 Escolha do Editor" },
    ],
    []
  );

  const [activeFilter, setActiveFilter] = useState<string>(filters[0].id);

  // No admin, não renderiza filtros para evitar conflito com o layout
  if (isAdmin) return null;

  return (
    <section className="container mx-auto max-w-7xl px-4 md:px-6">
      <div className="flex flex-wrap items-center gap-2 py-4">
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id)}
            className={`
              rounded-full px-4 py-2 text-sm font-medium transition-all duration-200
              border
                 ${
                   activeFilter === filter.id
                     ? 'bg-card/80 text-foreground border-border backdrop-blur-md shadow-md'
                     : 'bg-transparent text-foreground/70 border-transparent hover:bg-preto-espacial/15 dark:hover:bg-branco-gelo/15'
                 }
            `}
          >
            {filter.label}
          </button>
        ))}
      </div>
    </section>
  );
}

