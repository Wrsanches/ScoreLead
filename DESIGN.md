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
Property selection uses compact, equal-width checkbox cards in an auto-wrapping
grid, with a subtle emerald border and wash for selection. Long names and IDs
wrap inside each card; narrow containers collapse naturally to one column.
Preserve the existing light/dark utility pairs and Geist typography.
See `UX-CONTRACT.md` for navigation and behavior.

## Homepage content showcase

The home page introduces the content calendar before pricing. Its heading,
copy and signup action use the existing marketing type scale, 72rem content
width and zinc/emerald palette. Match the AI/Pipeline sections with left-aligned
white headings (weight 538, optical size 28), responsive 18px supporting copy,
and the hero's white rounded-xl signup action. Color belongs primarily to the
post artwork; the Instagram label uses the full-color brand logo at 20px,
matching the Google provider marks in the reporting section.
`components/content-showcase.tsx` and its CSS
module own the illustrative Instagram post strip shared with the calendar
empty state; keep the fictional brands and aligned cards consistent in both
contexts. The strip runs continuously without a caption, playback control or
hover pause. Reduced motion stops the strip.
The five fictional brands use generated marks from `public/images/showcase/`,
matched to each post's existing palette. Keep the same mark in the 24px circular
profile avatar and 16px rounded post signature. Assets are pre-sized 128px WebP
files; their generation prompts and source images live in `output/imagegen/`.
New copy follows the existing EN/PT/ES locale.

## Homepage reporting examples

`components/reporting-section.tsx` presents the read-only GA4/Search Console
MCP connection after the content showcase, before pricing. Follow the same
left-aligned heading, Geist scale, 72rem shell and white signup action. A
question selector sits beside one glass report preview, stacking on mobile.
Emerald and a check identify the selected question; preserve visible keyboard
focus. All examples reserve the same panel geometry. Use the existing Google
logo assets, explicitly illustrative data, and localized EN/PT/ES questions.
Sources, period and metric limitations stay with each answer. Search clicks
and GA4 sessions are distinct; the demo neither requests reports nor claims
to identify causation or qualified leads.
`reporting-visuals.tsx` adds a source-to-assistant diagram and question-driven
SVG charts. Highlight the relevant Google source paths; keep both supported
assistants visible without implying that either is currently connected.
Traffic and search bars use a shared zero baseline within each chart. Page
comparisons use a labeled −20% to +20% scale with separate clicks/sessions
series. Retain the equivalent semantic table for screen readers. Chart entry
is a brief fade, disabled for reduced motion; questions never auto-advance.

## Public website on phones and tablets

Keep the same Geist, zinc and emerald identity at every width. The shared
`Navbar` uses its full link row only from 1280px, in a 72rem container. Below
that, keep the brand and a 44px menu control in the toolbar; put links
and account actions underneath inside the same surface. The language switcher
stays in the toolbar on tablets and moves inside the menu below 768px. Bound the open menu
to the available dynamic viewport and allow scrolling in landscape. Escape
returns focus to the trigger; outside clicks and navigation close the menu.

`marketing-section` in `app/globals.css` owns homepage section spacing:
clamp(4rem, 10vw, 10rem). Anchor headings clear the fixed header. Public CTAs
have 44px minimum height at touch widths, with natural wrapping and 24px
page gutters. The homepage reuses the full `DashboardPreview` at every width.
`hero-dashboard.module.css` reserves a 16:9 frame below 1280px and scales the
1600px canvas to its measured container width; desktop keeps its original
perspective treatment. A readable pipeline stage list appears below 1024px.
Pricing comparisons and article decision tables become labelled stacked
rows on phones, retaining every value. Footer links use touch-friendly rows,
and contact inputs stay at 16px on tablets to avoid focus zoom.

Check shared public templates (home, pricing, feature, use case, tool,
comparison, case study, blog, contact and legal) at 320/390px, 768/1024px and
1280px. These browser checks are not a claim of physical-device coverage.
