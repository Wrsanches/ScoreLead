"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, CornerDownLeft } from "lucide-react"

interface TagsInputProps {
  value: string
  onChange: (value: string) => void
  placeholder: string
  maxTags?: number
  inputClassName?: string
  chipClassName?: string
  chipRemoveClassName?: string
  submitButtonClassName?: string
  submitButtonIdleClassName?: string
  stripHashPrefix?: boolean
  asArray?: boolean
  arrayValue?: string[]
  onArrayChange?: (value: string[]) => void
}

const DEFAULT_INPUT =
  "w-full px-4 py-3 bg-zinc-800/20 border border-zinc-800/80 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/30 transition-all duration-200"
const DEFAULT_CHIP =
  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium"
const DEFAULT_CHIP_REMOVE =
  "text-emerald-400/60 hover:text-emerald-300 transition-colors"

export function TagsInput({
  value,
  onChange,
  placeholder,
  maxTags = 12,
  inputClassName = DEFAULT_INPUT,
  chipClassName = DEFAULT_CHIP,
  chipRemoveClassName = DEFAULT_CHIP_REMOVE,
  submitButtonClassName,
  submitButtonIdleClassName,
  stripHashPrefix = false,
  asArray = false,
  arrayValue,
  onArrayChange,
}: TagsInputProps) {
  const [inputValue, setInputValue] = useState("")

  const tags = asArray && arrayValue
    ? arrayValue
    : value
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)

  const emit = useCallback(
    (next: string[]) => {
      if (asArray && onArrayChange) {
        onArrayChange(next)
      } else {
        onChange(next.join(", "))
      }
    },
    [asArray, onArrayChange, onChange],
  )

  const addTag = useCallback(
    (tag: string) => {
      let trimmed = tag.trim()
      if (stripHashPrefix) trimmed = trimmed.replace(/^#+/, "")
      if (!trimmed || tags.includes(trimmed) || tags.length >= maxTags) return
      emit([...tags, trimmed])
      setInputValue("")
    },
    [tags, emit, maxTags, stripHashPrefix],
  )

  const removeTag = useCallback(
    (index: number) => {
      emit(tags.filter((_, i) => i !== index))
    },
    [tags, emit],
  )

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      addTag(inputValue)
    }
    if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      removeTag(tags.length - 1)
    }
  }

  const hasInput = inputValue.trim().length > 0
  const idleClass =
    submitButtonIdleClassName ?? "bg-zinc-800/40 text-zinc-600"
  const activeClass =
    submitButtonClassName ??
    "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25"

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        <AnimatePresence>
          {tags.map((tag, i) => (
            <motion.span
              key={tag}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              className={chipClassName}
            >
              {stripHashPrefix ? `#${tag}` : tag}
              <button
                type="button"
                onClick={() => removeTag(i)}
                className={chipRemoveClassName}
                aria-label="Remove"
              >
                <X className="w-3 h-3" />
              </button>
            </motion.span>
          ))}
        </AnimatePresence>
      </div>
      {tags.length < maxTags ? (
        <div className="relative">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => addTag(inputValue)}
            placeholder={tags.length === 0 ? placeholder : "Add more..."}
            className={`${inputClassName} pr-20`}
          />
          <button
            type="button"
            onClick={() => addTag(inputValue)}
            className={`absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
              hasInput ? activeClass : idleClass
            }`}
          >
            <CornerDownLeft className="w-3 h-3" />
            Enter
          </button>
        </div>
      ) : (
        <p className="text-xs text-zinc-500 mt-1">
          Maximum of {maxTags} tags reached
        </p>
      )}
    </div>
  )
}
