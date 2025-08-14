# Task Completion Checklist - JLA Cash Planner

## When a Development Task is Completed

### Code Quality Checks
- [ ] **Rust Code**:
  - Run `cargo fmt` to format code
  - Run `cargo clippy` to check for lints
  - Run `cargo check` to verify compilation
  - Run `cargo test` to execute tests
  - Ensure all monetary amounts use cents (i64)
  - Verify VAT rates use ppm format (i32)

- [ ] **Frontend Code**:
  - Run `npm run eslint` to check linting
  - Run `npm run eslint:fix` to fix auto-fixable issues  
  - Run `npm run prettier` to check formatting
  - Run `npm run prettier:fix` to format code
  - Ensure TypeScript compilation passes
  - Test components work in both light and dark modes

### Functional Testing
- [ ] **Manual Testing**:
  - Start dev servers: `npm run web:dev` + `npm run desktop:dev`
  - Test the affected features in the UI
  - Verify data persistence (SQLite)
  - Check calculations are accurate (VAT/URSSAF)
  - Test edge cases and error handling

- [ ] **Data Integrity**:
  - Verify monetary amounts display correctly (cents → euros)
  - Check date formats are consistent (ISO strings)
  - Confirm VAT rates convert properly (ppm ↔ percentage)

### Build Verification
- [ ] **Frontend Build**:
  - Run `npm run web:build` 
  - Verify no build errors or warnings
  - Check bundle size is reasonable

- [ ] **Desktop Build** (if backend changes):
  - Run `npm run desktop:build`
  - Test the built application
  - Verify all Tauri commands work

### Documentation
- [ ] **Code Documentation**:
  - Add/update doc comments for public APIs
  - Document complex business logic
  - Update type definitions if schema changed

- [ ] **User Documentation** (if applicable):
  - Update README if commands changed
  - Document new features or workflow changes
  - Update CLAUDE.md if architecture changed

### Database Changes
- [ ] **Migration Files**:
  - Ensure migration files are properly numbered
  - Test migration on fresh database
  - Verify data integrity after migration
  - Test rollback if possible

### Commit Guidelines
- [ ] **Git Workflow**:
  - Stage relevant files: `git add .`
  - Use descriptive commit message following conventional commits
  - Example: `feat: add expense categorization feature`
  - Push changes: `git push`

### Performance Considerations
- [ ] **Frontend Performance**:
  - Check for unnecessary re-renders
  - Verify data loading is efficient
  - Test with larger datasets

- [ ] **Backend Performance**:
  - Review SQL query efficiency
  - Check memory usage patterns
  - Verify no N+1 query problems

### Security Review
- [ ] **Data Validation**:
  - Verify input validation on both frontend and backend
  - Check for potential injection vulnerabilities
  - Ensure sensitive data is handled properly

### Final Checklist
- [ ] All automated tests pass
- [ ] Manual testing completed successfully
- [ ] Code formatting and linting clean
- [ ] Documentation updated
- [ ] No console errors in development
- [ ] Performance is acceptable
- [ ] Changes follow architectural principles
- [ ] Ready for code review (if applicable)