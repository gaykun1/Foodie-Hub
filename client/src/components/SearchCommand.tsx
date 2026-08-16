"use client";
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { Search, X, Loader2 } from "lucide-react";
import { Restaurant } from "@/redux/reduxTypes";
import { useDisclosure } from "@/hooks/useDisclosure";
import { useDismissable } from "@/hooks/useDismissable";
import { fadeRise } from "@/lib/motion";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/cn";

// Restaurant search — used once in the Header (desktop inline / mobile
// icon-triggered) and reused by the admin "pick a restaurant to edit menu"
// search. Replaces two near-identical, un-debounced search blocks that used
// to live inline in Header.tsx and read a stale `word` value on every
// keystroke.
interface SearchCommandProps {
  onSelect?: (restaurant: Restaurant) => void;
  getHref?: (restaurant: Restaurant) => string;
  placeholder?: string;
  className?: string;
}

export const SearchCommand = ({
  onSelect,
  getHref = (r) => `/restaurant/menu/${r._id}`,
  placeholder = "Search for restaurants...",
  className,
}: SearchCommandProps) => {
  const [word, setWord] = useState("");
  const [results, setResults] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isOpen, open, close } = useDisclosure();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useDismissable(isOpen || mobileOpen, wrapperRef, () => {
    close();
    setMobileOpen(false);
  });

  useEffect(() => {
    const trimmed = word.trim();
    if (trimmed.length < 2) {
      setResults([]);
      close();
      return;
    }
    const timeout = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/restaurant/restaurants/search?chars=${trimmed}`
        );
        setResults(res.data ?? []);
        open();
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [word]);

  return (
    <div ref={wrapperRef} className={cn("relative", className)}>
      <button
        type="button"
        aria-label={mobileOpen ? "Close search" : "Open search"}
        onClick={() => {
          setMobileOpen((v) => !v);
          requestAnimationFrame(() => inputRef.current?.focus());
        }}
        className="lg:hidden flex items-center justify-center size-10 rounded-full text-inkMuted hover:text-ink hover:bg-surfaceRaised transition-colors cursor-pointer"
      >
        {mobileOpen ? <X size={20} /> : <Search size={20} />}
      </button>

      <div
        className={cn(
          "relative",
          mobileOpen
            ? "absolute top-full right-0 mt-2 w-[min(90vw,360px)] z-40"
            : "hidden",
          "lg:block lg:static lg:w-[280px] lg:mt-0"
        )}
      >
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-inkSubtle pointer-events-none" />
        <input
          ref={inputRef}
          value={word}
          onChange={(e) => setWord(e.target.value)}
          onFocus={() => results.length > 0 && open()}
          placeholder={placeholder}
          aria-label="Search restaurants"
          type="text"
          className="input h-11 pl-10 pr-9 text-sm w-full bg-surface"
        />
        {loading && (
          <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-inkSubtle" />
        )}

        <AnimatePresence>
          {isOpen && (
            <motion.div
              variants={fadeRise}
              initial="hidden"
              animate="visible"
              exit="exit"
              role="listbox"
              className="absolute z-50 top-full left-0 mt-2 w-full rounded-lg border border-border bg-surface shadow-elevation3 p-2 max-h-80 overflow-y-auto"
            >
              {results.length > 0 ? (
                <div className="flex flex-col gap-1">
                  {results.map((restaurant) => (
                    <Link
                      key={restaurant._id}
                      href={getHref(restaurant)}
                      onClick={() => {
                        onSelect?.(restaurant);
                        close();
                        setMobileOpen(false);
                        setWord("");
                      }}
                      className="px-3 py-2 rounded-md text-sm font-medium text-ink hover:bg-surfaceRaised transition-colors"
                    >
                      {restaurant.title}
                    </Link>
                  ))}
                </div>
              ) : (
                <span className="block px-3 py-2 text-sm text-inkMuted">No restaurants found</span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
