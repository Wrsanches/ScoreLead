"use client"

import { useCallback, useEffect, useState } from "react"
import type { SelectOption } from "@/components/searchable-select"
import type { LocationSelection } from "@/lib/onboarding-location"

export interface LocationOption extends SelectOption {
  name: string
}

type LocationResponse = {
  countries?: LocationOption[]
  states?: LocationOption[]
  cities?: LocationOption[]
  selection?: LocationSelection
}

const requestCache = new Map<string, Promise<LocationResponse>>()

function requestLocations(searchParams = new URLSearchParams()) {
  const query = searchParams.toString()
  const url = `/api/locations${query ? `?${query}` : ""}`
  const cached = requestCache.get(url)
  if (cached) return cached

  const request = fetch(url).then(async (response) => {
    if (!response.ok) throw new Error("Failed to load location options")
    return response.json() as Promise<LocationResponse>
  })
  requestCache.set(url, request)
  request.catch(() => requestCache.delete(url))
  return request
}

export async function resolveLocationSelection(location: string) {
  const searchParams = new URLSearchParams({ location })
  const response = await requestLocations(searchParams)
  return response.selection ?? { countryCode: "", stateCode: "", cityName: "" }
}

export function useLocationOptions(countryCode: string, stateCode: string) {
  const [countries, setCountries] = useState<LocationOption[]>([])
  const [countryData, setCountryData] = useState<{
    countryCode: string
    states: LocationOption[]
    cities: LocationOption[]
  }>({ countryCode: "", states: [], cities: [] })
  const [stateData, setStateData] = useState<{
    countryCode: string
    stateCode: string
    cities: LocationOption[]
  }>({ countryCode: "", stateCode: "", cities: [] })
  const [loadingCountries, setLoadingCountries] = useState(true)
  const [loadingStates, setLoadingStates] = useState(false)
  const [loadingCities, setLoadingCities] = useState(false)
  const [countriesLoadFailed, setCountriesLoadFailed] = useState(false)
  const [failedCountryCode, setFailedCountryCode] = useState<string | null>(null)
  const [failedStateKey, setFailedStateKey] = useState<string | null>(null)
  const [retryVersion, setRetryVersion] = useState(0)

  const retryLocations = useCallback(() => {
    setRetryVersion((version) => version + 1)
  }, [])

  useEffect(() => {
    let active = true
    setLoadingCountries(true)
    requestLocations()
      .then((response) => {
        if (!active) return
        setCountries(response.countries ?? [])
        setCountriesLoadFailed(false)
      })
      .catch(() => {
        if (!active) return
        setCountries([])
        setCountriesLoadFailed(true)
      })
      .finally(() => {
        if (active) setLoadingCountries(false)
      })
    return () => {
      active = false
    }
  }, [retryVersion])

  useEffect(() => {
    if (!countryCode) {
      setLoadingStates(false)
      return
    }
    let active = true
    setLoadingStates(true)
    const searchParams = new URLSearchParams({ country: countryCode })
    requestLocations(searchParams)
      .then((response) => {
        if (!active) return
        setCountryData({
          countryCode,
          states: response.states ?? [],
          cities: response.cities ?? [],
        })
        setFailedCountryCode((failedCode) =>
          failedCode === countryCode ? null : failedCode,
        )
      })
      .catch(() => {
        if (active) {
          setCountryData({ countryCode, states: [], cities: [] })
          setFailedCountryCode(countryCode)
        }
      })
      .finally(() => {
        if (active) setLoadingStates(false)
      })
    return () => {
      active = false
    }
  }, [countryCode, retryVersion])

  useEffect(() => {
    if (!countryCode || !stateCode) {
      setLoadingCities(false)
      return
    }
    let active = true
    setLoadingCities(true)
    const searchParams = new URLSearchParams({
      country: countryCode,
      state: stateCode,
    })
    requestLocations(searchParams)
      .then((response) => {
        if (!active) return
        setStateData({
          countryCode,
          stateCode,
          cities: response.cities ?? [],
        })
        const stateKey = `${countryCode}:${stateCode}`
        setFailedStateKey((failedKey) =>
          failedKey === stateKey ? null : failedKey,
        )
      })
      .catch(() => {
        if (active) {
          setStateData({ countryCode, stateCode, cities: [] })
          setFailedStateKey(`${countryCode}:${stateCode}`)
        }
      })
      .finally(() => {
        if (active) setLoadingCities(false)
      })
    return () => {
      active = false
    }
  }, [countryCode, stateCode, retryVersion])

  const currentCountryData =
    countryData.countryCode === countryCode ? countryData : null
  const currentStateData =
    stateData.countryCode === countryCode && stateData.stateCode === stateCode
      ? stateData
      : null
  const locationLoadFailed =
    countriesLoadFailed ||
    failedCountryCode === countryCode ||
    failedStateKey === `${countryCode}:${stateCode}`

  return {
    countryOptions: countries,
    stateOptions: currentCountryData?.states ?? [],
    cityOptions: stateCode
      ? (currentStateData?.cities ?? [])
      : (currentCountryData?.cities ?? []),
    loadingCountries,
    loadingStates,
    loadingCities,
    locationLoadFailed,
    retryLocations,
  }
}
