# Suggested Commands for JLA Cash Planner Development

## Prerequisites
```bash
# Install frontend dependencies first
npm run web:install
```

## Development Workflow (Two Terminal Process)

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

## Build Commands
```bash
# Frontend build
npm run web:build

# Desktop build
npm run desktop:build
```

## Icons
```bash
# Generate app icons from source
npm run desktop:icons
```

## Testing Commands
```bash
# Rust tests (run from workspace root)
cargo test

# Frontend tests (add to apps/desktop/frontend/package.json)
cd apps/desktop/frontend && npm test
```

## Code Quality Commands
```bash
# Frontend linting and formatting
cd apps/desktop/frontend
npm run eslint          # Check ESLint
npm run eslint:fix      # Fix ESLint issues
npm run prettier        # Check Prettier
npm run prettier:fix    # Fix Prettier formatting

# Rust formatting and linting
cargo fmt               # Format Rust code
cargo clippy            # Lint Rust code
```

## Database Commands
```bash
# Database migrations are handled automatically by SQLx
# Migration files are in: crates/infra/migrations/

# To create new migration:
# Add new .sql file in crates/infra/migrations/ with incremental naming
```

## Useful System Commands (macOS)
```bash
# File operations
ls -la                  # List files with details
find . -name "*.rs"     # Find Rust files
grep -r "pattern" .     # Search in files
cd path/to/directory    # Change directory

# Git operations
git status              # Check git status
git add .               # Stage all changes
git commit -m "message" # Commit changes
git push                # Push to remote

# Process management
ps aux | grep node      # Find node processes
kill -9 PID            # Kill process by PID
```

## Project Structure Commands
```bash
# View workspace structure
tree -I "target|node_modules|.next" -L 3

# Check cargo workspace
cargo tree              # Show dependency tree
cargo check             # Check compilation without building
```