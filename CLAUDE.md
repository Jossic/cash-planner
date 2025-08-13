# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

JLA Cash Planner is a local-first desktop application for French freelancers to manage monthly VAT (on encaissements), URSSAF, cashflow, and monthly closings. Built with Tauri 2.0 (Rust backend) + Qwik (TypeScript frontend) + SQLite.

## Development Commands

### Prerequisites
```bash
# Install frontend dependencies first
npm run web:install
```

### Development Workflow (Two Terminal Process)

**Terminal 1 - Frontend Dev Server:**
```bash
npm run web:dev
# or: cd apps/desktop/frontend && npm run dev
```

**Terminal 2 - Tauri Desktop App:**
```bash  
npm run desktop:dev
# or: cd apps/desktop/src-tauri && npx @tauri-apps/cli@^2 dev
```

### Build Commands
```bash
# Frontend build
npm run web:build

# Desktop build
npm run desktop:build
```

### Icons
```bash
# Generate app icons from source
npm run desktop:icons
```

## Architecture

### Clean Architecture Pattern
The codebase follows clean architecture with clear separation:

- **`crates/domain/`** - Pure business logic, entities, and use cases
- **`crates/app/`** - Application services and DTOs for Tauri commands  
- **`crates/infra/`** - SQLite repositories and infrastructure adapters
- **`apps/desktop/src-tauri/`** - Tauri backend with command handlers
- **`apps/desktop/frontend/`** - Qwik frontend with components and stores

### Data Flow
Frontend (Qwik) → Tauri Commands → App Service → Domain Use Cases → Repositories → SQLite

### Key Domain Entities
- `Invoice` - Client invoices with VAT calculations (amounts in cents)
- `Expense` - Business expenses with deductible VAT (amounts in cents)  
- `Provision` - VAT/URSSAF provisions with due dates
- `Settings` - App configuration (rates in ppm, payment days, buffer)
- `MonthId` - Year/month identifier for monthly operations

### Currency Handling
All monetary amounts are stored as **cents (integers)** to avoid floating-point precision issues. VAT rates are stored as **ppm** (parts per million) where 200,000 ppm = 20%.

## Frontend Structure

### Qwik Architecture
- **Routes**: `/apps/desktop/frontend/src/routes/` - File-based routing
- **Components**: Shared components in `/apps/desktop/frontend/src/components/`
- **Stores**: Context-based state management in `/apps/desktop/frontend/src/stores/`
- **Tauri Client**: API calls to backend in `/apps/desktop/frontend/src/lib/tauriClient.ts`

### Key Routes
- `/` - Dashboard with monthly summary
- `/invoices` - Invoice management
- `/expenses` - Expense tracking
- `/vat` - VAT calculation assistant
- `/urssaf` - URSSAF calculation assistant
- `/recap` - Monthly recap view
- `/forecast` - Cashflow forecasting
- `/close-month` - Month closing workflow
- `/settings` - App configuration

## Database

SQLite database with migrations in `crates/infra/migrations/`. Schema includes:
- `invoices` - Client invoices with payment tracking
- `expenses` - Business expenses  
- `provisions` - VAT/URSSAF provisions
- `settings` - Key-value configuration
- `months` - Month closing status

## Business Rules

### VAT Calculation (French "TVA sur encaissements")
- VAT is calculated on **payment date** not invoice date
- `TVA_due = VAT_collected - VAT_deductible` for the month
- VAT declaration on day 12, payment on day 20 of following month

### URSSAF Calculation  
- Based on HT revenue received in the month
- Default rate: 22% (220,000 ppm)
- Payment on day 5 of following month

### Cashflow Management
- Separates available funds from provisions for taxes
- `Available = Revenue - VAT_due - URSSAF_due - Buffer`
- Buffer prevents over-distribution to owner

## Testing

No specific test commands found in package.json. Add tests using:
- Rust: `cargo test` in workspace root
- Frontend: Add test script to `apps/desktop/frontend/package.json`

## File Patterns

- Rust files use snake_case
- TypeScript files use camelCase  
- Component files end in `.tsx`
- All amounts internally handled as cents (divide by 100 for display)
- Dates stored as ISO strings, parsed to NaiveDate in Rust