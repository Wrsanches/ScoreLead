import { Country, State } from "country-state-city"

export interface LocationSelection {
  countryCode: string
  stateCode: string
  cityName: string
}

export function parseLocationSelection(defaultLocation?: string): LocationSelection {
  const emptyLocation = { countryCode: "", stateCode: "", cityName: "" }
  const value = defaultLocation?.trim()
  if (!value) return emptyLocation

  // Match from the end so city, state, and country names containing commas
  // remain intact. Longest-first avoids a shorter suffix winning early.
  const country = [...Country.getAllCountries()]
    .sort((a, b) => b.name.length - a.name.length)
    .find((candidate) => value === candidate.name || value.endsWith(`, ${candidate.name}`))

  if (!country) return emptyLocation

  const withoutCountry = value === country.name
    ? ""
    : value.slice(0, -(country.name.length + 2))

  const state = [...State.getStatesOfCountry(country.isoCode)]
    .sort((a, b) => b.name.length - a.name.length)
    .find((candidate) => (
      withoutCountry === candidate.name || withoutCountry.endsWith(`, ${candidate.name}`)
    ))

  const cityName = state
    ? withoutCountry === state.name
      ? ""
      : withoutCountry.slice(0, -(state.name.length + 2))
    : withoutCountry

  return {
    countryCode: country.isoCode,
    stateCode: state?.isoCode ?? "",
    cityName,
  }
}
