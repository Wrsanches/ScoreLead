import { Link, Section, Text } from "@react-email/components"
import type { FooterProps } from "@/lib/resend/blocks"
import type { BrandTheme } from "../theme"

/** Always carries the unsubscribe link; the label is the only editable part of it. */
export function FooterComponent({ props, theme }: { props: FooterProps; theme: BrandTheme }) {
  const small: React.CSSProperties = { margin: "0 0 4px", fontSize: "12px", lineHeight: "1.6", color: theme.muted, fontFamily: theme.fontStack }
  const linkStyle: React.CSSProperties = { color: theme.muted, textDecoration: "underline" }
  const meta = [props.businessName, props.locationText].filter((s) => s.trim().length > 0)
  return (
    <Section style={{ borderTop: `1px solid ${theme.accentSoft}`, marginTop: "28px", paddingTop: "18px" }}>
      {meta.length > 0 && <Text style={small}>{meta.join(" · ")}</Text>}
      {(props.website || props.socialLinks.length > 0) && (
        <Text style={small}>
          {props.website && (
            <Link href={props.website} style={linkStyle}>
              {props.website.replace(/^https?:\/\//, "")}
            </Link>
          )}
          {props.socialLinks.map((link, i) => (
            <span key={i}>
              {(props.website || i > 0) && <span> · </span>}
              <Link href={link.href} style={linkStyle}>
                {link.label}
              </Link>
            </span>
          ))}
        </Text>
      )}
      {props.note && <Text style={small}>{props.note}</Text>}
      <Text style={{ ...small, margin: "8px 0 0" }}>
        <Link href="{{unsubscribe_url}}" style={linkStyle}>
          {props.unsubscribeLabel}
        </Link>
      </Text>
    </Section>
  )
}
