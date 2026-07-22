import { Heading, Text } from "@react-email/components"
import { email, EmailLayout } from "./layout"

/**
 * Internal notification sent to the team whenever someone joins the waitlist.
 */
export function WaitlistNotification({
  signupEmail,
  date,
}: {
  signupEmail: string
  date: string
}) {
  return (
    <EmailLayout preview={`New waitlist signup: ${signupEmail}`}>
      <Text style={styles.eyebrow}>Waitlist</Text>
      <Heading style={email.heading}>New signup</Heading>
      <Text style={{ ...email.paragraph, marginBottom: "4px" }}>
        <strong>{signupEmail}</strong>
      </Text>
      <Text style={email.muted}>{date}</Text>
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
}
