# JLA Cash Planner - Project Overview

## Purpose
JLA Cash Planner is a local-first desktop application designed for French freelancers to manage monthly VAT (TVA sur encaissements), URSSAF, cashflow, and monthly closings. It handles French tax regulations with precision, storing all monetary amounts in cents to avoid floating-point issues.

## Tech Stack
- **Backend**: Tauri 2.0 (Rust) with SQLite database
- **Frontend**: SolidJS with Tailwind CSS v4 
- **Build Tools**: Vite, TypeScript
- **Database**: SQLite with migrations
- **Development**: Monorepo structure with cargo workspace

## Architecture Pattern
The application follows **Clean Architecture** principles:

```
Frontend (SolidJS) → Tauri Commands → App Service → Domain Use Cases → Repositories → SQLite
```

### Layer Structure:
- **`crates/domain/`** - Pure business logic, entities, and use cases
- **`crates/app/`** - Application services and DTOs for Tauri commands  
- **`crates/infra/`** - SQLite repositories and infrastructure adapters
- **`apps/desktop/src-tauri/`** - Tauri backend with command handlers
- **`apps/desktop/frontend/`** - SolidJS frontend with components and stores

## Key Domain Entities
- **Invoice** - Client invoices with VAT calculations (amounts in cents)
- **Expense** - Business expenses with deductible VAT (amounts in cents)  
- **Provision** - VAT/URSSAF provisions with due dates
- **Settings** - App configuration (rates in ppm, payment days, buffer)
- **MonthId** - Year/month identifier for monthly operations

## Business Rules
### VAT Calculation (French "TVA sur encaissements")
- VAT is calculated on **payment date** not invoice date
- `TVA_due = VAT_collected - VAT_deductible` for the month
- VAT declaration on day 12, payment on day 20 of following month

### URSSAF Calculation  
- Based on HT revenue received in the month
- Default rate: 22% (220,000 ppm)
- Payment on day 5 of following month

### Currency Handling
All monetary amounts are stored as **cents (integers)** to avoid floating-point precision issues. VAT rates are stored as **ppm** (parts per million) where 200,000 ppm = 20%.

## Key Features
- Dashboard with monthly summary
- Invoice/expense management
- VAT/URSSAF calculation assistants
- Monthly recap and closing workflow
- Cashflow forecasting
- Settings configuration