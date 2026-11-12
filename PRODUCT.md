# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Families and friend groups organizing a group gingerbread-cutter night, including groups who have never used the app before (not limited to the author's own circle). One organizer sets up the game and shares a link; each member opens their own link, on their own device, at their own time, to draw their gingerbread-person shape and decorations.

## Product Purpose

Gingerbread Architect lets a group collaboratively design personal gingerbread-cookie shapes online, then exports them as real 3D-printable cookie cutters (3MF), so the group can later bake with cutters shaped like each person's own design. Success is every member completing a drawing they're happy with, and the organizer exporting a working batch of 3D-printable cutters.

## Positioning

Not a generic "draw a shape, get a 3D model" toy. The mechanism is: each person remotely designs their *own* gingerbread-person outline + decorations without needing any 3D or CAD skill; the outputs are dimensionally correct (mm-accurate) cookie-cutter geometry an organizer can 3D-print and use in a real baking session. A generic 3D editor could not replicate the baked-in cookie-cutter manufacturing constraints or the multiplayer "everyone designs their own, one person collects and prints" flow.

## Operating Context

- Organizer creates a game (name + member list) and gets a shareable link per game.
- Each member opens the link, picks their name from the lobby, and draws on a 2D canvas; a live 3D preview shows the extruded result as they work.
- Members can save progress and resume later, or mark their design "completed."
- The organizer can bulk-export all members' completed designs as a ZIP of 3MF files for 3D printing.
- Real-time sync is via Firestore; each member's project is an independent sub-document so concurrent editing across the group doesn't conflict.
- The actual downstream step (3D printing cookie cutters, then baking) happens outside the app.

## Capabilities and Constraints

- Fixed, mm-accurate geometry constants tune the output for real 3D-printed cookie cutters and must not be changed casually: canvas→3D scale 0.2 (500px = 100mm), extrusion depth 4mm, wall width 1mm, outer flange 3mm, inner gap 2mm.
- The first stroke a member draws is always their outline (becomes the base cutter body); later strokes are interior decoration detail clipped to that outline.
- Export format is 3MF (not STL or other formats) — this is a deliberate choice for the 3D-printing pipeline already in use.
- Bilingual: Polish and English, switchable per visitor, must stay fully covered (not a partial/placeholder translation).
- Firebase Firestore is the only backend; no user accounts — identity is just "which member name did you pick in the lobby," so the shareable link itself is the access control.

## Brand Commitments

Name: "Gingerbread Architect" (English) / app also referred to with "Piernikowa Rodzina" (Polish, "Gingerbread Family") framing in existing copy. Dark, warm "artisan bakery" palette (deep browns, gold, cream) is an established starting identity, not yet confirmed as binding — open for the redesign to evaluate and evolve.

## Evidence on Hand

No real customer testimonials, case studies, or press exist; none should be fabricated. Existing UI copy (PL/EN) is real product copy, not placeholder — treat it as content truth unless the user asks to change it.

## Product Principles

1. Zero 3D/CAD skill required — the entire authoring experience is a 2D outline-and-decorate drawing interaction.
2. Output must stay dimensionally honest to the real-world printable cookie cutter, never purely decorative 3D.
3. Each member's design is theirs alone to make and own; the group mechanic is collection and export, not co-editing a single shape.
4. The app must read as a warm, craft/baking-adjacent experience, not a generic CAD or SaaS tool — but the current glow/gradient execution of that feeling is itself under review in this redesign, not a locked requirement.
5. Works for first-time groups, not just people who already know the app — first-run clarity (what to draw, what happens next, what the organizer still needs to do) matters as much as the drawing tool itself.

## Accessibility & Inclusion

No formal standard was mandated by the user; treat WCAG AA as the working bar (already partially unmet per the audit — contrast and touch-target fixes are in scope for this redesign, not just the standalone audit).
