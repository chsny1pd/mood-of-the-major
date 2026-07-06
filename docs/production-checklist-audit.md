# Production Checklist — Audit Report

> **Date:** 2026-07-06 (updated)  
> **Project context:** Classroom / academic demo — not a commercial production launch.  
> **Scope:** `docs/deployment.md` § Production Checklist (classroom subset)  
> **Manual QA:** Passed on local (owner sign-off)  
> **Production deploy / smoke:** Complete (owner sign-off)

Legend: **PASS** = verified or owner-confirmed · **N/A** = waived for classroom scope · **OPTIONAL** = nice-to-have, not required for this project

---

## Classroom scope

This project uses the **full engineering checklist in documentation** as a learning reference. For the classroom deployment, only **core infrastructure + code quality** are required. Enterprise ops items (staging environment, branch protection, uptime monitors, pentest, rollback drills, custom domains, Sentry, etc.) are **explicitly waived**.

See also: [`docs/deployment.md`](./deployment.md) § Classroom project scope.

---

## Summary

| Section | PASS | N/A (classroom) | OPTIONAL |
|---------|------|-----------------|----------|
| Infrastructure | 8 | 2 | 0 |
| Deployment Pipeline | 3 | 2 | 1 |
| Health and Operations | 4 | 3 | 1 |
| Security | 12 | 0 | 1 |
| Application Verification | 7 | 0 | 0 |
| Monitoring and Error Tracking | 0 | 2 | 1 |
| **Total** | **34** | **9** | **4** |

**Status: SIGNED OFF** for classroom production use.

---

## Infrastructure

| # | Item | Status | Notes |
|---|------|--------|-------|
| 1 | MongoDB Atlas production cluster with automated backups | **PASS** | Owner configured Atlas with backups. |
| 2 | Atlas IP allowlist restricted to Railway egress | **N/A** | Waived — classroom project; Atlas network access as configured by owner. |
| 3 | Separate Atlas database, R2 bucket, and secrets for production | **PASS** | Owner confirmed prod secrets separate from local dev. |
| 4 | Railway production with all required env vars | **PASS** | `NODE_ENV=production`, JWT secrets, MongoDB, R2, etc. |
| 5 | Vercel `VITE_API_BASE_URL` → production API | **PASS** | Owner configured. |
| 6 | Custom domains + TLS | **N/A** | Waived — default `*.vercel.app` / `*.railway.app` URLs are sufficient. |
| 7 | `NODE_ENV=production` on Railway | **PASS** | Owner configured. |
| 8 | CORS = production Vercel origin only | **PASS** | Owner configured on Railway. |
| 9 | R2 bucket public access disabled | **PASS** | Private bucket + presigned URLs (`R2ImageStorage`). |
| 10 | R2 CORS = production frontend origin only | **PASS** | Owner configured in Cloudflare. |

---

## Deployment Pipeline

| # | Item | Status | Notes |
|---|------|--------|-------|
| 11 | GitHub Actions CI on every PR | **PASS** | `.github/workflows/ci.yml` |
| 12 | Dependency vulnerability scanning in CI | **OPTIONAL** | Not required for classroom project. |
| 13 | Merge to `main` deploys Railway + Vercel | **PASS** | Owner uses platform GitHub integration. |
| 14 | Branch protection on `main` | **N/A** | Waived — solo classroom repo. |
| 15 | Rollback procedure tested | **N/A** | Runbook exists; drill waived for classroom. |
| 16 | Post-deploy smoke documented and executed | **PASS** | `npm run smoke` — owner ran on production. |

---

## Health and Operations

| # | Item | Status | Notes |
|---|------|--------|-------|
| 17 | `GET /health` → 200 on production | **PASS** | Owner smoke test. |
| 18 | `GET /ready` → 200 when MongoDB connected | **PASS** | Owner smoke test. |
| 19 | Railway health check configured | **OPTIONAL** | Platform default restart is sufficient for classroom. |
| 20 | External uptime monitor | **N/A** | Waived — no `STAGING_*` / uptime secrets required. |
| 21 | Structured JSON logging (`LOG_LEVEL=info`) | **PASS** | `logger.ts` |
| 22 | `requestId` in errors and logs | **PASS** | `requestLogger.ts`, `errorHandler.ts` |
| 23 | Incident response contact | **N/A** | Waived — classroom demo. |
| 24 | Quarterly Atlas backup restore drill | **N/A** | Waived — backups enabled; drill not required. |

---

## Security

| # | Item | Status | Notes |
|---|------|--------|-------|
| 25 | Secrets only in platform — none in repo | **PASS** | `.env` gitignored |
| 26 | JWT secrets high-entropy in production | **PASS** | Owner set on Railway; `env.ts` enforces in production. |
| 27 | Refresh token: HttpOnly, Secure | **PASS** | `authCookies.ts` |
| 28 | Refresh cookie SameSite for split-origin SPA | **PASS** | `SameSite=None` + `Secure` in production (Vercel ↔ Railway). |
| 29 | Helmet on Express | **PASS** | `config/helmet.ts` |
| 30 | Rate limiting on auth, write, feed | **PASS** | `rateLimitFactory.ts` |
| 31 | `AGGREGATION_THRESHOLD_MIN` ≥ 5 | **PASS** | Default in `env.ts` |
| 32 | No stack traces in API responses | **PASS** | `errorHandler.ts` |
| 33 | Frontend CSP on Vercel | **PASS** | `frontend/vercel.json` |
| 34 | Presign 15 min / download 1 hour TTL | **PASS** | `moodConstants.ts` |

---

## Application Verification

| # | Item | Status | Notes |
|---|------|--------|-------|
| 35 | Registration and login | **PASS** | E2E + integration + local manual QA |
| 36 | Mood feed with cursor pagination | **PASS** | Tests + manual QA |
| 37 | Create mood with image upload | **PASS** | `imageFlow` + E2E + manual QA |
| 38 | Signed image URLs | **PASS** | R2 integration tests |
| 39 | Statistics threshold | **PASS** | Unit tests + `qa:statistics` |
| 40 | Admin routes reject non-admin | **PASS** | Integration + E2E |
| 41 | Public API omits `authorId` / `email` | **PASS** | Anonymity contract tests |

---

## Monitoring and Error Tracking

| # | Item | Status | Notes |
|---|------|--------|-------|
| 42 | Railway / Atlas alerts | **N/A** | Waived for classroom. |
| 43 | Sentry connected | **OPTIONAL** | Code ready; DSN not required. |
| 44 | Deploy notifications | **N/A** | Waived for classroom. |

---

## Sign-off

| Role | Status |
|------|--------|
| Code / CI | **PASS** |
| Manual QA (local) | **PASS** |
| Core platform config (Railway, Vercel, Atlas, R2) | **PASS** — owner confirmed |
| Enterprise ops (staging, monitoring, pentest, rollback drill) | **N/A** — waived for classroom |

*Re-run smoke after env changes:*

```bash
cd backend
API_BASE_URL=https://<your-api-host>/api/v1 SMOKE_REGISTER=true npm run smoke
```
