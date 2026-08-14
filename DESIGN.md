---
name: Veya
description: A privacy-first AI career assistant. The job application as a scheduled journey.
colors:
  paper: "#17140e"
  paper-raised: "#1f1a11"
  paper-deep: "#2a2418"
  ink: "#f1eee6"
  ink-secondary: "#a49c87"
  ink-tertiary: "#8a8170"
  on-ink: "#17140e"
  on-ink-muted: "rgba(23, 20, 14, 0.72)"
  rule: "rgba(241, 238, 230, 0.12)"
  rule-strong: "rgba(241, 238, 230, 0.28)"
  on-ink-rule: "rgba(23, 20, 14, 0.2)"
typography:
  display:
    fontFamily: "Archivo, Instrument Sans, sans-serif"
    fontSize: "clamp(2.9rem, 7vw, 5.9rem)"
    fontWeight: 800
    lineHeight: 0.99
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Archivo, Instrument Sans, sans-serif"
    fontSize: "clamp(2rem, 4.4vw, 3.4rem)"
    fontWeight: 760
    lineHeight: 1.04
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Archivo, Instrument Sans, sans-serif"
    fontSize: "19px"
    fontWeight: 680
    lineHeight: 1.35
  body:
    fontFamily: "Archivo, Instrument Sans, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "IBM Plex Mono, ui-monospace, monospace"
    fontSize: "11px"
    fontWeight: 500
    letterSpacing: "0.16em"
    textTransform: "uppercase"
  accent-italic:
    fontFamily: "Instrument Serif, Georgia, serif"
    fontStyle: "italic"
    fontWeight: 400
rounded:
  xs: "2px"
  sm: "3px"
spacing:
  sm: "12px"
  md: "20px"
  lg: "26px"
  xl: "36px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.sm}"
    padding: "14px 28px"
    typography: "{typography.title}"
  button-primary-hover:
    backgroundColor: "#2a261c"
    textColor: "{colors.paper}"
    rounded: "{rounded.sm}"
    padding: "14px 28px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "11px 22px"
    borderColor: "{colors.rule-strong}"
  button-ghost-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.sm}"
    padding: "11px 22px"
  board:
    backgroundColor: "{colors.paper-raised}"
    textColor: "{colors.ink}"
    rounded: "0"
    borderColor: "{colors.rule-strong}"
---

# Design System: Veya

## Overview

**Creative North Star: "The Career Timetable"**

Veya presents the job application as a scheduled journey — a warm-ink Swiss departure board where every field is a service leaving the station on time, verified and on its way. The system is strictly monochrome and inverted: warm black paper and warm bone ink, hairline rules, tabular data. It is the visual language of trust through precision: nothing glows, nothing shouts, everything is on time and nothing leaves the machine.

Density is calm and editorial: large grotesque display with a serif-italic counterpoint, tabular mono data set in ruled grids, and generous black. Depth comes from tonal layering and a single soft shadow under the hero board, never from neon or glow. Motion is one authored moment — the live departure board ticking — with everything else still.

**Key Characteristics:**
- Warm monochrome only, dark-first — inverted paper and ink ramps, never gray, never hue.
- Hairline rules (1px) define structure; borders are lines, not boxes.
- One display voice (Archivo) with an Instrument Serif italic counterpoint for the emotive phrase.
- Tabular IBM Plex Mono reserved for data, times, labels, and line designations.
- Sharp corners (2–3px); no pill shapes, no soft rounded rectangles.
- One authored motion moment: the live departure board.
- Expansive, premium presence: 1400px measure, full-bleed bands, one live product-demo slot in the hero.

## Colors

A warm, inverted monochrome: the page is near-black warm paper with bone ink text; the two gravity bands (privacy, closing) flip to light paper with dark ink. Every neutral is a warm-brown derivative, never a pure gray. There is no accent color; hierarchy is expressed entirely through ink weight, fill, and rule strength. `color-scheme: dark`.

