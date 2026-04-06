"use client"

import { useState, useMemo, useCallback } from "react"
import { useTranslations } from "next-intl"
import { motion } from "framer-motion"
import { MapPin, ArrowRight, ArrowLeft } from "lucide-react"
import { Country, State, City } from "country-state-city"
import type { ICountry, IState, ICity } from "country-state-city"
import { SearchableSelect, type SelectOption } from "./searchable-select"

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

  // Build country options
  const countryOptions: SelectOption[] = useMemo(() => {
    const countries: ICountry[] = Country.getAllCountries()
    return countries.map((c) => ({
      value: c.isoCode,
      label: `${c.flag} ${c.name}`,
    }))
  }, [])

  // Build state options based on selected country
  const stateOptions: SelectOption[] = useMemo(() => {
    if (!countryCode) return []
    const states: IState[] = State.getStatesOfCountry(countryCode)
    return states.map((s) => ({
      value: s.isoCode,
      label: s.name,
    }))
  }, [countryCode])

  // Build city options based on selected state
  const cityOptions: SelectOption[] = useMemo(() => {
    if (!countryCode) return []
    if (!stateCode) {
      // If country has no states, show all cities of the country
      const cities: ICity[] = City.getCitiesOfCountry(countryCode) || []
      return cities.map((c) => ({
        value: c.name,
        label: c.name,
      }))
    }
    const cities: ICity[] = City.getCitiesOfState(countryCode, stateCode) || []
    return cities.map((c) => ({
      value: c.name,
      label: c.name,
    }))
  }, [countryCode, stateCode])

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
    if (stateCode) {
      const state = State.getStateByCodeAndCountry(stateCode, countryCode)
      if (state) parts.push(state.name)
    }
    if (countryCode) {
      const country = Country.getCountryByCode(countryCode)
      if (country) parts.push(country.name)
    }
    onSubmit(parts.join(", "))
  }

  const hasStates = stateOptions.length > 0
  const hasCities = cityOptions.length > 0

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
          disabled={!countryCode}
          whileHover={countryCode ? { scale: 1.01 } : {}}
          whileTap={countryCode ? { scale: 0.99 } : {}}
          className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-950 font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/15"
        >
          {t("analyzeWithAI")}
          <ArrowRight className="w-4 h-4" />
        </motion.button>
      </motion.div>
    </div>
  )
}
