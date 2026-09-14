---
version: alpha
name: ScoreLead
description: A focused workspace for finding business prospects and managing customer conversations.
colors:
  background: "#09090B"
  text: "#FAFAFA"
  muted: "#A1A1AA"
  border: "#27272A"
  accent: "#34D399"
typography:
  sans:
    fontFamily: "Geist, Geist Fallback, sans-serif"
  mono:
    fontFamily: "Geist Mono, Geist Mono Fallback, monospace"
rounded:
  DEFAULT: "0.625rem"
  md: "0.5rem"
spacing:
  section-gap: "2rem"
components:
  button: {}
  input: {}
  dialog: {}
---

# ScoreLead Design System

## Overview

The authenticated application is a workbench: quiet, compact sections, recognizable controls and direct explanations. The existing Integrations screen is the reference for connection status, permission explanations and account actions. Preserve the existing dark theme; the marketing site has its own expressive register.

Business owners configure integrations and monitor results on desktop and mobile. Supported UI locales are English, Portuguese and Spanish (`i18n/routing.ts`); locale alone does not define a target market. The support assistant's distinguishing element is a real answer preview beside the test question, backed by the selected repository.

## Colors

Runtime tokens remain canonical (Model B): `app/globals.css` variables and its Tailwind `@theme inline` adapter → shared primitives → feature screens. The hex palette above describes the existing zinc/emerald application identity; semantic surfaces and control states use runtime `background`, `foreground`, `muted`, `border`, `primary`, `destructive` and `ring` utilities. The existing locale layout forces dark theme. Use text, icons and labels together for status.

## Typography

Geist carries headings, controls and body copy; Geist Mono is reserved for repository names, branches and file paths. Feature titles use the sibling screen's `text-xl font-semibold`, body `text-sm leading-6`, and helper text `text-xs`. Long paths wrap. No new font family or typography package is introduced.

## Layout

Reuse `ContentWrapper` and the existing page header. Settings and previews use a two-column grid at `lg`, collapsing into natural document flow below it. Sections use `gap-5`/`gap-8` and borders; keep entire forms reachable. Bound only source-file and conversation lists (48/80 Tailwind spacing units) with their own scrolling. The global scrollbar baseline is visible, theme-aware and honors forced colors.

## Elevation & Depth

Use borders and muted backgrounds for grouping. Shared dialogs own overlays, focus trapping and depth. Avoid decorative gradients, nested dashboards and stacked card grids within the integrations form.

## Shapes

Control and panel radii come from `--radius` and the existing `rounded-md` adapter. Status labels use rounded pills with readable text. Dividers group independent tasks.

## Components

`components/ui/button.tsx`, `input.tsx`, `textarea.tsx`, `label.tsx` and `alert-dialog.tsx` own control appearance and semantics. Sonner owns success notifications; errors persist inline. Default loading uses a labeled Lucide spinner. Busy buttons retain labels, reject duplicate requests and are disabled. Textareas use the shared auto-sizing primitive with `resize-none` and useful minimum heights.

Actions are native buttons or links with visible keyboard focus. Disconnect confirms which source stops being used; routine settings saves do not add a confirmation. A dirty form guards navigation and keeps drafts through background status refreshes. Lucide icons are 16–20 px and decorative when adjacent text supplies the name. Reduced motion follows the global media query.

Content uses short, direct action names and the active locale. Display dates through `Intl.DateTimeFormat`. The new flow has no dropdown, date picker, table selection or data chart.

## Do's and Don'ts

- Reuse sibling integration controls and semantic tokens; keep source status and answer preview legible.
- Keep tenant authorization and source lifecycle in the server, documented in `docs/support-assistant.md`.
- Do not invent a new brand palette or expose server setup details in customer flows.
- Do not hide scrollbars, replace labels with icons or imply an answer was sent during preview.
