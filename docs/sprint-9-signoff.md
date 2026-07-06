# Sprint 9 — Production Release (v1.0)

> Code and runbooks prepared. Production launch requires cloud console configuration and stakeholder approval.

## Implemented in repository

- [x] Post-deploy smoke test script (`backend/scripts/smoke-test.ts`, `npm run smoke`)
- [x] Production deploy workflow template (`.github/workflows/deploy-production.yml`)
- [x] Rollback runbook (`docs/ops/rollback-runbook.md`)
- [x] Uptime monitoring runbook (`docs/ops/uptime-monitoring.md`)
- [x] Load testing runbook (`docs/load-testing.md`)
- [x] Sprint 7–8 security hardening (Helmet, rate limits, Sentry optional, Lighthouse CI)

## Platform configuration (ops — outside repo)

- [ ] Production MongoDB Atlas cluster with automated backups (30-day retention)
- [ ] Production R2 bucket — private, CORS restricted to production Vercel origin
- [ ] Railway production service with all secrets (`docs/deployment.md` Environment Variables)
- [ ] Vercel production with `VITE_API_BASE_URL` pointing to production API
- [ ] GitHub secret `PRODUCTION_API_BASE_URL` for deploy smoke workflow
- [ ] External uptime monitoring (`STAGING_API_URL`, `STAGING_FRONTEND_URL` or production URLs)
- [ ] Sentry DSN on Railway and Vercel (optional but recommended)
- [ ] Custom domains + TLS on Vercel and Railway
- [ ] Branch protection on `main` (require PR + passing CI)

## Release steps

1. Confirm Sprint 8 sign-off (`docs/sprint-8-signoff.md`) — CI green, manual QA complete.
2. Walk `docs/deployment.md` Production Checklist — all items checked.
3. Merge release branch to `main`; verify Vercel + Railway auto-deploy (or trigger manually).
4. Run post-deploy smoke:
   ```bash
   cd backend
   API_BASE_URL=https://<production-api>/api/v1 SMOKE_REGISTER=true npm run smoke
   ```
5. Execute Playwright smoke against production URL (student journey + admin report subset).
6. Tag release: `git tag v1.0.0 && git push origin v1.0.0`
7. Publish release notes; 30-minute elevated monitoring watch.

## Definition of Done (v1.0)

- [ ] Production checklist complete (`docs/deployment.md`)
- [ ] `GET /health` and `GET /ready` return 200 on production
- [ ] End-to-end student journey on production: register → mood with image → feed
- [ ] Admin moderation path verified on production
- [ ] No open P0 defects; accepted P1s documented
- [ ] Rollback tested and documented
- [ ] **v1.0 declared live**

## Security audit

Formal penetration test should be scheduled before broad public launch. Code-level controls from Sprint 7 are in place per `docs/security.md`.
