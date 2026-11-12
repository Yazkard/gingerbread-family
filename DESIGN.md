---
name: Gingerbread Architect
description: Draw your own gingerbread person; the group gets real 3D-printable cookie cutters.
colors:
  wood-950: "#1a1108"
  wood-900: "#24180c"
  wood-800: "#312112"
  wood-hover: "#3b2817"
  wood-700: "#4a3320"
  wood-600: "#6b4a2e"
  dough-100: "#f4e6cc"
  dough-300: "#d8bf98"
  dough-500: "#a88a62"
  icing: "#ffffff"
  gingerbread: "#d2691e"
  juniper-500: "#c0392b"
  juniper-600: "#9e2a20"
  juniper-700: "#7d1f17"
  danger-text: "#f0a093"
typography:
  display:
    fontFamily: "Kreon, Rockwell, serif"
    fontSize: "clamp(2.75rem, 6vw, 5rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Kreon, Rockwell, serif"
    fontSize: "clamp(1.75rem, 5vw, 2.25rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Kreon, Rockwell, serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Vollkorn, Georgia, serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: "lnum"
  lede:
    fontFamily: "Vollkorn, Georgia, serif"
    fontSize: "1.25rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Vollkorn, Georgia, serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.2
  caption:
    fontFamily: "Vollkorn, Georgia, serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  badge: "5px"
  sm: "6px"
  board: "8px"
  panel: "10px"
  seal: "50%"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  xxl: "48px"
components:
  button:
    backgroundColor: "{colors.wood-800}"
    textColor: "{colors.dough-100}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "0.55em 1.2em"
    height: "44px"
  button-hover:
    backgroundColor: "{colors.wood-hover}"
  button-primary:
    backgroundColor: "{colors.juniper-600}"
    textColor: "{colors.dough-100}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "0.55em 1.2em"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.juniper-700}"
  button-quiet:
    textColor: "{colors.dough-300}"
    rounded: "{rounded.sm}"
    padding: "0.55em 1.2em"
    height: "44px"
  button-quiet-hover:
    backgroundColor: "{colors.wood-800}"
    textColor: "{colors.dough-100}"
  button-danger:
    textColor: "{colors.danger-text}"
    rounded: "{rounded.sm}"
    padding: "0.55em 1.2em"
    height: "44px"
  field:
    backgroundColor: "{colors.wood-950}"
    textColor: "{colors.dough-100}"
    rounded: "{rounded.sm}"
    padding: "0.55em 0.8em"
    height: "44px"
  panel:
    backgroundColor: "{colors.wood-900}"
    rounded: "{rounded.panel}"
    padding: "36px 32px 32px"
  ticket-stub:
    backgroundColor: "{colors.wood-800}"
    textColor: "{colors.dough-100}"
    rounded: "{rounded.sm}"
    height: "60px"
  board:
    backgroundColor: "{colors.wood-950}"
    rounded: "{rounded.board}"
  lang-switch:
    backgroundColor: "{colors.wood-950}"
    textColor: "{colors.dough-500}"
    rounded: "{rounded.board}"
    padding: "3px"
---

# Design System: Gingerbread Architect

## Overview

**Creative North Star: "The Carved Walnut Press"**

The system is drawn from the Lebkuchen/Springerle press mold, the carved wooden ancestor of the cookie cutter. Every surface is walnut; every control is either stamped up out of the board (raised relief) or cut down into it (carved relief). Nothing glows, nothing floats, and there are no gradients standing in for warmth. Warmth comes from the wood ramp, the dough-cream text, and the slab-and-text serif pairing.

The ground is dark because of the use scene: families drawing at home on holiday evenings, where the gingerbread-brown model and white icing strokes need a dark field to read. One juniper-red folk accent marks the single primary action on a screen and the stamped status seals; everything else stays in wood and dough. Carved rosettes appear only as section dividers.

The world carries two expressions. The landing and workbench are the press itself: a hollow cookie-cutter hero and a press-table workbench with carved boards. The organizer flow borrows the Christmas-market order ticket inside the same material: a perforated header band, a tear-off link stub, and notched member stubs with stamped seals.

**Open gaps (not features):** the build renders no carved or intaglio material anywhere (relief is shadow only); the CreateGame order ticket carries no ticket number; the empty drawing canvas is a plain grid rather than a carved board surface. Future surfaces must not copy these as precedent.

**Key Characteristics:**
- Walnut ground (wood-950) with tonal layering up through wood-900 and wood-800; no color other than wood for surfaces.
- Pressed relief as the only depth language: raised for things you press, carved for things you fill or draw into.
- One juniper primary action per screen; juniper otherwise only on seals, slider thumbs, and text selection.
- Kreon 700 for headings, Vollkorn 400 to 700 for everything else, lining numerals throughout.
- Rosettes as dividers, never as texture.

