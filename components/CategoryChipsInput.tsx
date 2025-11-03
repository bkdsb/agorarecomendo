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
  const [localCategories, setLocalCategories] = React.useState<Category[]>(categories);
  const [inlineCompletion, setInlineCompletion] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  // Sync with parent categories
  React.useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  const selected = value ? localCategories.find((c) => c.id === value) : undefined;
  const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[^a-z0-9\s]/g, "");

  const filtered = React.useMemo(() => {
    const q = normalize(query);
    // Combine existing categories with title suggestions
    const allOptions = [
      ...localCategories.map(c => ({ type: 'category' as const, data: c })),
      ...titleSuggestions.map(s => ({ type: 'suggestion' as const, name: s }))
    ];
    
    return allOptions
      .filter((item) => {
        if (item.type === 'category') {
          return normalize((locale === "pt-BR" && item.data.namePtBr) ? item.data.namePtBr! : item.data.name).includes(q);
        } else {
          return normalize(item.name).includes(q);
        }
      })
      .slice(0, 7);
  }, [localCategories, titleSuggestions, query, locale]);

  // Update inline completion based on query
  React.useEffect(() => {
    if (!query.trim() || selected) {
      setInlineCompletion("");
      return;
    }

    const q = normalize(query);
    // Find first match from categories or suggestions
    const match = filtered[0];
    
    if (match) {
      let matchText = "";
      if (match.type === 'category') {
        matchText = (locale === "pt-BR" && match.data.namePtBr) ? match.data.namePtBr! : match.data.name;
      } else {
        matchText = match.name;
      }
      
      const normalizedMatch = normalize(matchText);
      if (normalizedMatch.startsWith(q)) {
        // Show the remaining part as inline completion
        const remaining = matchText.slice(query.length);
        setInlineCompletion(remaining);
      } else {
        setInlineCompletion("");
      }
    } else {
      setInlineCompletion("");
    }
  }, [query, filtered, selected, locale]);

  const labelOf = (c: Category) => (locale === "pt-BR" && c.namePtBr) ? c.namePtBr! : c.name;

  const acceptCompletion = async () => {
    if (inlineCompletion && query) {
      const fullText = query + inlineCompletion;
      // Check if it's an existing category
      const exists = localCategories.find((c) => labelOf(c).toLowerCase() === fullText.toLowerCase());
      if (exists) {
        onChange(exists.id); 
        setQuery(""); 
        setInlineCompletion("");
        return;
      }
      // Create new category
      const created = await onCreate(fullText);
      setLocalCategories(prev => [...prev, created]);
      onChange(created.id);
      setQuery(""); 
      setInlineCompletion("");
    }
  };

  const commitSelect = async (text?: string) => {
    const name = (text ?? query).trim();
    if (!name) return;
    const exists = localCategories.find((c) => labelOf(c).toLowerCase() === name.toLowerCase());
    if (exists) {
      onChange(exists.id); setQuery(""); setInlineCompletion(""); return;
    }
    const created = await onCreate(name);
    setLocalCategories(prev => [...prev, created]);
    onChange(created.id);
    setQuery(""); setInlineCompletion("");
  };

  const clearSelection = () => { 
    onChange(""); 
    setTimeout(() => inputRef.current?.focus(), 0); 
  };

  return (
    <div className={"relative rounded-xl border border-black/[0.06] dark:border-white/[0.06] bg-white/50 dark:bg-white/[0.06] backdrop-blur-xl p-3 shadow-[0_1px_3px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,0.1)] " + (className ?? "")}
      onClick={() => inputRef.current?.focus()}
    >
      <div className="flex flex-wrap items-center gap-2">
        {selected && (
          <span className="inline-flex items-center gap-2 rounded-full border border-black/[0.06] dark:border-white/[0.06] bg-white/50 dark:bg-white/[0.06] backdrop-blur-sm text-foreground/80 text-xs font-medium px-3 py-1.5 shadow-sm hover:border-blue-500/30 hover:text-blue-700/80 dark:hover:text-blue-300/90 transition-colors">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500/80" />
            {labelOf(selected)}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); clearSelection(); }}
              className="ml-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 w-4 h-4 leading-none flex items-center justify-center transition-colors"
              aria-label="Remove category"
            >
              ×
            </button>
          </span>
        )}
        <div className="relative flex-1 min-w-[160px]">
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); }}
            onFocus={() => {}}
            onBlur={() => {}}
            onKeyDown={async (e) => {
              if (e.key === "Tab" || e.key === "ArrowRight") {
                if (inlineCompletion && query) {
                  e.preventDefault();
                  await acceptCompletion();
                }
              }
              else if (e.key === "Enter") { 
                e.preventDefault();
                if (inlineCompletion && query) {
                  await acceptCompletion();
                } else {
                  await commitSelect(); 
                }
              }
              else if (e.key === " " && inlineCompletion && query.length > 0) {
                e.preventDefault();
                await acceptCompletion();
              }
              else if (e.key === "Backspace" && query.length === 0 && selected) { 
                e.preventDefault(); 
                clearSelection(); 
              }
              else if (e.key === "Escape") { 
                setInlineCompletion(""); 
              }
            }}
            placeholder={selected ? "" : "Type to search or create"}
            className="w-full p-1.5 bg-transparent focus:outline-none text-sm text-foreground placeholder:text-foreground/50 relative z-10"
            style={{ caretColor: 'auto' }}
          />
          {/* Inline completion ghost text */}
          {inlineCompletion && query && (
            <div className="absolute left-0 top-0 p-1.5 text-sm text-foreground/30 pointer-events-none z-0 whitespace-nowrap">
              <span className="invisible">{query}</span>{inlineCompletion}
            </div>
          )}
        </div>
      </div>

      {/* Title-based suggestions (subtle, minimal) */}
      {!selected && !query && titleSuggestions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {titleSuggestions.slice(0, 3).map((s) => (
            <button
              key={s}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={async () => { 
                setQuery(s);
                await commitSelect(s);
              }}
              className="group inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-medium rounded-full border border-black/[0.06] dark:border-white/[0.06] bg-white/50 dark:bg-white/[0.06] backdrop-blur-sm text-foreground/60 hover:text-blue-700/80 dark:hover:text-blue-300/90 hover:border-blue-500/30 shadow-sm transition-all duration-200"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500/70 group-hover:bg-blue-500 transition-colors" />
              <span>{s}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default CategoryChipsInput;
