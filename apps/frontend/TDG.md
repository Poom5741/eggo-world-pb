# TDG Configuration for React/Vue Auth Frontend

## Test Commands
- Unit tests: jest --watch
- Integration tests: vitest run
- E2E tests: cypress open
- Coverage: jest --coverage

## Test File Patterns
- Unit: **/__tests__/*.test.{jsx,tsx}
- Integration: **/__tests__/*.integration.test.{jsx,tsx}
- E2E: cypress/e2e/**/*.cy.{js,jsx}

## Build Command
- npm run build

## Module Conventions
- Use React functional components
- Implement OIDC flow via custom hooks
- New CSS modules for styling