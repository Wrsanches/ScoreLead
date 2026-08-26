"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { motion } from "framer-motion"
import { MapPin, ArrowRight, ArrowLeft } from "lucide-react"
import { SearchableSelect } from "@/components/searchable-select"
import { LocationLoadError } from "@/components/location-load-error"
import {
  resolveLocationSelection,
  useLocationOptions,
} from "@/hooks/use-location-options"

const EASE = [0.25, 0.46, 0.45, 0.94] as const

interface StepLocationProps {
  defaultLocation?: string
  onSubmit: (location: string) => void
  onBack: () => void
}

export function StepLocation({ defaultLocation, onSubmit, onBack }: StepLocationProps) {
  const t = useTranslations("onboarding")

  const [countryCode, setCountryCode] = useState("")
  const [stateCode, setStateCode] = useState("")
  const [cityName, setCityName] = useState("")
  const resolvedDefault = useRef<string | null>(null)
  const {
    countryOptions,
    stateOptions,
    cityOptions,
    loadingCountries,
    loadingStates,
    loadingCities,
    locationLoadFailed,
    retryLocations,
  } = useLocationOptions(countryCode, stateCode)

  useEffect(() => {
    if (!defaultLocation || resolvedDefault.current === defaultLocation) return
    resolvedDefault.current = defaultLocation
    let active = true
    resolveLocationSelection(defaultLocation).then((selection) => {
      if (!active) return
      setCountryCode(selection.countryCode)
      setStateCode(selection.stateCode)
      setCityName(selection.cityName)
    }).catch(() => {})
    return () => {
      active = false
    }
  }, [defaultLocation])

  const handleCountryChange = useCallback((value: string) => {
    setCountryCode(value)
    setStateCode("")
    setCityName("")
  }, [])

  const handleStateChange = useCallback((value: string) => {
    setStateCode(value)
    setCityName("")
  }, [])

  const handleCityChange = useCallback((value: string) => {
    setCityName(value)
  }, [])

  function handleSubmitClick() {
    // Build location string like "San Francisco, California, United States"
    const parts: string[] = []
    if (cityName) parts.push(cityName)
    const state = stateOptions.find((option) => option.value === stateCode)
    const country = countryOptions.find((option) => option.value === countryCode)
    if (state) parts.push(state.name)
    if (country) parts.push(country.name)
    onSubmit(parts.join(", "))
  }

  const hasStates = stateOptions.length > 0
  const hasCities = cityOptions.length > 0
  const locationOptionsLoading = loadingCountries || loadingStates || loadingCities
  const canSubmitLocation = Boolean(countryCode) && !locationOptionsLoading && !locationLoadFailed

  return (
    <div>
      <div className="flex flex-col items-center text-center mb-10">
        <h2 className="text-2xl font-semibold text-white tracking-tight">
          {t("locationTitle")}
        </h2>
        <p className="text-zinc-400 text-sm mt-2 max-w-sm leading-relaxed">
          {t("locationDescription")}
        </p>
      </div>

      <div className="space-y-5">
        {locationLoadFailed && (
          <LocationLoadError
            message={t("locationLoadError")}
            retryLabel={t("locationRetry")}
            retrying={locationOptionsLoading}
            onRetry={retryLocations}
          />
        )}

        {/* Country */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15, ease: EASE }}
        >
          <SearchableSelect
            options={countryOptions}
            value={countryCode}
            onChange={handleCountryChange}
            placeholder={t("locationCountryPlaceholder")}
            label={t("locationCountry")}
            icon={<MapPin className="w-4 h-4" />}
            disabled={loadingCountries}
          />
        </motion.div>

        {/* State - show when country is selected and has states */}
        {countryCode && hasStates && (
          <motion.div
            initial={{ opacity: 0, y: 12, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            transition={{ duration: 0.35, ease: EASE }}
          >
            <SearchableSelect
              options={stateOptions}
              value={stateCode}
              onChange={handleStateChange}
              placeholder={t("locationStatePlaceholder")}
              label={t("locationState")}
              disabled={loadingStates}
            />
          </motion.div>
        )}

        {/* City - show when we have cities available */}
        {countryCode && (hasStates ? stateCode : true) && hasCities && (
          <motion.div
            initial={{ opacity: 0, y: 12, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            transition={{ duration: 0.35, ease: EASE }}
          >
            <SearchableSelect
              options={cityOptions}
              value={cityName}
              onChange={handleCityChange}
              placeholder={t("locationCityPlaceholder")}
              label={t("locationCity")}
              disabled={loadingCities}
            />
          </motion.div>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex items-center gap-3 pt-8"
      >
        <button
          type="button"
          onClick={onBack}
          className="flex items-center justify-center gap-2 px-5 py-3 text-sm text-zinc-500 hover:text-zinc-300 font-medium rounded-xl transition-colors duration-200"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {t("back")}
        </button>

        <motion.button
          type="button"
          onClick={handleSubmitClick}
          disabled={!canSubmitLocation}
          whileHover={canSubmitLocation ? { scale: 1.01 } : {}}
          whileTap={canSubmitLocation ? { scale: 0.99 } : {}}
          className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-950 font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/15"
        >
          {t("analyzeWithAI")}
          <ArrowRight className="w-4 h-4" />
        </motion.button>
      </motion.div>
    </div>
  )
}
