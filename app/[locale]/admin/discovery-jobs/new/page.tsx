"use client"

import { useState, useMemo, useCallback, useEffect, useRef } from "react"
import { useTranslations } from "next-intl"
import { useRouter, useSearchParams } from "next/navigation"
import { useActiveBusiness } from "@/components/admin/active-business-context"
import {
  MapPin,
  Search,
  Radar,
  Info,
  X,
  Sparkles,
  Loader2,
  CheckCircle2,
  Bookmark,
} from "lucide-react"
import { Country, State, City } from "country-state-city"
import type { ICountry, IState, ICity } from "country-state-city"
import { SearchableSelect, type SelectOption } from "@/components/searchable-select"
import { PageHeader, ContentWrapper } from "@/components/admin"
import { toast } from "sonner"

export default function NewDiscoveryJobPage() {
  const t = useTranslations("dashboard")
  const router = useRouter()
  const searchParams = useSearchParams()
  const savedSearchId = searchParams.get("savedSearchId")
  const { activeBusinessId } = useActiveBusiness()

  // If the user switches businesses mid-form, bounce back to the jobs list
  // for the newly selected business instead of letting them accidentally
  // create a job under the wrong org.
  const initialBusinessRef = useRef<string | null | undefined>(undefined)
  useEffect(() => {
    if (initialBusinessRef.current === undefined) {
      initialBusinessRef.current = activeBusinessId
      return
    }
    if (initialBusinessRef.current !== activeBusinessId) {
      router.replace("/admin/discovery-jobs")
    }
  }, [activeBusinessId, router])

  // Form state
  const [jobName, setJobName] = useState("")
  const [countryCode, setCountryCode] = useState("")
  const [stateCode, setStateCode] = useState("")
  const [cityName, setCityName] = useState("")
  const [keywordInput, setKeywordInput] = useState("")
  const [keywords, setKeywords] = useState<string[]>([])
  const [savingSearch, setSavingSearch] = useState(false)

  // Suggested keywords
  const [suggestedKeywords, setSuggestedKeywords] = useState<string[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [businessId, setBusinessId] = useState<string | null>(null)

  // Submit state
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch business and suggest keywords
  useEffect(() => {
    async function init() {
      try {
        const res = await fetch("/api/businesses")
        if (!res.ok) return
        const businesses = await res.json()
        if (businesses.length > 0) {
          const biz = businesses[0]
          setBusinessId(biz.id)

          // Load saved search if ID is in URL
          if (savedSearchId) {
            try {
              const ssRes = await fetch(`/api/discovery/saved-searches/${savedSearchId}`)
              if (ssRes.ok) {
                const ss = await ssRes.json()
                setJobName(ss.name)
                setCountryCode(ss.country)
                if (ss.state) setStateCode(ss.state)
                if (ss.city) setCityName(ss.city)
                if (ss.keywords) setKeywords(ss.keywords)
              }
            } catch {
              // Failed to load saved search
            }
          } else {
            // Pre-fill keywords from last discovery job if available
            if (biz.lastDiscoveryKeywords && biz.lastDiscoveryKeywords.length > 0) {
              setKeywords(biz.lastDiscoveryKeywords)
            }
          }

          // Use cached suggestions if available, otherwise fetch from AI
          if (biz.suggestedKeywords && biz.suggestedKeywords.length > 0) {
            setSuggestedKeywords(biz.suggestedKeywords)
          } else {
            fetchSuggestions(biz.id)
          }
        }
      } catch {
        // Failed to fetch businesses
      }
    }
    init()
  }, [])

  async function fetchSuggestions(bizId: string) {
    setLoadingSuggestions(true)
    try {
      const res = await fetch("/api/discovery/suggest-keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: bizId }),
      })
      if (res.ok) {
        const data = await res.json()
        setSuggestedKeywords(data.keywords || [])
      }
    } catch {
      // Failed to fetch suggestions
    }
    setLoadingSuggestions(false)
  }

  // Country/State/City options
  const countryOptions: SelectOption[] = useMemo(() => {
    const countries: ICountry[] = Country.getAllCountries()
    return countries.map((c) => ({
      value: c.isoCode,
      label: `${c.flag} ${c.name}`,
    }))
  }, [])

  const stateOptions: SelectOption[] = useMemo(() => {
    if (!countryCode) return []
    const states: IState[] = State.getStatesOfCountry(countryCode)
    return states.map((s) => ({
      value: s.isoCode,
      label: s.name,
    }))
  }, [countryCode])

  const cityOptions: SelectOption[] = useMemo(() => {
    if (!countryCode) return []
    if (!stateCode) {
      const cities: ICity[] = City.getCitiesOfCountry(countryCode) || []
      return cities.map((c) => ({ value: c.name, label: c.name }))
    }
    const cities: ICity[] = City.getCitiesOfState(countryCode, stateCode) || []
    return cities.map((c) => ({ value: c.name, label: c.name }))
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

  const hasStates = stateOptions.length > 0
  const hasCities = cityOptions.length > 0

  function buildLocation(): string {
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
    return parts.join(", ")
  }

  // Keywords
  function addKeyword() {
    const kw = keywordInput.trim()
    if (kw && !keywords.includes(kw)) {
      setKeywords([...keywords, kw])
      setKeywordInput("")
    }
  }

  function removeKeyword(kw: string) {
    setKeywords(keywords.filter((k) => k !== kw))
  }

  function toggleSuggested(kw: string) {
    if (keywords.includes(kw)) {
      setKeywords(keywords.filter((k) => k !== kw))
    } else {
      setKeywords([...keywords, kw])
    }
  }

  function handleKeywordKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault()
      addKeyword()
    }
    if (e.key === "Backspace" && keywordInput === "" && keywords.length > 0) {
      setKeywords(keywords.slice(0, -1))
    }
  }

  const canSubmit = jobName.trim() && countryCode && keywords.length > 0 && businessId && !isSubmitting
  const canSave = jobName.trim() && countryCode && keywords.length > 0 && businessId && !isSubmitting && !savingSearch

  async function handleSaveSearch() {
    if (!canSave) return
    setSavingSearch(true)
    try {
      const res = await fetch("/api/discovery/saved-searches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          name: jobName,
          country: countryCode,
          state: stateCode || null,
          city: cityName || null,
          location: buildLocation(),
          keywords,
        }),
      })
      if (res.ok) {
        toast.success("Search saved")
      } else {
        toast.error("Failed to save search")
      }
    } catch {
      toast.error("Failed to save search")
    }
    setSavingSearch(false)
  }

  async function handleLaunch() {
    if (!canSubmit) return

    const location = buildLocation()
    setIsSubmitting(true)

    try {
      const res = await fetch("/api/discovery/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          name: jobName,
          country: countryCode,
          state: stateCode || null,
          city: cityName || null,
          location,
          keywords,
          maxResults: 10,
          serviceArea: "local",
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error || "Failed to start discovery")
        setIsSubmitting(false)
        return
      }

      toast.success("Discovery job started! Redirecting...")
      router.push("/admin/discovery-jobs")
    } catch {
      toast.error("Failed to start discovery")
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <PageHeader
        title={t("createJob")}
        backHref="/admin/discovery-jobs"
        breadcrumbs={[{ label: t("discoveryJobsTitle") }]}
      />

      <div className="flex-1 overflow-auto">
        <ContentWrapper narrow>
          <div className="mb-8">
            <h1 className="text-white text-2xl font-semibold tracking-tight mb-2">{t("createJob")}</h1>
            <p className="text-zinc-500 text-sm">Configure your discovery parameters. Our AI will scan the web, find matching businesses, and score them as leads.</p>
          </div>

            {/* Form */}
            <div className="space-y-8">
              {/* Section: Basic info */}
              <div className="space-y-5">
                <div className="flex items-center gap-2 pb-2 border-b border-zinc-800/60">
                  <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Basic Information</span>
                </div>

                <div>
                  <label className="block text-sm text-zinc-300 mb-2">{t("jobName")}</label>
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                    <input
                      type="text"
                      value={jobName}
                      onChange={(e) => setJobName(e.target.value)}
                      placeholder={t("jobNamePlaceholder")}
                      disabled={isSubmitting}
                      className="w-full h-11 pl-11 pr-4 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-200 placeholder:text-zinc-700 focus:outline-none focus:border-zinc-700 transition-colors disabled:opacity-50"
                    />
                  </div>
                  <p className="text-zinc-600 text-xs mt-1.5">Give your job a descriptive name so you can find it later.</p>
                </div>
              </div>

              {/* Section: Location */}
              <div className="space-y-5">
                <div className="flex items-center gap-2 pb-2 border-b border-zinc-800/60">
                  <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">{t("targetLocation")}</span>
                </div>

                <SearchableSelect
                  options={countryOptions}
                  value={countryCode}
                  onChange={handleCountryChange}
                  placeholder="Select a country"
                  label="Country"
                  icon={<MapPin className="w-4 h-4" />}
                  disabled={isSubmitting}
                />

                {countryCode && hasStates && (
                  <SearchableSelect
                    options={stateOptions}
                    value={stateCode}
                    onChange={handleStateChange}
                    placeholder="Select a state"
                    label="State"
                    disabled={isSubmitting}
                  />
                )}

                {countryCode && (hasStates ? stateCode : true) && hasCities && (
                  <SearchableSelect
                    options={cityOptions}
                    value={cityName}
                    onChange={handleCityChange}
                    placeholder="Select a city"
                    label="City"
                    disabled={isSubmitting}
                  />
                )}
              </div>

              {/* Section: Keywords */}
              <div className="space-y-5">
                <div className="flex items-center gap-2 pb-2 border-b border-zinc-800/60">
                  <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">{t("keywords")}</span>
                </div>

                {/* AI Suggested keywords */}
                {(loadingSuggestions || suggestedKeywords.length > 0) && (
                  <div>
                    <div className="flex items-center gap-2 mb-2.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-xs text-zinc-400">AI Suggestions</span>
                    </div>
                    {loadingSuggestions ? (
                      <div className="flex items-center gap-2 text-zinc-600 text-sm">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Generating suggestions...
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {suggestedKeywords.map((kw) => {
                          const isSelected = keywords.includes(kw)
                          return (
                            <button
                              key={kw}
                              type="button"
                              onClick={() => toggleSuggested(kw)}
                              disabled={isSubmitting}
                              className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all duration-200 disabled:opacity-50 ${
                                isSelected
                                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                                  : "bg-transparent border-dashed border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300"
                              }`}
                            >
                              {isSelected && <CheckCircle2 className="w-3 h-3" />}
                              {kw}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Custom keywords input */}
                <div>
                  <label className="block text-sm text-zinc-300 mb-2">{t("keywords")}</label>
                  <div className="min-h-11 flex flex-wrap items-center gap-2 px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl focus-within:border-zinc-700 transition-colors">
                    {keywords.map((kw) => (
                      <span
                        key={kw}
                        className={`inline-flex items-center gap-1 text-xs pl-2.5 pr-1.5 py-1 rounded-lg ${
                          suggestedKeywords.includes(kw)
                            ? "text-emerald-300 bg-emerald-500/10"
                            : "text-zinc-300 bg-zinc-800"
                        }`}
                      >
                        {kw}
                        <button
                          onClick={() => removeKeyword(kw)}
                          disabled={isSubmitting}
                          className="p-0.5 text-zinc-600 hover:text-zinc-400 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      onKeyDown={handleKeywordKeyDown}
                      onBlur={addKeyword}
                      disabled={isSubmitting}
                      placeholder={keywords.length === 0 ? t("keywordsPlaceholder") : "Add more..."}
                      className="flex-1 min-w-30 bg-transparent text-sm text-zinc-200 placeholder:text-zinc-700 focus:outline-none disabled:opacity-50"
                    />
                  </div>
                  <p className="text-zinc-600 text-xs mt-1.5">Press Enter to add custom keywords. Click suggestions above to toggle them.</p>
                </div>
              </div>

              {/* Summary card */}
              {canSubmit && (
                <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Info className="w-4 h-4 text-zinc-500" />
                    <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Summary</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">Job name</span>
                      <span className="text-zinc-200">{jobName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">Location</span>
                      <span className="text-zinc-200">{buildLocation()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500">Keywords</span>
                      <span className="text-zinc-200 text-right max-w-[60%] truncate">{keywords.join(", ")}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-zinc-800/60">
                <button
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                  className="h-10 px-4 text-sm text-zinc-500 hover:text-zinc-300 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveSearch}
                  disabled={!canSave}
                  className="h-10 px-4 text-sm text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-700 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {savingSearch ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Bookmark className="w-4 h-4" />
                  )}
                  Save
                </button>
                <button
                  onClick={handleLaunch}
                  disabled={!canSubmit}
                  className="h-10 px-6 text-sm font-medium bg-emerald-500 text-zinc-950 rounded-xl hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Radar className="w-4 h-4" />
                      {t("launchJob")}
                    </>
                  )}
                </button>
                </div>
              </div>
            </div>
        </ContentWrapper>
      </div>
    </>
  )
}
