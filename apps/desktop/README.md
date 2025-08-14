# JLA Cash Planner – Desktop

Local-first Tauri (Rust) + SOLIDJS app to manage monthly VAT on encaissements, URSSAF, cashflow, and closings.

## Development

Prerequisites: Node 18+, npm, Rust (1.78+), Tauri 2 toolchain.

### Two Terminal Development Setup

**Terminal 1 - Frontend:**
```bash
cd apps/desktop/frontend 
npm install
npm run dev
```

**Terminal 2 - Tauri Desktop:**  
```bash
cd apps/desktop/src-tauri
npx @tauri-apps/cli@^2 dev
```

The frontend will run on http://localhost:5173 and Tauri will connect to it automatically.

## Build

- Frontend build: `cd apps/desktop/frontend && npm run build`  
- Desktop build: `cd apps/desktop/src-tauri && npx @tauri-apps/cli@^2 build`

## Storage

SQLite local sous le répertoire data de l’application (fichier `data.sqlite`). Migrations gérées via SQLx et lancées au démarrage.

## Features (MVP)

- Dashboard: encaissements HT, TVA due, URSSAF due, disponible
- Encaissements: list + create
- Dépenses: list + create
- TVA/URSSAF assistants: monthly computations
- Paramètres: load/save key settings (ppm rates, days, buffer)

Planned next: Rapprochement bancaire, imports, simulations, PDF/CSV exports, month closing lock, SQLite.
