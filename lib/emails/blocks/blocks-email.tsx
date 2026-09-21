import { Body, Head, Html, Preview } from "@react-email/components"
import type { EmailDocument, ResolvedEmailComponents } from "@/lib/resend/blocks"
import { BlocksContent } from "./blocks-content"
import type { BrandTheme } from "./theme"

/** Full document for sending. Never render this in the browser (nested html). */
export function BlocksEmail({
  doc,
  components,
  theme,
  subject,
  lang = "en",
}: {
  doc: EmailDocument
  components: ResolvedEmailComponents
  theme: BrandTheme
  subject: string
  lang?: string
}) {
  const preview = doc.previewText || subject
  return (
    <Html lang={lang}>
      <Head>
        {theme.webFontUrl && (
          // Clients that honor remote CSS (Apple Mail, iOS, most webmail) get the brand font; others fall back.
          <style>{`@import url('${theme.webFontUrl}');`}</style>
        )}
      </Head>
      {preview && <Preview>{preview}</Preview>}
      <Body style={{ margin: 0, padding: "28px 16px", backgroundColor: theme.background, fontFamily: theme.fontStack }}>
        <BlocksContent doc={doc} components={components} theme={theme} />
      </Body>
    </Html>
  )
}
