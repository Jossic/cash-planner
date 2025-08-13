# JLA Cash Planner – Desktop

Local-first Tauri (Rust) + Qwik app to manage monthly VAT on encaissements, URSSAF, cashflow, and closings.

## Dev

Prereqs: Node 18+, npm or pnpm, Rust (1.78+), Tauri 2 toolchain.

- Frontend dev: `cd apps/desktop/frontend && npm install && npm run dev`
- Tauri dev (opens window, proxies to Vite): `cd apps/desktop/src-tauri && cargo tauri dev` or `npx tauri dev`

The Tauri config is set to run `npm run dev --prefix ../frontend` automatically.

## Build

- Frontend build: `cd apps/desktop/frontend && npm run build`
- Desktop build: `cd apps/desktop/src-tauri && npx tauri build`

## Storage

SQLite local sous le répertoire data de l’application (fichier `data.sqlite`). Migrations gérées via SQLx et lancées au démarrage.

## Features (MVP)

- Dashboard: encaissements HT, TVA due, URSSAF due, disponible
- Encaissements: list + create
- Dépenses: list + create
- TVA/URSSAF assistants: monthly computations
- Paramètres: load/save key settings (ppm rates, days, buffer)

Planned next: Rapprochement bancaire, imports, simulations, PDF/CSV exports, month closing lock, SQLite.
