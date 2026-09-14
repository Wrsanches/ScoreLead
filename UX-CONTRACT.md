# ScoreLead application UX contracts

This initial contract records the maintained support workflow and the shared controls it reuses. Business and API behavior is owned by `docs/support-assistant.md`, `lib/business-access.ts`, `lib/plan.ts`, and `lib/support/*`.

## Canonical UI Map

| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
|---|---|---|---|---|
| Form | Shared Input, Textarea, Label; server Zod schemas | API validation and DESIGN.md | Saved settings; transient preview question | Typecheck, browser validation and failure states |
| Scrollbar | app/globals.css | Runtime semantic tokens | Bounded lists; document scrolling | Browser overflow checks |
| Toast | Sonner | Existing Integrations flow | Success toast; persistent inline error | Browser state checks |
| CRUD | Tenant-scoped support routes | docs/support-assistant.md | Save stays in Integrations; disconnect clears source | PostgreSQL integration tests |
| Dialog | Shared AlertDialog | Radix primitive and sibling integrations | Disconnect; unsaved navigation | Keyboard and focus checks |

There are no authored/native select, date or selection-table capabilities in the support feature.

## Support flow

Authorize account → choose repository → save approved paths/instructions → index → preview → explicitly activate. The server verifies account/business/repository access and prevents activation without a current tested index and a connected WhatsApp number. Source removal invalidates new answers immediately; remote cleanup is asynchronous. See `docs/support-assistant.md` for retention, delivery and operational limits.

Settings edits pause activation until saved and retested. Keep drafts through polling or failed requests. A version conflict requires reloading and reviewing rather than silently overwriting another session. Failed operations remain visible inline and offer retry. Authorize/test/activate actions cannot run with unsaved settings.

The recent conversation list is explicitly capped at 30, with 30 messages in the selected conversation. Taking over cancels pending work; resuming only affects future inbound messages. An uncertain send is labeled for review and never automatically repeated. The human contact channel is provided in the business-owned handoff message.

## Interaction and locale

Own form validation (`noValidate`), label fields, focus invalid fields, and preserve input. Use native semantic controls, shared confirmation dialogs, visible focus, disabled/busy labels, and inline status/error text. Render the entire form in document flow on narrow screens. All new feature labels and status/error messages use `supportAssistant` translations in en/pt/es.

## Evidence

`lib/support/policy.test.ts` and `github.test.ts` cover input and repository-access boundaries. `integration.test.ts` exercises real PostgreSQL migrations, tenant isolation, duplicate inbound delivery, pause/resume during generation and uncertain sends with external services mocked. Browser checks cover configuration, preview, responsive flow and recoverable errors using test data, without sending WhatsApp messages.
