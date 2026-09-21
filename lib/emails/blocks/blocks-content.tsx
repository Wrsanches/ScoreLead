import { Container, Section } from "@react-email/components"
import type { EmailDocument, ResolvedEmailComponents } from "@/lib/resend/blocks"
import { renderBlock } from "./block-renderer"
import { HeaderComponent } from "./shared/header"
import { FooterComponent } from "./shared/footer"
import type { BrandTheme } from "./theme"

export const EMAIL_CARD_WIDTH = 600

/**
 * The email card: header, blocks, footer. Rendered inside
 * Html/Body on the server and directly in the builder canvas on the client.
 */
export function BlocksContent({
  doc,
  components,
  theme,
}: {
  doc: EmailDocument
  components: ResolvedEmailComponents
  theme: BrandTheme
}) {
  return (
    <Container
      style={{
        maxWidth: `${EMAIL_CARD_WIDTH}px`,
        margin: "0 auto",
        backgroundColor: theme.card,
        border: `1px solid ${theme.accentSoft}`,
        borderTop: `4px solid ${theme.primary}`,
        borderRadius: `${Math.max(theme.radius, 8)}px`,
        fontFamily: theme.fontStack,
        color: theme.text,
      }}
    >
      <Section style={{ padding: "30px 40px 36px" }}>
        {doc.shared.header && <HeaderComponent props={components.header} theme={theme} />}
        {doc.blocks.map((block) => (
          <div key={block.id}>{renderBlock(block, theme)}</div>
        ))}
        {doc.shared.footer && <FooterComponent props={components.footer} theme={theme} />}
      </Section>
    </Container>
  )
}
