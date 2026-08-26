import { City, Country, State } from "country-state-city"
import { NextResponse } from "next/server"
import { parseLocationSelection } from "@/lib/onboarding-location"

const CACHE_CONTROL = "public, max-age=86400, s-maxage=31536000, immutable"
const codePattern = /^[A-Z0-9-]{1,8}$/

type LocationOption = {
  value: string
  label: string
  name: string
}

function json(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": CACHE_CONTROL },
  })
}

function cityOptions(
  cities: ReturnType<typeof City.getCitiesOfCountry>,
): LocationOption[] {
  const names = new Set<string>()
  const options: LocationOption[] = []

  for (const city of cities ?? []) {
    if (names.has(city.name)) continue
    names.add(city.name)
    options.push({ value: city.name, label: city.name, name: city.name })
  }

  return options
}

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams
  const location = searchParams.get("location")?.trim()
  const countryCode = searchParams.get("country")?.trim().toUpperCase()
  const stateCode = searchParams.get("state")?.trim().toUpperCase()

  if (location) {
    if (location.length > 256) return json({ error: "Location is too long" }, 400)
    return json({ selection: parseLocationSelection(location) })
  }

  if (!countryCode) {
    return json({
      countries: Country.getAllCountries().map((country) => ({
        value: country.isoCode,
        label: `${country.flag} ${country.name}`,
        name: country.name,
      })),
    })
  }

  if (!codePattern.test(countryCode)) {
    return json({ error: "Invalid country code" }, 400)
  }

  const country = Country.getCountryByCode(countryCode)
  if (!country) return json({ error: "Unknown country code" }, 404)

  if (stateCode) {
    if (!codePattern.test(stateCode)) {
      return json({ error: "Invalid state code" }, 400)
    }

    const state = State.getStateByCodeAndCountry(stateCode, countryCode)
    if (!state) return json({ error: "Unknown state code" }, 404)

    return json({
      countryName: country.name,
      stateName: state.name,
      cities: cityOptions(City.getCitiesOfState(countryCode, stateCode)),
    })
  }

  const states = State.getStatesOfCountry(countryCode).map((state) => ({
    value: state.isoCode,
    label: state.name,
    name: state.name,
  }))

  return json({
    countryName: country.name,
    states,
    cities: states.length
      ? []
      : cityOptions(City.getCitiesOfCountry(countryCode)),
  })
}
