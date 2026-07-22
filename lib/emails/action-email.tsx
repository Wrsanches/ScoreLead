import { Button, Heading, Link, Section, Text } from "@react-email/components"
import { email, EmailLayout } from "./layout"

/**
 * Transactional "do this one thing" email (verify email, reset password): a
 * heading, a short intro, one emerald CTA button, a small note, and a copyable
 * fallback link for clients that strip the button.
 */
export function ActionEmail({
  preview,
  heading,
  intro,
  ctaLabel,
  url,
  note,
}: {
  preview: string
  heading: string
  intro: string
  ctaLabel: string
  url: string
  note: string
}) {
  const centered = { textAlign: "center" as const }
  return (
    <EmailLayout preview={preview}>
      <Heading style={{ ...email.heading, ...centered }}>{heading}</Heading>
      <Text style={{ ...email.paragraph, ...centered }}>{intro}</Text>
      <Section style={centered}>
        <Button href={url} style={email.button}>
          {ctaLabel}
        </Button>
      </Section>
      <Text
        style={{ ...email.muted, ...centered, marginTop: "28px", marginBottom: "8px" }}
      >
        {note}
      </Text>
      <Text
        style={{
          ...email.muted,
          ...centered,
          fontSize: "12px",
          margin: 0,
          wordBreak: "break-all",
        }}
      >
        If the button does not work, copy and paste this link into your browser:{" "}
        <Link href={url} style={email.link}>
          {url}
        </Link>
      </Text>
    </EmailLayout>
  )
}
