import { Heading, Hr, Row, Section, Text } from "@react-email/components"
import { email, EmailLayout } from "./layout"

/**
 * Internal notification sent to the team when someone submits the marketing
 * contact form. Reply-to is set to the sender's address by the API route.
 */
export function ContactNotification({
  subject,
  inquiryLabel,
  rows,
  message,
}: {
  subject: string
  inquiryLabel: string
  rows: [string, string][]
  message: string
}) {
  return (
    <EmailLayout preview={`${inquiryLabel}: ${subject}`}>
      <Text style={styles.eyebrow}>New contact form message</Text>
      <Heading style={email.heading}>{subject}</Heading>

      <Section style={styles.details}>
        {rows.map(([label, value]) => (
          <Row key={label} style={styles.row}>
            <td style={styles.label}>{label}</td>
            <td style={styles.value}>{value}</td>
          </Row>
        ))}
      </Section>

      <Hr style={styles.hr} />
      <Text style={styles.messageLabel}>Message</Text>
      <Text style={styles.message}>{message}</Text>
    </EmailLayout>
  )
}

const styles = {
  eyebrow: {
    margin: "0 0 6px",
    fontSize: "12px",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#059669",
  } as const,
  details: { marginTop: "8px" } as const,
  row: { verticalAlign: "top" } as const,
  label: {
    width: "110px",
    padding: "7px 12px 7px 0",
    color: "#71717a",
    fontSize: "13px",
    verticalAlign: "top",
  } as const,
  value: { padding: "7px 0", color: "#27272a", fontSize: "14px" } as const,
  hr: { border: "none", borderTop: "1px solid #e4e4e7", margin: "20px 0 16px" } as const,
  messageLabel: {
    margin: "0 0 8px",
    fontSize: "13px",
    fontWeight: 600,
    color: "#71717a",
  } as const,
  message: {
    margin: 0,
    padding: "18px",
    backgroundColor: "#fafafa",
    border: "1px solid #e4e4e7",
    borderRadius: "8px",
    whiteSpace: "pre-wrap",
    fontSize: "14px",
    lineHeight: "1.65",
    color: "#27272a",
  } as const,
}
