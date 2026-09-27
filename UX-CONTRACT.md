# ScoreLead integration workflows

This contract covers the integration catalog and Google Analytics, Search Console,
and AI assistant detail pages. Visual context is in [DESIGN.md](DESIGN.md).

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
