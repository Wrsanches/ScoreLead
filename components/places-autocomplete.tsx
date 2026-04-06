"use client"

import { useEffect, useRef, useState } from "react"
import usePlacesAutocomplete, { getGeocode, getLatLng } from "use-places-autocomplete"
import { MapPin } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"

interface PlacesAutocompleteProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  id?: string
}

function loadGoogleMapsScript(apiKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.maps?.places) {
      resolve()
      return
    }
    const existing = document.querySelector('script[src*="maps.googleapis.com"]')
    if (existing) {
      existing.addEventListener("load", () => resolve())
      return
    }
    const script = document.createElement("script")
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("Failed to load Google Maps"))
    document.head.appendChild(script)
  })
}

export function PlacesAutocomplete({ value, onChange, placeholder, id }: PlacesAutocompleteProps) {
  const [loaded, setLoaded] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey) return
    loadGoogleMapsScript(apiKey).then(() => setLoaded(true))
  }, [])

  if (!loaded) {
    return (
      <FallbackInput value={value} onChange={onChange} placeholder={placeholder} id={id} />
    )
  }

  return (
    <PlacesInput value={value} onChange={onChange} placeholder={placeholder} id={id} containerRef={containerRef} />
  )
}

function FallbackInput({ value, onChange, placeholder, id }: PlacesAutocompleteProps) {
  return (
    <div className="relative group">
      <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 transition-colors duration-200 group-focus-within:text-zinc-400" />
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2.5 bg-zinc-800/30 border border-zinc-700/50 rounded-lg text-base text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 transition-all duration-200"
      />
    </div>
  )
}

function PlacesInput({
  value,
  onChange,
  placeholder,
  id,
  containerRef,
}: PlacesAutocompleteProps & { containerRef: React.RefObject<HTMLDivElement | null> }) {
  const {
    ready,
    value: inputValue,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: { types: ["(cities)"] },
    debounce: 300,
    defaultValue: value,
  })

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        clearSuggestions()
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [clearSuggestions, containerRef])

  function handleSelect(description: string) {
    setValue(description, false)
    clearSuggestions()
    onChange(description)
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative group">
        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 transition-colors duration-200 group-focus-within:text-zinc-400" />
        <input
          id={id}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setValue(e.target.value)
            onChange(e.target.value)
          }}
          disabled={!ready}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2.5 bg-zinc-800/30 border border-zinc-700/50 rounded-lg text-base text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/40 transition-all duration-200"
        />
      </div>

      <AnimatePresence>
        {status === "OK" && (
          <motion.ul
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-1 bg-zinc-900 border border-zinc-700/50 rounded-lg overflow-hidden shadow-xl"
          >
            {data.map(({ place_id, description }) => (
              <li
                key={place_id}
                onClick={() => handleSelect(description)}
                className="px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 cursor-pointer transition-colors duration-150 flex items-center gap-2"
              >
                <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                {description}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}
