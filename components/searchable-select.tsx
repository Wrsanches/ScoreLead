"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ChevronDown, Search, Check } from "lucide-react"

export interface SelectOption {
  value: string
  label: string
}

interface SearchableSelectProps {
  options: SelectOption[]
  value: string
  onChange: (value: string) => void
  placeholder: string
  label: string
  disabled?: boolean
  icon?: React.ReactNode
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder,
  label,
  disabled = false,
  icon,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [openUpward, setOpenUpward] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const [highlightIndex, setHighlightIndex] = useState(-1)

  const selectedOption = options.find((o) => o.value === value)

  const filtered = search
    ? options.filter((o) =>
        o.label.toLowerCase().includes(search.toLowerCase()),
      )
    : options

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setSearch("")
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
      // Check if dropdown would overflow viewport bottom
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        const spaceBelow = window.innerHeight - rect.bottom
        setOpenUpward(spaceBelow < 280)
      }
    }
  }, [isOpen])

  useEffect(() => {
    setHighlightIndex(-1)
  }, [search])

  const handleSelect = useCallback(
    (optionValue: string) => {
      onChange(optionValue)
      setIsOpen(false)
      setSearch("")
    },
    [onChange],
  )

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault()
        setIsOpen(true)
      }
      return
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setHighlightIndex((prev) => Math.min(prev + 1, filtered.length - 1))
        break
      case "ArrowUp":
        e.preventDefault()
        setHighlightIndex((prev) => Math.max(prev - 1, 0))
        break
      case "Enter":
        e.preventDefault()
        if (highlightIndex >= 0 && highlightIndex < filtered.length) {
          handleSelect(filtered[highlightIndex].value)
        }
        break
      case "Escape":
        setIsOpen(false)
        setSearch("")
        break
    }
  }

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightIndex >= 0 && listRef.current) {
      const item = listRef.current.children[highlightIndex] as HTMLElement
      if (item) {
        item.scrollIntoView({ block: "nearest" })
      }
    }
  }, [highlightIndex])

  return (
    <div ref={containerRef} className="relative" onKeyDown={handleKeyDown}>
      <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1.5 font-medium">
        {label}
      </label>

      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) setIsOpen(!isOpen)
        }}
        className={`
          w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-left transition-all duration-200
          ${disabled
            ? "bg-zinc-800/10 border border-zinc-800/40 cursor-not-allowed opacity-40"
            : "bg-zinc-900 border border-zinc-800 hover:border-zinc-700 focus:outline-none focus:border-zinc-700 cursor-pointer"
          }
        `}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        {icon && (
          <span className="text-zinc-600 shrink-0">{icon}</span>
        )}
        <span className={selectedOption ? "text-white" : "text-zinc-600"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-zinc-600 ml-auto shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: openUpward ? 4 : -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: openUpward ? 4 : -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className={`absolute z-50 w-full bg-zinc-900 border border-zinc-700/50 rounded-xl overflow-hidden shadow-2xl shadow-black/40 ${
              openUpward ? "bottom-full mb-2" : "top-full mt-2"
            }`}
          >
            {/* Search input */}
            <div className="p-2 border-b border-zinc-800/60">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
                <input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="w-full pl-9 pr-3 py-2 bg-zinc-800/40 rounded-lg text-sm text-white placeholder:text-zinc-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Options list */}
            <ul
              ref={listRef}
              role="listbox"
              className="max-h-52 overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent"
            >
              {filtered.length === 0 ? (
                <li className="px-4 py-3 text-sm text-zinc-600 text-center">
                  No results found
                </li>
              ) : (
                filtered.map((option, i) => {
                  const isSelected = option.value === value
                  const isHighlighted = i === highlightIndex

                  return (
                    <li
                      key={option.value}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelect(option.value)}
                      className={`
                        px-4 py-2.5 text-sm cursor-pointer transition-colors duration-100 flex items-center justify-between
                        ${isHighlighted ? "bg-emerald-500/10 text-white" : isSelected ? "text-emerald-400" : "text-zinc-300 hover:bg-zinc-800/60"}
                      `}
                    >
                      <span className="truncate">{option.label}</span>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-2" />
                      )}
                    </li>
                  )
                })
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
