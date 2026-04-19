"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  createContext,
  useContext,
} from "react";
import Image from "next/image";
import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { AiOrb } from "@/components/ai-orb";

interface SearchResult {
  id: string;
  name: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  websiteDomain: string | null;
  score: number;
  photoUrl: string | null;
  status: string;
}

// ── Context for opening search from anywhere ──────────────

interface SearchContextValue {
  open: () => void;
  selectedLeadId: string | null;
  setSelectedLead: (id: string) => void;
  clearSelectedLead: () => void;
}

const SearchContext = createContext<SearchContextValue>({
  open: () => {},
  selectedLeadId: null,
  setSelectedLead: () => {},
  clearSelectedLead: () => {},
});

export function useSearch() {
  return useContext(SearchContext);
}

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <SearchContext.Provider
      value={{
        open: () => setIsOpen(true),
        selectedLeadId,
        setSelectedLead: setSelectedLeadId,
        clearSelectedLead: () => setSelectedLeadId(null),
      }}
    >
      {children}
      <SearchOverlay
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSelectLead={setSelectedLeadId}
      />
    </SearchContext.Provider>
  );
}

// ── Overlay ───────────────────────────────────────────────

function SearchOverlay({
  isOpen,
  onClose,
  onSelectLead,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelectLead: (id: string) => void;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setResults([]);
      setHasSearched(false);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const search = useCallback(async (q: string) => {
    abortRef.current?.abort();

    if (q.length < 2) {
      setResults([]);
      setHasSearched(false);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);

    try {
      const res = await fetch(`/api/leads/search?q=${encodeURIComponent(q)}`, {
        signal: controller.signal,
      });
      if (res.ok) {
        const data = await res.json();
        setResults(data.results);
        setSelectedIndex(0);
        setHasSearched(true);
      }
    } catch {
      // Aborted or failed
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 200);
    return () => clearTimeout(timer);
  }, [query, search]);

  function navigateToLead(id: string) {
    onClose();
    onSelectLead(id);
    router.push("/admin/leads");
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault();
      navigateToLead(results[selectedIndex].id);
    }
  }

  function scoreColor(score: number) {
    if (score >= 4) return "text-emerald-400 bg-emerald-500/10";
    if (score >= 3) return "text-amber-400 bg-amber-500/10";
    return "text-red-400 bg-red-500/10";
  }

  function getInitials(name: string | null) {
    if (!name) return "?";
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-100 flex items-start justify-center pt-[15vh] px-4"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Ambient orb glow behind the dialog — Raycast/Linear vibe */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-[10vh] -translate-x-1/2 opacity-40 blur-3xl"
          >
            <AiOrb size="lg" state="idle" />
          </div>

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -8 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/60 rounded-xl shadow-2xl shadow-black/50 overflow-hidden ring-1 ring-emerald-500/10"
          >
            {/* Input */}
            <div className="flex items-center gap-3 px-4 h-14 border-b border-zinc-800">
              <Search className="w-4.5 h-4.5 text-zinc-500 shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search leads by name, city, domain..."
                className="flex-1 bg-transparent text-white text-sm placeholder:text-zinc-500 outline-none"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <kbd className="text-[11px] text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded font-medium border border-zinc-700/50">
                ESC
              </kbd>
            </div>

            {/* Results */}
            {query.length >= 2 && (
              <div className="max-h-80 overflow-auto">
                {loading || !hasSearched ? (
                  <div className="px-4 py-8 flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-zinc-700 border-t-zinc-400 rounded-full animate-spin" />
                  </div>
                ) : results.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <p className="text-zinc-500 text-sm">No leads found</p>
                  </div>
                ) : (
                  <div className="py-1.5">
                    {results.map((result, i) => (
                      <button
                        key={result.id}
                        onClick={() => navigateToLead(result.id)}
                        onMouseEnter={() => setSelectedIndex(i)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                          i === selectedIndex
                            ? "bg-zinc-800/70"
                            : "hover:bg-zinc-800/40"
                        }`}
                      >
                        {result.photoUrl ? (
                          <Image
                            src={result.photoUrl}
                            alt=""
                            width={32}
                            height={32}
                            className="w-8 h-8 rounded-full object-cover shrink-0"
                            unoptimized
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
                            <span className="text-[10px] font-medium text-zinc-500">
                              {getInitials(result.name)}
                            </span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-zinc-200 truncate">
                            {result.name || "Unknown"}
                          </p>
                          <p className="text-xs text-zinc-500 truncate">
                            {[result.city, result.state, result.country]
                              .filter(Boolean)
                              .join(", ") ||
                              result.websiteDomain ||
                              "No location"}
                          </p>
                        </div>
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-lg tabular-nums shrink-0 ${scoreColor(result.score)}`}
                        >
                          {result.score.toFixed(1)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Footer hints */}
            {query.length < 2 && (
              <div className="px-4 py-6 text-center">
                <p className="text-zinc-600 text-xs">
                  Type at least 2 characters to search
                </p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
