# Repository Guidelines

## Project Structure & Module Organization
- `src/main.tsx` mounts `App.tsx`; `index.css` and `App.css` hold global styles.
- Feature workflows live in `src/features/`; shared UI in `src/components/`; cross-cutting helpers in `src/lib/`.
- Chain configuration sits in `src/chain/`, with shared typings under `src/types/`.
- Assets belong in `src/assets/`, while static files served verbatim go in `public/`. Keep Vite, ESLint, and TypeScript configs at the repo root.

## Build, Test, and Development Commands
- `npm install` installs dependencies; re-run after syncing changes to `package.json`.
- `npm run dev` launches Vite with HMR on `localhost:5173`.
- `npm run build` runs `tsc -b` then produces an optimized Vite bundle.
- `npm run preview` serves the latest build; `npm run lint` runs ESLint across the repo.

## Coding Style & Naming Conventions
- Use TypeScript + React 19 functional components and hooks; avoid class components.
- Keep two-space indentation, single quotes, and trailing commas—ESLint enforces most rules.
- Name components and hooks in PascalCase, utilities in camelCase, and constants in SCREAMING_SNAKE_CASE.
- Prefer feature-rooted imports over deep `../../` chains; promote shared logic into `src/lib/`.

## Testing Guidelines
- No harness yet; adopt Vitest + Testing Library when introducing tests.
- Co-locate specs as `*.test.ts(x)` near the code or centralize them in `src/__tests__/`.
- Mock `viem` RPC calls and env vars (`VITE_CITREA_RPC`, `VITE_USDC`) to keep tests deterministic.
- Note manual verification steps in PRs until automated suites land.

## Commit & Pull Request Guidelines
- Write imperative commit subjects (“Add QR deposit watcher”) and group related edits together.
- Reference touched folders or tickets in the body, and rebase on `main` before pushing.
- Open PRs only after `npm run build` and `npm run lint` pass locally.
- PR descriptions should include a summary, test evidence, UI screenshots if relevant, and any new env/config requirements.

## Environment & Configuration Tips
- Store secrets in `.env.local`; Vite exposes only `VITE_`-prefixed variables.
- Update `src/chain/citrea.ts` when RPC endpoints or contract addresses change and call it out in the PR.
