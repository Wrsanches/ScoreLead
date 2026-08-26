import type { AcquisitionChannel } from "@/lib/analytics-events"

const aiHosts: Record<string, string> = {
  "chatgpt.com": "chatgpt",
  "chat.openai.com": "chatgpt",
  "perplexity.ai": "perplexity",
  "claude.ai": "claude",
  "copilot.microsoft.com": "copilot",
  "gemini.google.com": "gemini",
  "meta.ai": "meta_ai",
  "you.com": "you",
}

const searchHosts: Record<string, string> = {
  "google.com": "google",
  "google.com.br": "google",
  "google.es": "google",
  "google.pt": "google",
  "bing.com": "bing",
  "duckduckgo.com": "duckduckgo",
  "search.yahoo.com": "yahoo",
}

const unwantedReferralHosts = [
  "billing.stripe.com",
  "checkout.stripe.com",
]

function matchKnownHost(hostname: string, hosts: Record<string, string>) {
  const normalized = hostname.trim().toLowerCase()
  const key = Object.keys(hosts).find(
    (host) => normalized === host || normalized.endsWith(`.${host}`),
  )
  return key ? hosts[key] : undefined
}

function parseHostname(value: string) {
  if (!value) return ""

  try {
    return new URL(value).hostname.toLowerCase()
  } catch {
    return value.trim().toLowerCase()
  }
}

export function isUnwantedReferral(value: string) {
  const hostname = parseHostname(value)
  return unwantedReferralHosts.some(
    (host) => hostname === host || hostname.endsWith(`.${host}`),
  )
}

export function classifyAcquisition(input: {
  currentUrl: string
  referrer?: string
  currentHostname?: string
}): { channel: AcquisitionChannel; source: string } {
  const url = new URL(input.currentUrl)
  const currentHostname = (
    input.currentHostname || url.hostname
  ).toLowerCase()
  const referrerHost = parseHostname(input.referrer ?? "")
  const utmSource = url.searchParams.get("utm_source")?.trim().toLowerCase()
  const utmMedium = url.searchParams.get("utm_medium")?.trim().toLowerCase()

  const aiSource =
    (utmSource &&
      (matchKnownHost(utmSource, aiHosts) ||
        Object.values(aiHosts).find((source) => source === utmSource))) ||
    matchKnownHost(referrerHost, aiHosts)
  if (aiSource) return { channel: "ai", source: aiSource }

  if (utmMedium === "organic" && utmSource) {
    return { channel: "organic", source: utmSource }
  }

  const organicSource = matchKnownHost(referrerHost, searchHosts)
  if (organicSource) return { channel: "organic", source: organicSource }

  if (utmSource) return { channel: "campaign", source: utmSource }

  if (
    referrerHost &&
    referrerHost !== currentHostname &&
    !isUnwantedReferral(referrerHost)
  ) {
    return { channel: "referral", source: referrerHost }
  }

  return { channel: "direct", source: "direct" }
}
