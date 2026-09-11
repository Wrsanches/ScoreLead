import { eraseInstagramUserData } from "@/lib/instagram/data"
import { createDeletionReceipt, validDeletionReceipt } from "@/lib/instagram/deletion-receipt"
import { signedInstagramUser } from "@/lib/instagram/security"

const headers = { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" }

export async function POST(request: Request) {
  const secret = process.env.INSTAGRAM_APP_SECRET
  const redirect = process.env.INSTAGRAM_REDIRECT_URI
  if (!secret || !redirect)
    return Response.json({ error: "Not configured" }, { status: 503, headers })
  const form = await request.formData().catch(() => null)
  const signed = form?.get("signed_request")
  const userId = typeof signed === "string" && signed.length < 10_000
    ? signedInstagramUser(signed, secret) : null
  if (!userId)
    return Response.json({ error: "Invalid signature" }, { status: 403, headers })
  // Build from server configuration, never the untrusted request Host header.
  const url = new URL("/api/instagram/data-deletion", new URL(redirect).origin)
  await eraseInstagramUserData(userId)
  const code = createDeletionReceipt(secret)
  url.searchParams.set("code", code)
  return Response.json({ url: url.toString(), confirmation_code: code }, { headers })
}

export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get("code") || ""
  const secret = process.env.INSTAGRAM_APP_SECRET
  const valid = secret && validDeletionReceipt(code, secret)
  const text = valid
    ? "Exclusão concluída / Deletion completed.\n\nOs dados recebidos do Instagram e o token de acesso foram excluídos. Agendamentos pendentes foram cancelados. Conteúdo criado no ScoreLead permanece na sua conta; para excluir a conta completa, consulte https://scorelead.io/data-deletion.\n\nInstagram profile data and the access token have been deleted. Pending schedules were cancelled. Content authored in ScoreLead remains in your account. Full account deletion: https://scorelead.io/data-deletion.\n\nCódigo de confirmação / Confirmation code: " + code
    : "Comprovante não encontrado / Receipt not found."
  return new Response(text, {
    status: valid ? 200 : 404,
    headers: { ...headers, "Content-Type": "text/plain; charset=utf-8", "X-Content-Type-Options": "nosniff" },
  })
}
