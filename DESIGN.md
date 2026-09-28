---
version: alpha
name: ScoreLead public tools
description: Evidence-focused B2B prospecting tools within ScoreLead's dark marketing canvas.
colors:
  canvas: "#09090b"
  text: "#ffffff"
  printText: "#18181b"
  primary: "oklch(0.765 0.177 163.223)"
typography:
  sans:
    fontFamily: "Geist, sans-serif"
  mono:
    fontFamily: "Geist Mono, monospace"
rounded:
  control: "0.75rem"
  field: "1rem"
spacing:
  pageMax: "72rem"
  mobileGutter: "1.5rem"
omitted:
  - section: components
    reason: Component behavior and canonical owners are recorded in prose; runtime components remain authoritative.
---

# ScoreLead public tools

## Overview

The reference is the existing ScoreLead prospecting dashboard embedded in an
editorial page: quiet fields, visible evidence and an emerald action. This
document records the public tools and comparison surfaces added in the SEO
work, not a redesign of the authenticated application.

Audience: B2B teams defining, researching and prioritizing accounts. EN/PT/ES
are supported locales, not evidence of market size. The register is hybrid:
marketing headings introduce practical forms that favor familiar controls.
`app/globals.css`, Tailwind defaults and the shared components are canonical;
this document mirrors them and generates no tokens. Check drift in rendered
desktop/mobile pages and the frontend audit when changing these surfaces.

## Colors

Use the existing zinc canvas and text hierarchy. Emerald identifies the primary
action and focus. Warnings use amber plus text, never color alone. Public pages
remain dark; printed worksheets use white paper and dark text. Existing glass
surface variables provide borders and depth.

## Typography

Keep Geist for content and Geist Mono for numerical details. Form inputs are
at least 16px; helper text is separate from labels. Use tabular numbers for
scores. Translate labels, examples, validation and download feedback together.

## Layout

Public pages use a 72rem maximum width and 1.5rem mobile gutters. Place tools
after the introduction, before explanatory sections. Forms collapse to one
column on narrow screens. Comparisons use a semantic table on desktop and
labelled product sections on smaller screens, so reading never requires
horizontal scrolling. Both views keep the same facts and source links.

## Elevation & Depth

Reuse `glass-card` and `surface-card`. The tool container is one continuous
working area. Keep ornamental platform images out of the path to the form.

## Shapes

Use the existing rounded-xl actions and rounded-2xl fields. Native sliders,
checkboxes and number inputs keep their familiar interaction behavior.

## Components

`components/marketing-tool.tsx` owns the tool shell, fields and actions;
`components/marketing-comparison.tsx` owns the comparison table. CSV download
is primary where available; print and reset are secondary. Native browser
scrolling and controls are retained. Lucide icons accompany text labels.

Examples are deliberate actions. Empty weights yield an explained invalid
state and disable export; disqualifiers override priority. Reset and export
have live status messages. Worksheet entries are local and transient; explain
that before navigation. Exported CSVs contain values, not executable formulas.
Printing preserves full multiline text and removes surrounding marketing copy.
Worksheet textareas grow with content in supporting browsers and retain native
scrolling elsewhere. Result panels show the score, decision and total weight;
checked disqualifiers are described in text and marked with amber. Related
article tools use the existing surface material and a full-width link target.

Use native keyboard interactions and visible focus. Reuse the global
reduced-motion policy. No asynchronous loading state is needed for these local
calculations. Comparison suitability is editorial assessment, while capability
claims link to vendor documentation. Customer-reported metrics retain their
source and limitations.

## Do's and Don'ts

- Do show the formula, weights, conditions and result together.
- Do keep real labels and text feedback on every input state.
- Do preserve locale links and cite comparison facts.
- Don't imitate a spreadsheet grid when six readable criteria fields suffice.
- Don't present illustrative scores as purchase probabilities or customer results.

## Authenticated integration surfaces

The integration catalog and detail pages inherit the existing authenticated
application rather than the public marketing layout above. Runtime ownership
remains `app/globals.css` → Tailwind utilities → `ContentWrapper`, `PageHeader`,
`SectionCard`, `IntegrationCard` and shared `Button`/`AlertDialog` components.
No new theme tokens are introduced.

Use the Instagram integration as the sibling reference: one integration per
page, a quiet account surface, and setup instructions in a 20rem right column
that stacks below the settings on mobile. Provider identity belongs in the
rounded icon tile; emerald denotes actions and successful connections, amber
flags reconnection, and neutral text carries help. GA4, Search Console and AI
assistant catalog cards use the same card owner as WhatsApp and Instagram.
Property selection uses a subtle emerald border and wash, not a second card
style. Preserve the existing light/dark utility pairs and Geist typography.
See `UX-CONTRACT.md` for navigation and behavior.
