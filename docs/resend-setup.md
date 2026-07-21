# Resend + Google Workspace setup

The app sends transactional email through Resend from
`ScoreLead <hello@uspostage.io>`. Replies go to the same address in Google
Workspace.

## DNS ownership

Keep the Google Workspace MX records on the root `uspostage.io` domain. They
are what deliver messages for `hello@uspostage.io` to Gmail.

In Resend, add `uspostage.io` with **Sending enabled** and **Receiving
disabled**, then add only the DNS records Resend displays for sending:

- the DKIM records under `._domainkey.uspostage.io`
- the SPF TXT record on `send.uspostage.io`
- the return-path MX record on `send.uspostage.io`

Do not add Resend's inbound MX record to the root domain. That would take
incoming mail away from Google Workspace.

## Application variables

Configure these variables locally and in the deployment environment:

```dotenv
RESEND_API_KEY=re_...
EMAIL_FROM="ScoreLead <hello@uspostage.io>"
EMAIL_REPLY_TO=hello@uspostage.io
NOTIFY_EMAIL=hello@uspostage.io
```

The API key must belong to the Resend account that owns the verified
`uspostage.io` domain. A key from a different Resend account cannot send from
this address.

## Verification

1. Confirm `uspostage.io` is **Verified** in the Resend Domains dashboard.
2. Trigger a signup with a test address and confirm the verification email is
   delivered.
3. Reply to that message and confirm the reply arrives in the Google Workspace
   `hello@uspostage.io` inbox.
4. Submit the waitlist form and confirm the notification arrives at
   `NOTIFY_EMAIL`.
