# El Camino del Guerrero — Codebase Guide

A martial-arts-themed Spanish learning PWA for kids ages 6–18. Built with React 19 + TypeScript + Vite. Offline-capable via a service worker. All data is stored client-side in IndexedDB (Dexie).

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI | React 19, TypeScript, Tailwind CSS v4 |
| Routing | React Router v7 |
| State | Zustand v5 |
| Persistence | Dexie (IndexedDB) — fully offline, no backend |
| Animation | Framer Motion |
| Audio playback | Howler.js |
| Text-to-speech | `@mintplex-labs/piper-tts-web` (runs in-browser) |
| Speech recognition | `@xenova/transformers` (Whisper, runs in-browser) |
| Avatars | DiceBear |
| PWA | vite-plugin-pwa + Workbox |

---

## Project Structure

```
src/
  App.tsx                  # Route definitions only
  main.tsx                 # App entry point
  types.ts                 # ALL shared TypeScript types — start here
  db.ts                    # Dexie database schema (3 tables)
  index.css                # Global styles + Tailwind

  pages/
    DojoEntrance.tsx        # Home screen — profile picker
    NewWarrior.tsx          # Onboarding — create profile
    EditWarrior.tsx         # Edit existing profile
    HowItWorks.tsx          # Parent/student explainer
    PlacementQuiz.tsx       # Placement test for new users
    WarriorsPath.tsx        # Main curriculum map (unit grid)
    TrainingSession.tsx     # Core exercise loop
    BeltCeremony.tsx        # End-of-dojo boss test + belt promotion

  components/ui/
    BeltBadge.tsx           # Renders a belt color badge
    BeltRack.tsx            # Full belt progression display
    ComboCounter.tsx        # Combo streak animation
    DojoButton.tsx          # Styled primary button
    FacePicker.tsx          # Avatar face selector
    KiCounter.tsx           # Ki points display
    OptionCard.tsx          # Multiple-choice answer card
    ProgressBar.tsx         # Session/unit progress bar
    SpeechBubble.tsx        # Sensei dialogue bubble
    VoxelConfetti.tsx       # Celebration animation
    WarriorAvatar.tsx       # Full avatar renderer (DiceBear)

  data/
    curriculum.ts           # ALL content: Dojo 1 techniques + exercises (A1 level)
    senseiPhrases.ts        # Sensei encouragement phrases by outcome

  lib/
    adaptiveDifficulty.ts   # Adjusts exercise mix based on skill accuracy
    audio.ts                # Howler audio helpers
    avatarUtils.ts          # Avatar seed/config helpers
    exerciseGenerator.ts    # Procedurally generates exercises from techniques
    kataWords.ts            # Kata (word shuffle) tile logic
    scoreStars.ts           # Star rating from accuracy %
    spacedRepetition.ts     # SM-2-like spaced repetition (strength decay model)
    speechRecognition.ts    # Whisper-based speech input
    tts.ts                  # Piper TTS wrapper
    whisperWorker.ts        # Web Worker for Whisper inference

  stores/
    gameStore.ts            # Zustand store — profiles, session state, DB actions
```

---

## Routes

| Path | Page | Purpose |
|---|---|---|
| `/` | DojoEntrance | Profile picker / home |
| `/new-warrior` | NewWarrior | Create profile |
| `/edit-warrior/:id` | EditWarrior | Edit profile |
| `/how-it-works` | HowItWorks | Explainer for parents |
| `/placement` | PlacementQuiz | Placement test |
| `/path` | WarriorsPath | Curriculum map |
| `/train/:unitId` | TrainingSession | Exercise session |
| `/belt-test/:dojoId` | BeltCeremony | Boss test + belt award |

---

## Database Schema (Dexie / IndexedDB)

Database name: `SpanishKidsDojo`

**`profiles`** — one row per learner  
Indexed on: `id` (PK, auto-increment), `name`

**`techniqueProgress`** — spaced repetition state per vocabulary item  
Indexed on: `id`, `profileId`, `techniqueId`, `[profileId+techniqueId]` (compound), `nextReview`

