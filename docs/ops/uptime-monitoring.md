# Uptime monitoring

External synthetic monitoring verifies API and frontend availability independently of Railway/Vercel dashboards.

## Recommended setup

Use a free or paid external monitor (UptimeRobot, Better Stack, Pingdom, or similar):

| Target | URL | Interval | Expected |
|--------|-----|----------|----------|
| API health | `https://<api-host>/health` | 1 min | HTTP 200, body `{ "status": "ok" }` |
| API readiness | `https://<api-host>/ready` | 5 min | HTTP 200 when DB connected |
| Frontend | `https://<frontend-host>/` | 1 min | HTTP 200 |

Configure email or Slack alerts when checks fail 2+ consecutive times.

## GitHub Actions synthetic check (optional)

Repository workflow `.github/workflows/uptime-check.yml` runs on a schedule when these secrets are configured:

| Secret | Example |
|--------|---------|
| `STAGING_API_URL` | `https://mood-api-staging.up.railway.app` |
| `STAGING_FRONTEND_URL` | `https://mood-staging.vercel.app` |

If secrets are unset, the workflow skips checks (no failure).

## Production checklist

See `docs/security.md` Production Checklist and `docs/deployment.md` Monitoring section for launch sign-off.
