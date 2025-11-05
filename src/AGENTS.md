# Repository Guidelines

## Project Structure & Module Organization
- `src/` contains all application code; `main.tsx` mounts `App.tsx`, while global styles live in `index.css` and `App.css`.
- Reusable UI sits in `src/components/` (for example `DepositQR.tsx`), whereas end-to-end product flows live under `src/features/` (`watchDeposits.tsx`, `refund.ts`).
- Network and blockchain integration logic is grouped in `src/chain/citrea.ts`; shared account-abstraction helpers live in `src/lib/aa.ts`.
- Static media belongs in `src/assets/`, and anything that must be served verbatim goes in `public/` alongside `index.html`.
- Tooling and configuration are kept at the repo root (`vite.config.ts`, `eslint.config.js`, `tsconfig*.json`); keep new shared configs there for consistency.

## Build, Test, and Development Commands
- `npm install` keeps `node_modules/` in sync after pulling new changes.
- `npm run dev` launches the Vite dev server with hot module reload.
- `npm run build` runs the TypeScript project references (`tsc -b`) and then produces a production bundle via Vite.
- `npm run lint` executes ESLint across the workspace; ensure it passes before opening a PR.
- `npm run preview` serves the latest production build locally for smoke-testing.

## Coding Style & Naming Conventions
- Write modern TypeScript with ES modules and React 19 functional components; prefer hooks for state and side effects.
- Follow the existing two-space indentation, single quotes, and trailing commas enforced by ESLint’s recommended + TypeScript + React Hooks presets.
- Components and React hooks should use PascalCase filenames (`DepositQR.tsx`), utilities stay camelCase (`aa.ts`), and assets keep semantic lowercase names.
- Keep imports ordered by origin (libraries, then local modules) and avoid deeply nested relative paths by promoting shared utilities to `src/lib/`.

## Testing Guidelines
- A dedicated test runner is not yet configured; when adding coverage, prefer Vitest + Testing Library to stay aligned with the Vite ecosystem.
- Place unit tests alongside the code as `*.test.ts(x)` files or group them under `src/__tests__/` for larger suites.
- Focus initial coverage on data-fetching hooks and chain integrations—mock external RPC calls to keep tests deterministic.
- Record manual verification steps in the PR description until automated tests are in place.

## Commit & Pull Request Guidelines
- Use imperative, descriptive commit messages (`Add QR deposit component`) and keep related changes squashed together.
- Reference impacted modules in the body when context is helpful (`components/DepositQR`), and mention linked issue IDs when applicable.
- PRs should include: a short summary, screenshots or GIFs for UI tweaks, a note on testing (commands run, manual checks), and any configuration changes.
- Keep branches rebased on `main` so reviewers see a clean diff; request reviews only after CI (lint/build) succeeds locally.
