import { readFile } from "node:fs/promises"
import { join } from "node:path"

export const size = {
  width: 1200,
  height: 630,
}

export const contentType = "image/png"

export default async function OGImage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const file = locale === "pt" ? "og-image-pt.png" : locale === "es" ? "og-image-es.png" : "og-image-en.png"
  const imageBuffer = await readFile(join(process.cwd(), `public/images/${file}`))

  return new Response(imageBuffer, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  })
}
