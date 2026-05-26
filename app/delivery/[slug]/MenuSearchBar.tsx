"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";

interface MenuSearchBarProps {
  onSearch: (query: string) => void;
}

export default function MenuSearchBar({ onSearch }: MenuSearchBarProps) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce — fire onSearch 200ms after the last keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(inputValue.trim());
    }, 200);
    return () => clearTimeout(timer);
  }, [inputValue, onSearch]);

  function handleClear() {
    setInputValue("");
    inputRef.current?.focus();
  }

  return (
    <div className="bg-white px-4 py-3 sm:px-6">
      <div className="relative flex items-center">
        {/* Search icon */}
        <Search
          size={16}
          strokeWidth={2}
          className="pointer-events-none absolute left-4 shrink-0 text-foreground/35"
          aria-hidden
        />

        <input
          ref={inputRef}
          type="search"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Search this menu..."
          aria-label="Search menu items"
          // Suppress browser-native clear button (we render our own)
          className="[&::-webkit-search-cancel-button]:appearance-none w-full rounded-full bg-gray-100 py-2.5 pl-10 pr-10 text-sm text-foreground placeholder:text-foreground/35 transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
          style={{ fontFamily: "var(--font-inter-tight)" }}
        />

        {/* Clear button — only visible when there is input */}
        {inputValue && (
          <button
            onClick={handleClear}
            aria-label="Clear search"
            className="absolute right-3 flex h-6 w-6 items-center justify-center rounded-full bg-foreground/15 text-foreground/50 transition-colors hover:bg-foreground/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <X size={12} strokeWidth={2.5} aria-hidden />
          </button>
        )}
      </div>
    </div>
  );
}
