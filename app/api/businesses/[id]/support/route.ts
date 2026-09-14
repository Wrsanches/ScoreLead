import { and, eq } from "drizzle-orm"
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { supportAssistant, whatsappConnection } from "@/lib/db/schema"
import {
  disconnectSupport,
  getSupportSettings,
  publicSettings,
  scopeSupport,
} from "@/lib/support/data"
import { githubConfigured } from "@/lib/support/github"
import { supportSettingsInput } from "@/lib/support/policy"
import { hasWhatsAppEarlyAccess } from "@/lib/whatsapp/feature-access"

type Context = { params: Promise<{ id: string }> }
export async function GET(request: Request, context: Context) {
  const { id } = await context.params,
    scope = await scopeSupport(id, false, request)
  if (scope.error) return scope.error
  const row = await getSupportSettings(id)
  return NextResponse.json(
    {
      settings: publicSettings(row, scope.session.user.id),
      githubConfigured: githubConfigured(),
      installUrl: process.env.GITHUB_APP_SLUG
        ? `https://github.com/apps/${encodeURIComponent(process.env.GITHUB_APP_SLUG)}/installations/new`
        : null,
    },
    { headers: { "Cache-Control": "no-store" } },
  )
}
export async function PATCH(request: Request, context: Context) {
  const { id } = await context.params,
    scope = await scopeSupport(id, true, request)
  if (scope.error) return scope.error
  const input = supportSettingsInput.safeParse(
    await request.json().catch(() => null),
  )
  if (!input.success)
    return NextResponse.json(
      { code: "invalid_settings", fields: input.error.flatten().fieldErrors },
      { status: 400 },
    )
  const row = await getSupportSettings(id)
  const changedContext =
    row.instructions !== input.data.instructions ||
    row.handoffMessage !== input.data.handoffMessage ||
    JSON.stringify(row.includePaths) !== JSON.stringify(input.data.includePaths)
  if (input.data.enabled) {
    if (
      row.status !== "ready" ||
      row.previewedVersion !== row.version ||
      changedContext
    )
      return NextResponse.json({ code: "preview_required" }, { status: 409 })
    const [connection] = await db
      .select()
      .from(whatsappConnection)
      .where(eq(whatsappConnection.businessId, id))
    if (
      connection?.status !== "connected" ||
      !hasWhatsAppEarlyAccess(scope.access.ownerEmail)
    )
      return NextResponse.json({ code: "whatsapp_required" }, { status: 409 })
  }
  const pathsChanged =
    JSON.stringify(row.includePaths) !== JSON.stringify(input.data.includePaths)
  const [saved] = await db
    .update(supportAssistant)
    .set({
      ...input.data,
      version: row.version + 1,
      previewedVersion: changedContext
        ? null
        : row.previewedVersion === row.version
          ? row.version + 1
          : null,
      ...(pathsChanged && row.repository
        ? { status: "queued", syncRequestedAt: new Date(), syncToken: null }
        : {}),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(supportAssistant.businessId, id),
        eq(supportAssistant.version, input.data.version),
      ),
    )
    .returning()
  if (!saved)
    return NextResponse.json({ code: "settings_changed" }, { status: 409 })
  return NextResponse.json({
    settings: publicSettings(saved, scope.session.user.id),
  })
}
export async function DELETE(request: Request, context: Context) {
  const { id } = await context.params,
    scope = await scopeSupport(id, false, request)
  if (scope.error) return scope.error
  await disconnectSupport(id)
  return NextResponse.json({ ok: true })
}
