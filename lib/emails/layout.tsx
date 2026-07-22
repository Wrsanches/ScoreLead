import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Preview,
  Section,
} from "@react-email/components"

export const APP_URL = "https://scorelead.io"
const LOGO_URL = `${APP_URL}/apple-icon.png`

// Shared inline styles (email clients require inline styles, light theme only).
export const email = {
  heading: {
    margin: "0 0 8px",
    fontSize: "24px",
    lineHeight: "1.25",
    fontWeight: 700,
    color: "#18181b",
    letterSpacing: "-0.02em",
  } as const,
  paragraph: {
    margin: "0 0 16px",
    fontSize: "15px",
    lineHeight: "1.7",
    color: "#3f3f46",
  } as const,
  muted: {
    margin: "0 0 16px",
    fontSize: "14px",
    lineHeight: "1.7",
    color: "#71717a",
  } as const,
  button: {
    backgroundColor: "#10b981",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: 700,
    textDecoration: "none",
    padding: "14px 30px",
    borderRadius: "10px",
    display: "inline-block",
  } as const,
  link: { color: "#10b981", textDecoration: "underline" } as const,
}

/**
 * Branded ScoreLead email shell used by every transactional email: a logo badge
 * on a white card over a light background. Email-client safe (inline styles,
 * hosted PNG logo, light theme).
 */
export function EmailLayout({
  preview,
  children,
}: {
  preview: string
  children: React.ReactNode
}) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={styles.body}>
        <Container style={styles.card}>
          <Section style={styles.logoWrap}>
            <Img
              src={LOGO_URL}
              width="52"
              height="52"
              alt="ScoreLead"
              style={styles.logo}
            />
          </Section>

          <Section style={styles.content}>{children}</Section>
        </Container>
      </Body>
    </Html>
  )
}

const styles = {
  body: {
    margin: 0,
    padding: "32px 16px",
    backgroundColor: "#f4f4f5",
    fontFamily:
      "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif",
  } as const,
  card: {
    maxWidth: "520px",
    margin: "0 auto",
    backgroundColor: "#ffffff",
    border: "1px solid #e4e4e7",
    borderRadius: "16px",
    overflow: "hidden",
  } as const,
  logoWrap: { textAlign: "center", padding: "40px 40px 0" } as const,
  logo: { display: "inline-block", borderRadius: "13px" } as const,
  content: { padding: "28px 40px 40px" } as const,
}
