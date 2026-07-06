# Sprint 8 — sign-off

> Code deliverables complete. Staging manual QA and ops items require platform access.

## Implemented in code

- [x] Backend integration tests with MongoDB (`authFlow`, `moodFlow`, `imageFlow`, `reportAdminFlow`)
- [x] Integration test helpers (`backend/tests/helpers/integrationSetup.ts`)
- [x] MongoDB service container in GitHub Actions `backend-ci`
- [x] Playwright E2E: admin report flow (`e2e/tests/admin-report.spec.ts`)
- [x] Playwright E2E: image upload flow (`e2e/tests/image-upload.spec.ts`)
- [x] E2E admin seed script (`npm run seed:e2e-admin`)
- [x] Public DTO anonymity contract tests
- [x] API error envelope contract tests
- [x] Frontend unit tests (MoodCard, apiClient, RequireAuth)
- [x] Accessibility baseline (jest-axe, eslint-plugin-jsx-a11y)
- [x] Lighthouse CI + E2E in GitHub Actions

## Staging / manual (ops)

- [ ] Execute full manual QA checklist on staging (`docs/testing-strategy.md` § Manual QA Checklist)
- [ ] Triage defect backlog; close P0/P1 or document accepted P1s
- [ ] Test rollback procedure on staging per `docs/ops/rollback-runbook.md`

## Definition of Done

Sprint 8 code DoD is met when CI is green (unit + integration + E2E + Lighthouse). Production promotion remains gated on Sprint 9 ops sign-off.
