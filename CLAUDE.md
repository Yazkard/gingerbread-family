# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start Vite dev server
npm run build        # TypeScript compile + Vite build
npm run lint         # ESLint checks
npm run preview      # Preview production build
npm test             # Run tests (Vitest)
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
docker-compose up    # Build and run via Docker + Nginx (port 8100)
```

Tests are in `src/**/*.test.ts`, run with Vitest (`environment: node`). Currently covers pure utility functions in `extrusionUtils.ts`: `isPointNear`, `calculateCentroid`, `normalizeStrokes`, `isPointInPolygon`, `clipPathToPolygon`, `getOffsetPoints`, `resolvePathSelfIntersections`, and the Three.js geometry builders.

## Architecture

**Gingerbread Architect** is a collaborative web app for designing and exporting 3D-printable gingerbread characters (3MF format). Users draw 2D shapes on a canvas; these are converted to 3D geometry and can be exported.

**Routing (Wouter):**
- `/` → Landing (Create Game or Quick Draw)
- `/create` → CreateGame (name the game, add family members)
- `/lobby/:gameId` → GameLobby (member selection, bulk ZIP export)
- `/create/:gameId/:memberName` or `/create/quick` → ModelCreator

**ModelCreator flow:**
1. `DrawingCanvas` — 500×500px canvas where the user draws strokes
2. `Viewer3D` — React Three Fiber scene previewing the 3D model live
3. `Controls` — color picker, undo, clear, export buttons

**Geometry pipeline** (`src/pages/model-creator/utils/`):
- `geometryBuilder.ts` — entry point; converts `Stroke[]` → Three.js `BufferGeometry`. The **first stroke** becomes the base body (wall + outer flange + inner fill + rim). Subsequent strokes become detail decorations clipped to the base interior.
- `extrusionUtils.ts` — polygon offsetting, self-intersection detection/repair, Sutherland–Hodgman clipping, triangulation via Earcut.
- `export3MF.ts` — serializes geometries to 3MF XML, packages into ZIP via JSZip.

**Fixed geometry constants:**
- Canvas → 3D scale: `0.2` (500px = 100mm)
- Extrusion depth: `4mm`, Wall width: `1mm`, Outer flange: `3mm`, Inner gap: `2mm`

**Firebase** (`src/lib/firebase.ts`):
- Firestore stores games under `games/{gameId}` with `members[]` and `projects` map keyed by member name.
- Each project holds `strokes`, `color`, `status`, and `updatedAt`.
- Real-time sync via `onSnapshot`; each member edits their own sub-document independently.
- If changes in database structure are needed communicate it to me

**Tech stack:** React 19, TypeScript, Vite (rolldown), Three.js + React Three Fiber + Drei, Wouter, Firebase Firestore, JSZip, Earcut.

**Env vars** (`.env`, not committed):
- `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`