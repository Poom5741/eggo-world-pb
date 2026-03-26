# Issue 001: React Core OIDC Auth Flow Recreation

## Title
Implement test-driven React OIDC auth flow for PocketBase integration

## Acceptance Criteria
- Passes Jest unit tests for core auth logic
- Validates Cypress integration tests for full OIDC flow
- Uses new CSS modules for styling
- No PocketBase constructor/reference errors

## Technical Context
- React functional components
- TDG Red-Green-Refactor cycles
- OIDC endpoints: auth (https://access.line.me/oauth2/v2.1/authorize), token (https://api.line.me/oauth2/v2.1/token)
- Test suites: Jest (unit), Vitest (integration), Cypress (E2E)