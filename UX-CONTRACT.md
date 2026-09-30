# ScoreLead integration workflows

This contract covers the integration catalog and Google Analytics, Search Console,
AI assistant and GitHub detail pages, and the WhatsApp support inbox.
Visual context is in [DESIGN.md](DESIGN.md).

## Canonical UI map

| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
| --- | --- | --- | --- | --- |
| Navigation / CRUD | `PageHeader`, `ContentWrapper`, `reportingIntegrationPath` | Integration routes and Google callback state | One provider per detail page; save stays on detail | Callback integration tests; browser navigation |
| Form | `ConnectionEditor`, shared `Button`, native labelled checkboxes | Reporting resource API and version check | Multiple accounts, up to 100 properties each | Browser selection, save and failure recovery |
| Toast | Existing Sonner provider | Shared application feedback | Successful save/copy/revoke; inline actionable errors | Browser feedback |
| Confirmation | Shared Radix `AlertDialog` | Existing reporting disconnect/revoke contracts | Explicit destructive action and Cancel | Keyboard, cancel and failure checks |
| Scrollbar | `app/globals.css` | Existing global runtime CSS | Natural page height; bounded property list and command overflow | Narrow viewport and keyboard scrolling |

## Navigation and state

Each catalog card opens only its integration: `/google-analytics`,
`/search-console`, or `/ai-assistants`, below `/admin/integrations`.
Breadcrumbs return to the integration catalog. The bot card means AI assistant
reporting access. OAuth success and denial return to the initiating provider's
detail page, retaining locale and validated business selection. Legacy Google
bookmarks continue to resolve, including `#assistants`.

Use the Instagram detail layout: account/settings area and a 20rem setup sidebar,
stacked on smaller screens. Catalog cards share `IntegrationCard`. Loading has a
labelled spinner; errors remain visible with an explicit retry. Empty states
explain the next action. Never show failed data loads as successful connections.

Save selection is explicit and version-checked. Preserve entered selection when
saving fails. The shared reporting navigation guard confirms before discarding
unsaved selection through breadcrumbs, links or reconnect, and warns on page unload. Reconnect, disconnect and assistant revocation retain the existing
server permission model; generic admin read-only flags do not replace reporting's
explicit owner/assigned-admin authorization. Disconnect and revoke require the
existing app-owned confirmation. OAuth grants and access duration are unchanged.

## Locale and accessibility

Translate new labels and help in EN/PT/ES; use the locale formatter for dates.
Use shared semantic buttons, navigation links, labelled native checkboxes and
Radix confirmation dialogs. Retain visible focus, status/alert announcements,
reduced-motion preferences, and readable light/dark color pairs. No new select,
date, table or token system is introduced by these integration pages.

## Support conversations and GitHub

`/admin/inbox` owns support conversations; `/admin/integrations/github` owns
the repository connection for the selected business. Legacy business routes
reuse the same components. Conversation selection, pending/replied/all filter
and pagination are URL state; switching businesses removes the conversation
selection. Lists are paginated at 25 and message history at 30 with an explicit
older-messages action. Polling preserves edited reply, task and transcript
drafts. The shared navigation guard uses generic unsaved-edits copy for these
forms and provider-specific copy for Google property selection.

GitHub's primary entry is Connect with GitHub, followed by an authorized
account/organization and a paginated repository radio list. Login authorization
alone never claims a repository is connected: Connect repository explicitly
saves the choice and synchronizes its README when available. Show a grant-access
action and refresh for missing repositories, disable archived/read-only choices,
and preserve the selected repository and form edits after API failure. Manual
token connections remain compatible under Advanced options. AI instructions
are optional; code lookup requires only the repository connection. Optional
reference documents and their sync timestamp live under Advanced options, with
existing selections retained. Codex workflow setup has a separate optional
section and identifies its API-key requirement. One form saves all settings;
invalid fields open their containing disclosure before receiving focus. An absent
server App configuration disables login with explanatory copy. State returns
to the initiating locale and validated business; tokens are never URL state.

Marking a conversation replied is an explicit manual action against the last
message the owner saw. A newer inbound message reopens it; stale status/reply
writes return a recoverable conflict. Copying a draft neither sends it nor
marks it replied. Support never sends a WhatsApp reply automatically. Audio
has authenticated playback, automatic transcription and a manual correction
fallback. Missing or unsupported media is visibly uncertain to both owner and
model. Transcripts remain available when Meta playback expires.

AI classifies and proposes; owner/admin review approves or rejects tasks.
Rejection includes a reason and queues a revised reply. GitHub publication and
Codex dispatch are separate explicit actions after approval. Publish only the
reviewed requirements, not the raw conversation or phone number. An uncertain
publication offers issue reconciliation instead of retrying creation; an
uncertain dispatch links to Actions and blocks duplicate dispatch. A requested
workflow is never presented as completed implementation. GitHub's token stays
encrypted on the server and is never returned to the browser. Context sync
uses only the owner's selected documentation files, with the sync timestamp
visible beside them. All new states and controls are localized in EN/PT/ES.
