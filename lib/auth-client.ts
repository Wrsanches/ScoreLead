import { createAuthClient } from "better-auth/react"
import { stripeClient } from "@better-auth/stripe/client"
import { getAuthClientBaseUrl } from "@/lib/site-urls"

function getAuthBaseURL() {
  if (typeof window === "undefined") return undefined
  return getAuthClientBaseUrl(window.location.origin)
}

export const authClient = createAuthClient({
  // Marketing pages on scorelead.io read the session from the app domain.
  // Localhost and preview deployments must authenticate on their own origin.
  baseURL: getAuthBaseURL(),
  plugins: [stripeClient({ subscription: true })],
})
