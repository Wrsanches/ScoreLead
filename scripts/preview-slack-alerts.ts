import {
  notifySlackAccountCreated,
  notifySlackSubscriptionCreated,
} from "../lib/slack"

async function main() {
  if (!process.env.SLACK_WEBHOOK_URL) {
    throw new Error("SLACK_WEBHOOK_URL is not configured in .env.local")
  }

  const previewTime = new Date()

  console.log("Sending account-created preview...")
  const accountDelivered = await notifySlackAccountCreated({
    name: "Preview Customer",
    email: "preview@example.com",
    createdAt: previewTime,
  })

  console.log("Sending subscription-created preview...")
  const subscriptionDelivered = await notifySlackSubscriptionCreated({
    accountId: "preview-account",
    name: "Preview Customer",
    email: "preview@example.com",
    plan: "pro",
    billingInterval: "month",
    status: "active",
    subscribedAt: previewTime,
  })

  if (!accountDelivered || !subscriptionDelivered) {
    throw new Error("One or more Slack preview messages could not be delivered")
  }

  console.log("Both Slack preview messages were delivered successfully")
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Slack preview failed")
  process.exitCode = 1
})
