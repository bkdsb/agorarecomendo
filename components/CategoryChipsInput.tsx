"use client";

import * as React from "react";

type Category = { id: string; name: string; namePtBr?: string };

export function CategoryChipsInput({
  categories,
  value,
  onChange,
  onCreate,
  locale = "en-US",
  titleSuggestions = [],
  className,
}: {
  categories: Category[];
  value?: string; // selected categoryId
  onChange: (categoryId: string | "") => void;
  onCreate: (name: string) => Promise<Category> | Category;
  locale?: "en-US" | "pt-BR";
  titleSuggestions?: string[];
  className?: string;
}) {
  const [query, setQuery] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);
  const [highlight, setHighlight] = React.useState(0);
  const [localCategories, setLocalCategories] = React.useState<Category[]>(categories);
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  // Sync with parent categories
  React.useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  const selected = value ? localCategories.find((c) => c.id === value) : undefined;
  const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[^a-z0-9\s]/g, "");

  const filtered = React.useMemo(() => {
    const q = normalize(query);
    return localCategories
      .filter((c) => normalize((locale === "pt-BR" && c.namePtBr) ? c.namePtBr! : c.name).includes(q))
      .slice(0, 7);
  }, [localCategories, query, locale]);

  const labelOf = (c: Category) => (locale === "pt-BR" && c.namePtBr) ? c.namePtBr! : c.name;

  const commitSelect = async (text?: string) => {
    if (filtered.length > 0 && !text) {
      onChange(filtered[highlight]?.id || filtered[0]?.id || "");
      setIsOpen(false); setQuery("");
      return;
    }
    const name = (text ?? query).trim();
    if (!name) return;
    const exists = localCategories.find((c) => labelOf(c).toLowerCase() === name.toLowerCase());
    if (exists) {
      onChange(exists.id); setQuery(""); setIsOpen(false); return;
    }
    const created = await onCreate(name);
    // Update local state immediately
    setLocalCategories(prev => [...prev, created]);
    onChange(created.id);
    setQuery(""); setIsOpen(false);
  };

  const clearSelection = () => { 
    onChange(""); 
    setTimeout(() => inputRef.current?.focus(), 0); 
  };

  return (
    <div className={"relative rounded-xl border border-black/10 dark:border-white/20 bg-white/60 dark:bg-white/10 backdrop-blur-xl p-3 shadow-sm " + (className ?? "")}
      onClick={() => inputRef.current?.focus()}
    >
      <div className="flex flex-wrap items-center gap-2">
        {selected && (
          <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-b from-[#007AFF] to-[#0051D5] text-white text-xs font-medium px-3 py-1.5 shadow-sm">
            {labelOf(selected)}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); clearSelection(); }}
              className="ml-1 rounded-full hover:bg-white/20 w-4 h-4 leading-none flex items-center justify-center transition-colors"
              aria-label="Remove category"
            >
              ×
            </button>
          </span>
        )}
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); setHighlight(0); }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 150)}
          onKeyDown={async (e) => {
            if (e.key === "Enter") { e.preventDefault(); await commitSelect(); }
            else if (e.key === "ArrowDown") { e.preventDefault(); setHighlight((h) => Math.min(filtered.length - 1, h + 1)); }
            else if (e.key === "ArrowUp") { e.preventDefault(); setHighlight((h) => Math.max(0, h - 1)); }
            else if (e.key === "Backspace" && query.length === 0 && selected) { e.preventDefault(); clearSelection(); }
            else if (e.key === "Delete" && query.length === 0 && selected) { e.preventDefault(); clearSelection(); }
          }}
          placeholder={selected ? "" : "Type to search or create"}
          className="flex-1 min-w-[160px] p-1.5 bg-transparent focus:outline-none text-sm text-foreground placeholder:text-foreground/50"
        />
      </div>

      {/* Inline suggestions from title and existing categories */}
      {!selected && (titleSuggestions.length > 0 || localCategories.length > 0) && (
        <div className="mt-2 flex flex-wrap gap-2">
          {titleSuggestions.slice(0, 3).map((s) => (
            <button
              key={s}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { setQuery(s); setIsOpen(true); setHighlight(0); }}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300 hover:bg-blue-500/20 transition-colors"
            >
              <span className="opacity-60">Suggest:</span> {s}
            </button>
          ))}
        </div>
      )}

      {/* Dropdown */}
      {isOpen && (filtered.length > 0 || query.trim()) && (
        <div className="absolute z-10 mt-2 w-full rounded-xl border border-black/10 dark:border-white/20 bg-white/95 dark:bg-black/95 backdrop-blur-xl shadow-lg overflow-hidden">
          {filtered.map((c, idx) => (
            <button
              key={c.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { onChange(c.id); setIsOpen(false); setQuery(""); }}
              className={`w-full text-left px-3 py-2 text-sm transition-colors ${idx === highlight ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300' : 'text-foreground/90 hover:bg-foreground/5'}`}
            >
              {labelOf(c)}
            </button>
          ))}
          {/* Create */}
          {query.trim() && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={async () => { await commitSelect(query.trim()); }}
              className="w-full text-left px-3 py-2 text-sm border-t border-border/60 text-blue-600 dark:text-blue-400 hover:bg-foreground/5 font-medium transition-colors"
            >
              + Create "{query.trim()}"
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default CategoryChipsInput;
