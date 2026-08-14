---
name: Veya
description: A privacy-first AI career assistant. The job application as a scheduled journey.
colors:
  paper: "#f1eee6"
  paper-raised: "#e9e5d8"
  paper-deep: "#ded9c7"
  ink: "#17140e"
  ink-secondary: "#575146"
  ink-tertiary: "#6e6858"
  on-ink: "#f1eee6"
  on-ink-muted: "rgba(241, 238, 230, 0.72)"
  rule: "rgba(23, 20, 14, 0.14)"
  rule-strong: "rgba(23, 20, 14, 0.32)"
  on-ink-rule: "rgba(241, 238, 230, 0.2)"
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

Veya presents the job application as a scheduled journey — a warm-paper Swiss departure board where every field is a service leaving the station on time, verified and on its way. The system is strictly monochrome: warm paper and warm ink, hairline rules, tabular data. It is the visual language of trust through precision: nothing glows, nothing shouts, everything is on time and nothing leaves the machine.

Density is calm and editorial: large grotesque display with a serif-italic counterpoint, tabular mono data set in ruled grids, and generous paper. Depth comes from tonal layering and a single soft shadow under the hero board, never from neon or glow. Motion is one authored moment — the live departure board ticking — with everything else still.

**Key Characteristics:**
- Warm monochrome only — paper and ink ramps, never gray, never hue.
- Hairline rules (1px) define structure; borders are lines, not boxes.
- One display voice (Archivo) with an Instrument Serif italic counterpoint for the emotive phrase.
- Tabular IBM Plex Mono reserved for data, times, labels, and line designations.
- Sharp corners (2–3px); no pill shapes, no soft rounded rectangles.
- One authored motion moment: the live departure board.
- Expansive, premium presence: 1400px measure, full-bleed bands, one demo-video slot in the hero.

## Colors

A warm paper-and-ink monochrome: every neutral is a warm-brown derivative, never a pure gray. There is no accent color; hierarchy is expressed entirely through ink weight, fill, and rule strength.

### Neutral
- **Paper** (#f1eee6): page background and canvas.
- **Raised Paper** (#e9e5d8): surfaces, boards, strips — one step off the page.
- **Deep Paper** (#ded9c7): board headers, footers, raised chrome.
- **Ink** (#17140e): text, primary buttons, the inverted privacy panel, the station ticker. Also the effective accent — the logo mark renders in ink on paper and paper on ink.
- **Secondary Ink** (#575146): body secondary text, small labels (≥4.5:1 on all paper surfaces; 5.56:1 on deep paper).
- **Tertiary Ink** (#6e6858): quiet annotations — hero note, stop numbers, footer legal (4.79:1 on paper; never used on raised or deep paper).
- **On-Ink** (#f1eee6): text on the ink panel (15.85:1 inverted).
- **On-Ink Muted** (rgba(241,238,230,0.72)): secondary text on the ink panel (8.58:1 blended).
- **Rule** (rgba(23,20,14,0.14)) / **Strong Rule** (rgba(23,20,14,0.32)): hairlines and borders; on-ink variant rgba(241,238,230,0.2).

### Named Rules

**The Monochrome Rule.** Warm paper and ink only. Any departure from the ramp (a hue, a glow, a pure gray) is a defect, not an accent. Status is communicated by fill vs. outline (solid = verified, dashed = draft), never by color.

**The Inverted Moment Rule.** The ink panel is used exactly once, for privacy — the page's single moment of gravity. Everything else lives on paper.

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

- **Hero:** headline copy left + demo-video slot right (grid 1.1fr / 0.9fr), then the full-width departure board below as the station floor — the board is an instrument, not a sidebar widget. Stacks to one column at ≤900px.
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

### Demo Video Slot
The hero's second column: a 16:9 framed window (raised paper, grid texture) holding a sharp-cornered 68px ink play button, a `WATCH THE DEMO` mono plate, and a `01:42` tag. The button is disabled until the produced demo video is wired in; the slot is the affordance, not the content.

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
