# El Camino del Guerrero — Spanish for Kids (React PWA)

A martial-arts-themed Spanish learning app for the whole family. Earn belt ranks from White Belt to Black Belt Maestro through gamified training sessions, belt tests, and spaced repetition.

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173 on any device. On iPad, tap Share → Add to Home Screen for a full-screen native feel.

## Features

- **Multi-user profiles** — up to 6 warriors on one device
- **Gamified placement quiz** — skip belts you already know (randomized question pools per run)
- **Procedural + hand-crafted exercises** — each training session mixes ~30% authored drills with generated items from the unit vocabulary pool, so replays feel different
- **8 exercise types** — Strike, Kata, Block, Sense, Kiai (voice), Counter, Speed Drill, Mission
- **Per-unit best score** — stars (80% / 90% / 96%) and “Retrain” on the path; cooldown shows “New best!” when you beat your record
- **Spaced repetition** — techniques decay and get scheduled for review (stable technique ids on generated items)
- **Adaptive difficulty** — Sensei adjusts training based on your accuracy
- **Belt progression** — 13 ranks from White Belt to 5th Dan Maestro
- **Works offline** — PWA with service worker caching
- **Voice recognition** — Web Speech API for pronunciation drills

## Generate Audio (optional)

Requires macOS with the Paulina Spanish voice installed:

```bash
npm run generate-audio
```

## Tech Stack

React 19, TypeScript, Vite, Tailwind CSS, Framer Motion, Dexie.js (IndexedDB), Howler.js, Zustand, React Router, vite-plugin-pwa

## Project Structure

```
src/
  components/ui/   — Reusable UI components (DojoButton, BeltBadge, etc.)
  pages/           — Route pages (DojoEntrance, WarriorsPath, TrainingSession, etc.)
  stores/          — Zustand stores
  data/            — Curriculum seed data and Sensei phrases
  lib/             — Core algorithms (spaced repetition, adaptive difficulty, speech)
  types.ts         — All TypeScript types
  db.ts            — Dexie.js database schema
public/audio/      — Audio assets (generated or manually placed)
scripts/           — Audio generation scripts
docs/              — Asset pipeline documentation
```