## Colors

A narrow walnut-and-dough palette with one folk-red accent; temperature is uniformly warm.

### Primary
- **Juniper Folk Red** (juniper-600): the fill of the one primary action per screen (start a game, generate the link, finish the drawing, or export in quick-draw mode), the slider thumb, and the text-selection highlight. juniper-700 is its hover and border; juniper-500 is the ink of stamped seals and the native range accent.

### Secondary
- **Baked Gingerbread** (gingerbread): the color of the cookie itself; the cutter rim in the landing hero and the model in the 3D preview. Not a UI color.
- **Royal Icing** (icing): decoration strokes on the cookie and in the hero. Not a UI color.

### Neutral
- **Press Walnut** (wood-950): the page ground, field and board interiors, the carved floor of everything pressed in.
- **Oiled Walnut** (wood-900): panels, tickets, the workbench header.
- **Raised Walnut** (wood-800): buttons, ticket bands and stubs, member stubs, the active language segment.
- **Worn Walnut** (wood-hover): hover fill for raised buttons and member stubs.
- **Grain Line** (wood-700): default 1px borders and rule lines.
- **Deep Grain** (wood-600): button borders, perforation dashes, rosette ink, scrollbar thumb hover.
- **Dough Cream** (dough-100): primary text, headings, focus outline.
- **Toasted Dough** (dough-300): secondary text, labels, ledes.
- **Crust** (dough-500): tertiary text, placeholders, member numbers, the active-toggle border.
- **Danger Blush** (danger-text): error text and destructive-button labels on the dark ground.

### Named Rules
**The One Juniper Rule.** Exactly one `btn-primary` per screen. On a screen where no action is primary (the lobby), there is none; the export stays quiet.

**The Wood-Only Surface Rule.** Surfaces, fields, and boards take only wood tokens. Gingerbread and icing belong to the cookie, not to chrome.

## Typography

**Display Font:** Kreon 700 (with Rockwell, serif)
**Body Font:** Vollkorn, variable 400 to 700 (with Georgia, serif)

Both are self-hosted woff2 split into latin and latin-ext subsets so Polish renders in the real face. `font-synthesis: none` and `lining-nums` are set at the root; numeric columns (member numbers, slider outputs) add `tabular-nums`.

**Character:** A carved slab paired with a German-heritage text serif: the slab reads as cut wood, the text face as a baker's ledger.

### Hierarchy
- **Display** (Kreon 700, clamp(2.75rem, 6vw, 5rem), 1.1, -0.02em): the landing headline only.
- **Headline** (Kreon 700, clamp(1.75rem, 5vw, 2.25rem), 1.1): the single heading of the ticket and lobby boards; the workbench title uses 1.75rem (1.375rem under 768px).
- **Title** (Kreon 700, 1.25rem): canvas, preview, and controls section headings.
- **Body** (Vollkorn 400, 17px, 1.5): running text; ledes step up to 1.25rem / 1.6 capped at 34ch.
- **Label** (Vollkorn 600, 1rem, 1.2): button text, form labels, control-group headings (h3 is set in Vollkorn, not Kreon).
- **Caption** (Vollkorn 400, 0.9375rem): slider labels, stub status, link text; badges drop to 0.8125rem.

### Named Rules
**The Kreon Is Carved Rule.** Kreon appears on h1 to h2, the ticket band, and member numbers. Labels, buttons, and controls are Vollkorn.

## Layout

Single centered objects on a walnut ground. The landing is a two-column grid (max 1120px, 48px gap) that collapses at 820px into one column with the cutter above the copy at 190px wide. CreateGame and the lobby are one centered board (480px and 520px max) with 80px top padding to clear the corner language switcher. The workbench keeps three columns (600px canvas, 600px preview, 280px+ controls; max 1600px, 20px gap) and stacks to a single 640px column under 1400px.

Spacing follows an 8 / 12 / 16 / 24 / 32 / 48 rhythm; boards pad 36 / 32 / 32 (28 / 20 / 24 under 480px). Every interactive target is at least 44px tall (language segments are 38px tall inside a 44px-tall carved track).

## Elevation & Depth

Depth is relief, not lift. The two shadow tokens model a carved board: highlights from a warm light above, dark lips below. Tonal layering does the rest (950 ground, 900 panels, 800 raised parts).

