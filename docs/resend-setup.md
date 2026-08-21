# Resend + Google Workspace setup

The app sends transactional email through Resend from
`ScoreLead <hello@scorelead.io>`. Replies go to the same address in Google
Workspace.

## DNS ownership

Keep the Google Workspace MX records on the root `scorelead.io` domain. They
are what deliver messages for `hello@scorelead.io` to Gmail.

In Resend, add `scorelead.io` with **Sending enabled** and **Receiving
disabled**, then add only the DNS records Resend displays for sending:

- the DKIM records under `._domainkey.scorelead.io`
- the SPF TXT record on `send.scorelead.io`
- the return-path MX record on `send.scorelead.io`

Do not add Resend's inbound MX record to the root domain. That would take
incoming mail away from Google Workspace.

## Application variables

Configure these variables locally and in the deployment environment:

```dotenv
RESEND_API_KEY=re_...
EMAIL_FROM="ScoreLead <hello@scorelead.io>"
EMAIL_REPLY_TO=hello@scorelead.io
NOTIFY_EMAIL=hello@scorelead.io
```

The API key must belong to the Resend account that owns the verified
`scorelead.io` domain. A key from a different Resend account cannot send from
this address.

## Verification

1. Confirm `scorelead.io` is **Verified** in the Resend Domains dashboard.
2. Trigger a signup with a test address and confirm the verification email is
   delivered.
3. Reply to that message and confirm the reply arrives in the Google Workspace
   `hello@scorelead.io` inbox.
4. Submit the waitlist form and confirm the notification arrives at
   `NOTIFY_EMAIL`.
