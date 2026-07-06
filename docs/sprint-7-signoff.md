# Sprint 7 — code-complete sign-off

> Staging/ops items require platform configuration outside this repository.

## Implemented in code

- [x] Helmet security headers (backend)
- [x] Rate limiting — auth, write, feed, general API
- [x] Structured JSON logging with `requestId`
- [x] MongoDB index sync on startup
- [x] Orphan/deleted image cleanup job
- [x] Frontend security headers (`vercel.json`)
- [x] k6 load test scripts (`backend/load-tests/`)
- [x] Sentry integration (optional — set `SENTRY_DSN` / `VITE_SENTRY_DSN`)
- [x] Lighthouse CI config (`frontend/lighthouserc.cjs`)
- [x] Uptime monitoring runbook (`docs/ops/uptime-monitoring.md`)

## Staging / ops (configure in platform consoles)

- [ ] Run k6 against staging; archive report meeting p95 targets (or document exceptions)
- [ ] Lighthouse CI green on PR (`npm run lighthouse` in frontend after build)
- [ ] Create Sentry projects; set DSN env vars on Railway and Vercel
- [ ] Configure external uptime monitor (see `docs/ops/uptime-monitoring.md`)
- [ ] Walk `docs/security.md` Production Checklist on staging

## Security audit

Code-level controls are in place. Formal penetration test or structured review should be scheduled before Sprint 9 production release per `docs/roadmap.md`.