### Neutral
- **Paper** (#17140e): page background and canvas (inverted from the original #f1eee6).
- **Raised Paper** (#1f1a11): surfaces, boards, strips — one step off the page.
- **Deep Paper** (#2a2418): board headers, footers, raised chrome.
- **Ink** (#f1eee6): text, primary buttons, the light privacy panel, the station ticker. Also the effective accent — the logo mark renders in ink on paper and paper on ink.
- **Secondary Ink** (#a49c87): body secondary text, small labels (≥4.5:1 on all paper surfaces; 5.63:1 on deep paper).
- **Tertiary Ink** (#8a8170): quiet annotations — hero note, stop numbers, footer legal (4.77:1 on paper; never used on raised or deep paper).
- **On-Ink** (#17140e): text on the light ink panel (15.85:1 inverted).
- **On-Ink Muted** (rgba(23,20,14,0.72)): secondary text on the light panel (8.58:1 blended).
- **Rule** (rgba(241,238,230,0.12)) / **Strong Rule** (rgba(241,238,230,0.28)): hairlines and borders; on-ink variant rgba(23,20,14,0.2).

### Named Rules

**The Monochrome Rule.** Warm paper and ink only. Any departure from the ramp (a hue, a glow, a pure gray) is a defect, not an accent. Status is communicated by fill vs. outline (solid = verified, dashed = draft), never by color.

**The Inverted Moment Rule.** The light ink panel is used exactly twice, for privacy and the closing band — the page's moments of gravity. Everything else lives on the dark page.

## Typography

**Display Font:** Archivo (800, with Instrument Sans fallback)
**Body Font:** Archivo (400, with Instrument Sans fallback)
**Label/Mono Font:** IBM Plex Mono (data, times, labels, line designations)
**Accent Font:** Instrument Serif (italic only, for the emotive phrase)

**Character:** A precise Swiss grotesque carrying all information, with a single serif-italic counterpoint for the phrase that carries feeling ("already understood."). Mono is a data voice, never a costume.

### Hierarchy
- **Display** (Archivo 800, clamp(2.9rem, 7vw, 5.9rem), line-height 0.99, letter-spacing -0.04em): the hero statement. Max cap 5.9rem (94.4px) ≤ 6rem.
- **Headline** (Archivo 760, clamp(2rem, 4.4vw, 3.4rem), line-height 1.04, letter-spacing -0.03em): section titles.
- **Title** (Archivo 680, 19px): feature and stop names.
- **Body** (Archivo 400, 16px, line-height 1.6, measure 65–75ch for prose): the reading voice, colored secondary ink on paper.
- **Label** (IBM Plex Mono 500, 9.5–12px, letter-spacing 0.14–0.18em, uppercase): line designations, board headers, ticks, hints.
- **Accent Italic** (Instrument Serif italic 400): the emotive phrase inside display headings.

### Named Rules

**The One Voice Rule.** Archivo carries every word of information; the serif italic appears only in the emotive phrase of a display heading. A second information voice is not available.

**The Data Voice Rule.** Times, values, statuses, and labels are set in IBM Plex Mono with tabular numerals. Mono never types a headline and a headline is never set in mono.

## Layout

An expansive 1400px page measure, centered, with `max(32px, (100vw - 1400px) / 2)` gutters everywhere. Sections breathe: clamp(84px, 10vw, 140px) of vertical padding per section, hairline rules between major sections. Anchored sections get `scroll-margin-top: 96px` for the sticky nav.

- **Hero:** headline copy left + live product-demo slot right (grid 1.1fr / 0.9fr), then the full-width departure board below as the station floor — the board is an instrument, not a sidebar widget. Stacks to one column at ≤900px.
- **Trust strip:** four guarantee entries divided by vertical hairlines; two columns at ≤800px, one at ≤420px.
- **Route (how it works):** three stops along a horizontal hairline track; collapses to a vertical track at ≤860px.
- **Features ledger:** a strict 2-column ruled grid (border-top/left on the container, border-bottom/right on each cell); single column at ≤760px.
- **Privacy:** a full-bleed inverted ink band spanning edge-to-edge with a 1400px inner measure.
- **Finale:** a full-bleed deep-paper closing band merging open source (left) and install (right), divided by a vertical hairline; stacks with a horizontal rule at ≤860px.
- **Board:** desktop grid `76px 1fr 1.3fr 48px` (dep / field / value / status); mobile grid `44px 1fr 32px` with the field stacked over the value, headers hidden at ≤640px.
- **Spacing rhythm:** tight groups (gap 10–16px), generous section separation, always more space above a heading than below it. The route, ledger, and finale CTA blocks start at clamp(48px, 6vw, 72px) below their titles.

## Elevation & Depth

Tonal layering is the depth system — paper → raised paper → deep paper build surfaces; the ink panel is the deepest tone and the page's single inversion. Shadows are ambient, not structural, and exist exactly twice, both hero instruments: under the demo slot and the departure board, `box-shadow: 0 1px 0 rgba(23,20,14,0.06), 0 24px 60px -28px rgba(23,20,14,0.35)`. Interactive elements hover by filling (ghost button fills with ink) or by a hairline darkening, never by growing a shadow.

### Named Rules

**The Single Shadow Rule.** Only the two hero instruments (the demo slot and the board) cast shadows. Depth everywhere else is tonal.

## Shapes

Sharp, hairline, mechanical. Corners are near-square: 3px for buttons, icons, status marks, and panels; 2px for tags. Borders are 1px hairlines — solid for structure, dashed for "draft" status, and the board is a ruled instrument, not a rounded card. Status marks are 21px boxes with drawn stroke glyphs (check = verified/filled, dashed-box-plus = draft).

## Components

### Buttons
- **Shape:** sharp corner (3px), no shadow, no pill.
- **Primary:** ink background, paper text, 16px 30px (18px 36px at lg), weight 650. Hover: raised ink (#2a261c) + 1px lift.
- **Ghost:** 1px strong-rule border, ink text, 15px 30px. Hover: fills with ink, text goes paper + 1px lift.
- **Focus:** 2px ink outline, 3px offset. Icons inside buttons are drawn SVG, 18px, same stroke system.

### The Departure Board (signature component)
The station floor — the hero's thesis, full width below the copy. A live departure board where form fields are services leaving the station.
- **Chrome:** deep-paper header with station name + LIVE pulse; ruled column head `DEP / FIELD / VERIFIED VALUE / ST`; foot strip `LOCAL SERVICE · 8 fields detected · 5 verified · 1 drafted · nothing leaves this machine`.
- **Rows:** paper-raised, hairline-divided, generous 15px padding. Column values set in IBM Plex Mono; statuses are boxed stroke glyphs that flip from hollow to solid. Departure times tick with the station clock (one minute every 6s).
- **Motion:** rows reveal staggered, statuses check in, a 1px ink scan line sweeps the board once. The whole board halts under `prefers-reduced-motion` (rows static, scan hidden, clock frozen).
- **Responsive:** on ≤640px the row grid becomes `44px 1fr 32px` with the field stacked over the value and the column head hidden.

### Demo Video Slot — the product, in work
The hero's second column: a 16:10 framed window (raised paper, grid texture) holding a **live animated miniature of the product running**, not a video. Inside, a browser window (jobs.acme.com/apply/staff-engineer, "Staff Engineer — Apply", a 2-column form of the 8 fields) sits beside a docked Veya side panel (local mark + brand, status pills, SCAN FORM, the 8 fields as rows with ✓ / DRAFT / FOR YOU chips, an AI-draft card, and a `5 VERIFIED · 1 DRAFTED · 2 FOR YOU` / `NOTHING LEAVES THIS MACHINE` footer).

All motion is a single 18s CSS keyframe loop (percentages choreograph the same wall-clock offsets every cycle): AI READY pill, a scan beam sweeping the form, SCANNING… → FIELDS MAPPED → READY pills, the rows and form values revealed in a 0.55s stagger, a scan-sweep DONE — 8/8 swap, an AI-draft card that types its line, and the footer — then a subtle opacity dip masks the loop reset. Everything scales with the slot via container-query units, so it stays proportionate from 375px to 1920px. `prefers-reduced-motion` settles to the static, fully-verified state (all rows, READY pill, DONE button, no beam). A `REPLAY` control restarts the loop by remounting the stage. Plate: `THE PRODUCT, IN WORK`; tag: `LIVE`. The same numbers as the board everywhere: 8 fields · 5 verified · 1 drafted · 2 for you.

### Navigation
- Sticky masthead, paper at 88% + backdrop blur, hairline underline. Links are IBM Plex Mono 13px uppercase with a 1px ink underline that scales in from the left on hover. Links hide at ≤720px, leaving the wordmark and CTA.
- Above it, a 10.5px ink station ticker: "VEYA · CAREER SERVICES — LOCAL-ONLY — NO ACCOUNT — BRING YOUR OWN MODEL" with a right-aligned `BOARD READY` pulse.

### Line Labels
The kicker reborn as timetable furniture: an outlined route marker + IBM Plex Mono 11.5px uppercase designation (e.g. "HOW IT WORKS", "THE ENGINE", "PRIVACY, FIRST"). Left-aligned above section titles; centered in the install block.

## Do's and Don'ts

### Do:
- **Do** stay within the warm paper/ink ramp; tint secondary text from ink, never gray.
- **Do** set times, values, and labels in IBM Plex Mono with tabular numerals.
- **Do** use drawn SVG glyphs (one stroke weight) for every icon and status mark.
- **Do** keep the board the only shadowed object and the ink panel the only inversion.
- **Do** hide the board's live behavior under `prefers-reduced-motion`.

### Don't:
- **Don't** introduce an accent color, gradient text, glow, or glass. The monochrome is the brand.
- **Don't** use unicode glyphs or emoji as icons.
- **Don't** use mono as a headline voice, or a serif for information.
- **Don't** render small tertiary text on raised or deep paper (fails contrast); keep it on paper or step it up to secondary ink.
- **Don't** add cards, rounded rectangles, or pill shapes — structure is ruled lines and near-square corners.
