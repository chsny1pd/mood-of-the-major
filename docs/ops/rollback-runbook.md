# Rollback Runbook

> Use when a production deploy causes regressions, elevated error rates, or failed smoke tests.

## Prerequisites

- Access to Railway (backend) and Vercel (frontend) dashboards
- `PRODUCTION_API_BASE_URL` for smoke verification
- Previous known-good deploy SHA

## Backend rollback (Railway)

1. Open the Railway service → **Deployments**.
2. Identify the last healthy deployment (green health, passing smoke).
3. Click **Redeploy** on that deployment (or use Railway CLI `railway redeploy --deployment <id>`).
4. Wait for `GET /health` and `GET /ready` to return 200.
5. Run smoke test:
   ```bash
   cd backend
   API_BASE_URL=$PRODUCTION_API_BASE_URL npm run smoke
   ```

## Frontend rollback (Vercel)

1. Open the Vercel project → **Deployments**.
2. Find the last production deployment with passing Lighthouse and E2E on staging.
3. Click **⋯ → Promote to Production** on that deployment.
4. Verify the production URL loads and `VITE_API_BASE_URL` points to the current API.

## Database rollback

Prefer **forward-fix** for schema-compatible issues.

If data corruption requires restore:

1. Open MongoDB Atlas → **Backup** → **Restore** (point-in-time if available).
2. Restore to a **new** cluster or namespace first; validate before cutover.
3. Coordinate with backend deploy rollback so application code matches data shape.

## R2 / media

- Bucket objects are not rolled back with app deploys.
- Orphan cleanup job can be run manually if a bad deploy left pending uploads:
  ```bash
  curl -X POST "$API_BASE_URL/internal/jobs/cleanup-images" \
    -H "x-service-api-key: $SERVICE_API_KEY"
  ```

## Verification checklist

- [ ] `npm run smoke` passes against production API
- [ ] Student journey E2E passes on production (register → mood → feed)
- [ ] Admin can access `/admin` with test administrator account
- [ ] Error rate and p95 latency normal for 30 minutes post-rollback
- [ ] Incident noted in team channel with root cause and follow-up ticket

## When to rollback vs hotfix

| Situation | Action |
|-----------|--------|
| P0 auth or anonymity breach | Rollback immediately |
| P0 data loss risk | Rollback + Atlas restore evaluation |
| P1 UI regression, API stable | Hotfix or frontend-only rollback |
| Failed smoke test on deploy | Rollback before announcing release |
