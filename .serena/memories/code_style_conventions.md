# Code Style and Conventions - JLA Cash Planner

## Rust Conventions

### Naming
- **Files**: snake_case (e.g., `invoice_repo.rs`)
- **Structs/Enums**: PascalCase (e.g., `MonthId`, `ProvisionKind`)
- **Functions/Variables**: snake_case (e.g., `compute_vat_for_month`)
- **Constants**: SCREAMING_SNAKE_CASE (e.g., `DEFAULT_VAT_RATE`)

### Code Organization
- Use `#[derive(Debug, Clone, Serialize, Deserialize)]` for domain entities
- Implement `Default` trait for settings and configuration structs
- Use `anyhow` for error handling in application layer
- Use `thiserror` for domain-specific errors
- Prefer `i64` for monetary amounts (stored as cents)
- Use `i32` for rates in ppm (parts per million)

### Documentation
- Add doc comments for public APIs using `///`
- Document business rules and calculations clearly
- Include examples for complex functions

## TypeScript/SolidJS Conventions

### Naming
- **Files**: camelCase (e.g., `App.tsx`, `tauriClient.ts`)
- **Components**: PascalCase (e.g., `DashboardView`, `InvoiceList`)
- **Functions/Variables**: camelCase (e.g., `formatEuros`, `loadInvoices`)
- **Constants**: SCREAMING_SNAKE_CASE (e.g., `NAV`, `DEFAULT_SETTINGS`)

### Component Structure
- Use function components with SolidJS primitives
- Prefer `createSignal` for local state
- Use `onMount` for initialization
- Handle loading/error states explicitly
- Use `Show` component for conditional rendering
- Use `For` component for lists

### Code Organization
- Keep interfaces close to where they're used
- Group related functions together
- Use consistent error handling patterns
- Prefer async/await over promises
- Use TypeScript strict mode

## CSS/Styling Conventions

### Tailwind CSS v4
- Use semantic class names from Tailwind
- Prefer responsive design with `md:` prefixes
- Use CSS custom properties for theming
- Follow mobile-first approach
- Use consistent spacing scale

### Custom Classes
- Define utility classes in `index.css`
- Use semantic class names (e.g., `.btn`, `.card`, `.modal`)
- Maintain dark mode compatibility

## Database Conventions

### Schema Design
- Use TEXT for UUIDs (stored as strings)
- Use INTEGER for amounts in cents
- Use TEXT for dates (ISO format)
- Use CHECK constraints for data integrity
- Use descriptive column names

### Migration Files
- Use sequential numbering (0001_, 0002_, etc.)
- Include descriptive names
- Test migrations thoroughly
- Include rollback instructions in comments

## Project Structure Conventions

### File Organization
```
crates/
├── domain/     # Pure business logic (no dependencies)
├── app/        # Application services (uses domain)
└── infra/      # Infrastructure (implements domain interfaces)

apps/desktop/
├── src-tauri/  # Rust Tauri backend
└── frontend/   # SolidJS frontend
```

### Dependency Rules
- Domain layer has no external dependencies except serde/chrono
- App layer depends only on domain
- Infra layer implements domain interfaces
- Frontend communicates only through Tauri commands

## Testing Conventions

### Rust Tests
- Unit tests in same file as implementation
- Integration tests in `tests/` directory
- Use descriptive test names
- Test error conditions explicitly

### Frontend Tests
- Component tests using SolidJS testing utilities
- Mock Tauri invoke calls
- Test user interactions and state changes

## Commit Conventions

### Commit Messages
- Use conventional commits format
- Prefix with type: feat, fix, docs, style, refactor, test, chore
- Keep messages concise but descriptive
- Reference issues when applicable

Examples:
- `feat: add VAT calculation for multiple rates`
- `fix: resolve currency precision issues`
- `docs: update API documentation`