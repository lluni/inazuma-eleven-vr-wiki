# Digimon Time Stranger Guide & Team Builder

A responsive companion app for **Digimon Time Stranger** that helps players research Digimon data, plan evolution paths, and assemble squads on any device. All game info is fetched on demand from [Grindosaur](https://www.grindosaur.com/en/games/digimon-story-time-stranger/digimon/), parsed with Cheerio, and rendered with modern React tooling.

<img width="1200" alt="image" src="https://github.com/user-attachments/assets/a0c180c9-c426-48ab-a5e0-3549c94fb721" />

---

## Highlights

- 🔍 **Global search** across every Digimon via the Lucene-like navbar search.
- 📋 **Reference sheets**: evolution requirements, attribute stats, personalities, and skills in a clean shadcn/ui layout.
- 🧩 **Team Builder** with drag-and-drop ordering, inline personality/skill selection, evolution path previews, and local-storage persistence.
- 🔁 **Import/Export** your squads as JSON to share or restore later.
- 🌗 **Fully responsive** design tuned for touch navigation and dark theme aesthetics.

---

## Tech Stack

- **React + Vite** (TypeScript)
- **Tailwind CSS v4** with custom shadcn/ui theme tokens
- **shadcn/ui** component primitives
- **Jotai** for state management with localStorage persistence
- **dnd-kit** for drag-and-drop interactions
- **Cheerio** + custom fetchers for Grindosaur scraping

---

## Getting Started

```bash
pnpm install       # install dependencies
pnpm start           # start Vite dev server
```

The dev server prints a local URL (default http://localhost:5173). The app is a single-page application; routing lives in `App.tsx`.

---

## Project Structure

```
src/
  assets/                 # static assets (icons, personalities data)
  components/
    layout/AppLayout.tsx  # shell + sidebar navigation
    navigation/           # navbar search, sidebar controls
    digimon/              # shared Digimon presentation components
    team-builder/         # cards, selectors, DnD board
    ui/                   # local shadcn/ui primitives
  hooks/                  # data fetching and UI hooks
  lib/                    # API clients, helpers, type guards
  pages/                  # routed pages (team builder, overview)
  store/                  # jotai atoms for global state
  App.tsx                 # top-level routes inside AppLayout
  main.tsx                # application bootstrap
  index.css               # Tailwind config + theme tokens
```

Key atoms in `src/store/team-builder-atoms.ts` handle persistence using `atomWithStorage`, keeping the current team across sessions.

---

## Data Flow

1. Pages call `useDigimonDetails` or list hooks, which fetch from Grindosaur and transform the HTML payload with Cheerio.
2. Parsed data is cached in-memory, then rendered by shadcn/ui components.
3. Team Builder changes are mirrored into localStorage so refreshes retain your squad.

---

## Import / Export

- **Export:** Open the floating controls, choose the download icon, and copy the JSON blob.
- **Import:** Open the upload icon, paste a previously exported JSON payload, and confirm. Sanitisation guards against malformed data while preserving existing IDs when possible.

---

## Testing & Quality

- TypeScript strictness (`tsconfig.*`) keeps data contracts honest.
- UI polish leans on Tailwind utility classes; prefer extending shared components before duplicating layouts.
- When adding new features, co-locate state atoms or hooks to stay DRY, and reuse existing cards/pills where possible.

---

## License

MIT
