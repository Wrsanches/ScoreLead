const SLACK_WEBHOOK_TIMEOUT_MS = 3_000
const SLACK_FIELD_TEXT_LIMIT = 1_900

type SlackText = {
  type: "mrkdwn" | "plain_text"
  text: string
  emoji?: boolean
}

type SlackBlock =
  | {
      type: "header"
      text: SlackText
    }
  | {
      type: "section"
      fields: SlackText[]
    }
  | {
      type: "context"
      elements: SlackText[]
    }

type SlackMessage = {
  text: string
  blocks: SlackBlock[]
}

export type AccountCreatedSlackNotification = {
  name: string | null
  email: string
  createdAt?: Date
}

export type SubscriptionCreatedSlackNotification = {
  accountId: string
  name?: string | null
  email?: string | null
  plan: string
  billingInterval?: string | null
  status: string
  subscribedAt?: Date
}

function getSlackWebhookUrl() {
  const value = process.env.SLACK_WEBHOOK_URL?.trim()
  if (!value) return null

  try {
    const url = new URL(value)
    const isSlackHost =
      url.hostname === "hooks.slack.com" || url.hostname === "hooks.slack-gov.com"
    const isWebhookPath = /^\/services\/[^/]+\/[^/]+\/[^/]+$/.test(url.pathname)

    if (url.protocol !== "https:" || !isSlackHost || !isWebhookPath) {
      console.error("SLACK_WEBHOOK_URL is not a valid Slack Incoming Webhook URL")
      return null
    }

    return url.toString()
  } catch {
    console.error("SLACK_WEBHOOK_URL is not a valid URL")
    return null
  }
}

function escapeMrkdwn(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .slice(0, SLACK_FIELD_TEXT_LIMIT)
}

function field(label: string, value: string | null | undefined): SlackText {
  return {
    type: "mrkdwn",
    text: `*${label}*\n${escapeMrkdwn(value?.trim() || "Not provided")}`,
  }
}

function eventContext(date: Date | undefined): SlackBlock {
  return {
    type: "context",
    elements: [
      {
        type: "mrkdwn",
        text: `ScoreLead • ${date?.toISOString() ?? new Date().toISOString()}`,
      },
    ],
  }
}

function formatBillingInterval(interval: string | null | undefined) {
  if (!interval) return "Not provided"
  if (interval === "month") return "Monthly"
  if (interval === "year") return "Annual"
  return interval.charAt(0).toUpperCase() + interval.slice(1)
}

async function postSlackMessage(message: SlackMessage) {
  const webhookUrl = getSlackWebhookUrl()
  if (!webhookUrl) return false

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message),
      signal: AbortSignal.timeout(SLACK_WEBHOOK_TIMEOUT_MS),
    })

    if (!response.ok) {
      console.error(`Slack notification failed with status ${response.status}`)
      return false
    }

    return true
  } catch {
    // Notifications must never make account creation or billing webhooks fail.
    console.error("Slack notification delivery failed")
    return false
  }
}

export async function notifySlackAccountCreated(
  notification: AccountCreatedSlackNotification,
) {
  return postSlackMessage({
    text: "New ScoreLead account created",
    blocks: [
      {
        type: "header",
        text: { type: "plain_text", text: "👤 New account", emoji: true },
      },
      {
        type: "section",
        fields: [
          field("Name", notification.name),
          field("Email", notification.email),
        ],
      },
      eventContext(notification.createdAt),
    ],
  })
}

export async function notifySlackSubscriptionCreated(
  notification: SubscriptionCreatedSlackNotification,
) {
  const account = notification.name
    ? `${notification.name}${notification.email ? `\n${notification.email}` : ""}`
    : notification.email || notification.accountId

  return postSlackMessage({
    text: "New ScoreLead plan subscription",
    blocks: [
      {
        type: "header",
        text: { type: "plain_text", text: "💳 New subscription", emoji: true },
      },
      {
        type: "section",
        fields: [
          field("Account", account),
          field("Plan", notification.plan),
          field("Billing", formatBillingInterval(notification.billingInterval)),
          field("Status", notification.status),
        ],
      },
      eventContext(notification.subscribedAt),
    ],
  })
}
