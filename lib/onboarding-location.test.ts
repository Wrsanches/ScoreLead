import { describe, expect, test } from "bun:test"
import { parseLocationSelection } from "./onboarding-location"

describe("onboarding location state", () => {
  test("restores a city, state, and country selection", () => {
    expect(
      parseLocationSelection("San Francisco, California, United States"),
    ).toEqual({
      countryCode: "US",
      stateCode: "CA",
      cityName: "San Francisco",
    })
  })

  test("does not split commas that are part of a country name", () => {
    expect(
      parseLocationSelection("Kralendijk, Bonaire, Sint Eustatius and Saba"),
    ).toEqual({
      countryCode: "BQ",
      stateCode: "",
      cityName: "Kralendijk",
    })
  })

  test("returns an empty selection for missing or unrecognized values", () => {
    expect(parseLocationSelection()).toEqual({
      countryCode: "",
      stateCode: "",
      cityName: "",
    })
    expect(parseLocationSelection("not a real location")).toEqual({
      countryCode: "",
      stateCode: "",
      cityName: "",
    })
  })
})
