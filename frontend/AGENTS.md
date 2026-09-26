# AGENTS.md — frontend

Read the root `AGENTS.md` first for the whole-project picture. This file is frontend-only
conventions. Owner: **Darsh**.

## Stack

- Vite + React, plain JavaScript (no TypeScript).
- 3D: `@react-three/fiber` (Three.js in React) + `@react-three/drei` (helpers: `OrbitControls`,
  `Html`, `useGLTF`, etc.). Keep `<Canvas>` scenes in `src/scenes/`; reusable 3D pieces
  (meshes, lights, the soil-health visualization) go in `src/components/scene/`.
- Animation: GSAP via `@gsap/react`'s `useGSAP` hook — always clean up timelines in the hook's
  return/cleanup, never leave a raw `gsap.timeline()` running outside a component lifecycle.
- Styling: Tailwind CSS utility classes; avoid custom CSS files unless Tailwind genuinely can't
  express it.
- State: Zustand. One store per domain (`useUserStore`, `useFarmStore`,
  `useRecommendationStore`) in `src/store/` — don't reach into another page's local state.
- Icons: `lucide-react` only, for a consistent icon set.

## Folder map

```
src/
├── components/
│   ├── ui/        # generic building blocks (Button, Card, Input) — no page-specific logic
│   ├── layout/     # Navbar, Sidebar, Footer
│   ├── forms/      # SoilInputForm, CropSelector, FieldMapPicker
│   └── scene/      # 3D building blocks used inside a <Canvas>
├── scenes/          # full <Canvas> compositions (one per visualization)
├── animations/      # useGSAP wrapper hooks, shared timelines
├── pages/           # one file per route: Landing, Dashboard, SoilInput, Recommendation, History, Auth/
├── store/           # Zustand stores
├── services/        # api.js — all backend calls live here, nowhere else
└── hooks/, utils/, styles/
```

## Conventions

- All backend calls go through `src/services/api.js` — components never call `fetch`/`axios`
  directly, so the base URL, auth header, and error handling live in one place.
- The backend's response shape for farms/fields/recommendations is defined in
  `docs/api-contract.md` — check it (and Josh) before assuming a field name.
- Keep 3D/animation-heavy components lazy-loaded (`React.lazy`) where reasonable — this app
  needs to stay usable on low-end devices per the PRD's NFR2.
- Component files: PascalCase (`SoilInputForm.jsx`); hooks: camelCase starting with `use`.

## Commands

```bash
npm install
npm run dev       # Vite dev server
npm run build      # production build
```
