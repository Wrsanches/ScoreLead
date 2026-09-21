import { Img, Section, Text } from "@react-email/components"
import type { HeaderProps } from "@/lib/resend/blocks"
import type { BrandTheme } from "../theme"

export function HeaderComponent({ props, theme }: { props: HeaderProps; theme: BrandTheme }) {
  const { logoUrl, businessName, tagline, align } = props
  if (!logoUrl && !businessName && !tagline) return null
  return (
    <Section style={{ textAlign: align, padding: "0 0 22px", borderBottom: `1px solid ${theme.accentSoft}`, marginBottom: "24px" }}>
      {logoUrl && (
        <Img
          src={logoUrl}
          alt={businessName || ""}
          width={44}
          height={44}
          style={{ display: align === "center" ? "inline-block" : "block", borderRadius: "10px", marginBottom: businessName || tagline ? "10px" : 0 }}
        />
      )}
      {businessName && (
        <Text style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: theme.headingColor, fontFamily: theme.headingFontStack, letterSpacing: "-0.01em" }}>
          {businessName}
        </Text>
      )}
      {tagline && (
        <Text style={{ margin: "2px 0 0", fontSize: "13px", color: theme.muted, fontFamily: theme.fontStack }}>{tagline}</Text>
      )}
    </Section>
  )
}
