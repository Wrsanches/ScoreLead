import { auth } from "@/lib/auth"
import {
  getTrustedRequestOrigin,
  trustedAuthOrigins,
} from "@/lib/auth-origins"
import { toNextJsHandler } from "better-auth/next-js"

const { POST: authPost, GET: authGet } = toNextJsHandler(auth)

const SESSION_PATH = "/api/auth/get-session"

function addSessionCorsHeaders(request: Request, response: Response) {
  if (new URL(request.url).pathname !== SESSION_PATH) return response

  const origin = getTrustedRequestOrigin(
    request.headers.get("origin"),
    trustedAuthOrigins,
  )
  if (!origin) return response

  response.headers.set("Access-Control-Allow-Origin", origin)
  response.headers.set("Access-Control-Allow-Credentials", "true")
  response.headers.append("Vary", "Origin")
  return response
}

export async function GET(request: Request) {
  return addSessionCorsHeaders(request, await authGet(request))
}

export async function POST(request: Request) {
  return addSessionCorsHeaders(request, await authPost(request))
}

export function OPTIONS(request: Request) {
  if (new URL(request.url).pathname !== SESSION_PATH) {
    return new Response(null, {
      status: 204,
      headers: { Allow: "GET, HEAD, OPTIONS, POST" },
    })
  }

  const origin = getTrustedRequestOrigin(
    request.headers.get("origin"),
    trustedAuthOrigins,
  )
  if (!origin) return new Response(null, { status: 403 })

  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      Vary: "Origin, Access-Control-Request-Headers",
    },
  })
}