### Shadow Vocabulary
- **Raised relief** (`--relief-raised`: `inset 0 1px 0 rgba(255,236,205,0.09), inset 0 -2px 0 rgba(0,0,0,0.35), 0 2px 5px rgba(0,0,0,0.4)`): buttons, panels, the active language segment. Member stubs use only its two inset layers because the notch mask clips the outer shadow.
- **Carved relief** (`--relief-carved`: `inset 0 2px 5px rgba(0,0,0,0.55), inset 0 -1px 0 rgba(255,236,205,0.06)`): fields, drawing and preview boards, slider tracks, the language-switch track, pressed toggles, and the `:active` state of every button.

### Named Rules
**The Press Rule.** Things you press are raised and sink to carved on `:active` (1px down, suppressed under reduced motion). Things you fill or draw into are carved at rest. Toggles that are on stay carved.

## Shapes

Gently softened corners: 6px on buttons, fields, and stubs; 8px on boards and the language track; 10px on panels and tickets; 5px on badges and language segments. Seals and slider thumbs are full circles. Borders are 1px wood lines; 2px dashes mean a tear line (ticket perforations, the stub's seal end) or an empty state (blank seal). Ticket edges carry 20px half-circle punches at each end of a perforation; member stubs are notched top and bottom with 7px radial masks at the tear line.

## Components

### Buttons
Stamped wood blocks that press into the board.
- **Shape:** gently softened (6px), 1px Deep Grain border, min 44px tall; hero and ticket submits grow to 52px.
- **Default:** Raised Walnut with raised relief, Vollkorn 600.
- **Primary:** Juniper Folk Red fill, juniper-700 border, Dough Cream text; one per screen.
- **Hover / Active / Focus:** hover shifts to Worn Walnut (primary to juniper-700); active swaps to carved relief and drops 1px; focus is a 2px Dough Cream outline at 2px offset. Disabled is 45% opacity.
- **Quiet:** transparent, no relief, Grain Line border, Toasted Dough text; back links and the lobby export.
- **Danger:** transparent with a juniper-700 border and Danger Blush text; clear and remove-photo.
- **Icons:** 18px inline SVG strokes (2px, round caps) from the shared marks set: close, plus, back, download.

### Inputs / Fields
- **Style:** carved into the board: Press Walnut fill, Grain Line border, carved relief, 6px corners, min 44px.
- **Focus:** 2px Dough Cream outline at 1px offset; border steps up to Deep Grain.
- **Sliders:** a 6px carved channel with a 20px Juniper Folk Red thumb ringed in Dough Cream; the value sits in a tabular `output` beside its label.

### Cards / Containers
- **Corner Style:** 10px.
- **Background:** Oiled Walnut, Grain Line border, raised relief.
- **Internal Padding:** 36 / 32 / 32.
- **Boards:** the drawing canvas and 3D preview sit in square carved boards (Press Walnut, 8px, carved relief) with a small bottom-right badge.

### Navigation
- **Language switcher:** a carved two-segment track pinned to the top-right corner; the active segment is raised Walnut with Dough Cream text, inactive segments are Crust at 0.875rem 700, 0.06em tracking.

### Order Ticket
The organizer's form is an order ticket: a Raised Walnut header band carrying the app name in Kreon and a rosette, torn from the body along a punched perforation; a numbered member list; and a tear-off stub at the foot holding the share link.

### Ticket Stubs and Seals
Lobby members are notched stubs: a 58px seal end separated by a dashed tear line, then the name (1.125rem 600) and status. Seals are 24px: **blank** (dashed Crust ring), **inked** (juniper ring, half filled), **sealed** (solid juniper with a juniper-700 inner ring).

### Rosette Rule
A 1px Grain Line rule broken by a 12 to 16px line-drawn rosette in Deep Grain; it separates sections in the lobby and the controls panel.

### Cutter Hero
The landing's authored SVG of a hollow cookie cutter: a thin stepped wall, a lighter outward-only flange, a gingerbread rim, and icing details. A Dough Cream outline draws in once (1.1s), then the cutter settles; under reduced motion the settled state shows with no animation.

## Do's and Don'ts

### Do:
- **Do** use `--relief-raised` for anything pressed and `--relief-carved` for anything filled, drawn into, or toggled on.
- **Do** keep exactly one juniper `btn-primary` per screen, or none.
- **Do** reference wood and dough tokens through custom properties; never hard-code surface hex.
- **Do** keep every target at least 44px and keep focus as a 2px Dough Cream outline.
- **Do** set numbers with lining (and tabular where they align) numerals.
- **Do** honor reduced motion: settled states, no translate on press.

### Don't:
- **Don't** use glowing gradients, spotlight blurs, or floating glossy CTAs; depth is relief only.
- **Don't** use juniper for decoration, links, or secondary actions.
- **Don't** tile rosettes or any mark as background texture.
- **Don't** set buttons or labels in Kreon.