**`sessionResults`** — one row per completed training session  
Indexed on: `id`, `profileId`, `unitId`, `completedAt`

---

## Core Concepts

### Warrior Profile (`WarriorProfile`)
Each learner has a profile with: avatar (head/hair/skin/gi/accessories), current belt + dojo + unit + stripe, ki points, coins, streak, and placement status. Multiple profiles share one device (family use case).

### Age Groups
| Group | Ages | Behavior |
|---|---|---|
| `junior` | ≤ 12 | 5 min sessions, 3 new words, no grammar notes, drag-and-drop, encouraging tone |
| `warrior` | 13–15 | 6 min, 4 new words, coaching tone |
| `elite` | 16–18 | 8 min, 5 new words, grammar notes shown |
| `master` | 19+ | 10 min, peer tone |

### Belts & Progression
13 belts: white → yellow → orange → green → blue → purple → brown → red → black (1st–5th dan). Each unit maps to a belt. Completing all units in a dojo triggers `BeltCeremony`.

### Exercise Types
| Type | In-app name | Description |
|---|---|---|
| `strike` | Picture Match | Tap the image matching the word |
| `kata` | Word Shuffle | Drag tiles into correct order |
| `block` | Fill the Blank | Choose the missing word |
| `sense` | Listen and Tap | Hear audio, pick matching answer |
| `kiai` | Speak It | Say the phrase aloud (Whisper) |
| `counter` | Translate It | Multiple-choice translation |
| `speed` | Tap the Pairs | Match Spanish ↔ English pairs |
| `mission` | Story Builder | Fill blanks in a short story |

### Spaced Repetition (`spacedRepetition.ts`)
Custom decay model (not pure SM-2). Each technique has a `strength` (0–1) that decays over time using a half-life formula. Correct answers add +0.15 strength; incorrect subtract -0.25. Next review interval grows exponentially with review count. `getDueReviews()` fetches overdue items; `getWeakTechniques()` finds lowest-strength items.

### Adaptive Difficulty (`adaptiveDifficulty.ts`)
After each session, skill accuracy (vocabulary/grammar/listening/speaking) is evaluated against HIGH (90%) and LOW (60%) thresholds. The exercise mix for the next session is adjusted: weak areas get more practice, strong areas get harder types. Age-group-specific session config is also applied.

---

## Curriculum Structure

**Dojo 1 — "El Dojo" (A1) — COMPLETE**  
13 units, white through red belt. ~250 vocabulary items, 100+ exercises, static content in `src/data/curriculum.ts`.

**Dojos 2–4 — Planned**  
See `curriculum-plan.md` in the El Camino project folder for the full 4-year roadmap (A1+/A2, A2/B1, B1/B2), unit-by-unit vocabulary lists, grammar targets, and implementation roadmap.

Curriculum content is currently static (defined in code). The data model supports dynamic content but the loader is not yet built.

---

## Key Patterns

- **No backend.** All state lives in IndexedDB. There is no API, auth, or server sync.
- **Exercise generation.** `exerciseGenerator.ts` can procedurally generate exercises from any `Technique[]`, enabling future dojos without hand-authoring every exercise.
- **TTS + Whisper run in-browser.** Both are heavy; they initialize lazily. Whisper runs in a Web Worker (`whisperWorker.ts`) to avoid blocking the UI.
- **Session state is ephemeral.** `gameStore` holds live session counters (ki, combo, accuracy) that reset on `resetSession()`. Persisted results are written to `sessionResults` at session end.
- **Active profile persisted to localStorage** by ID only; full profile loaded from Dexie on app start.

---

## Development

```bash
npm install
npm run dev        # start dev server
npm run build      # TypeScript check + Vite build
npm run lint       # ESLint
npm run preview    # preview production build
```

Audio files are expected at `/audio/vocab/<techniqueId>.mp3`. The `generate-audio.sh` script handles bulk generation.
