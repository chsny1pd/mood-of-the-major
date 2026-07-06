# Load testing (Sprint 7)

Requires [k6](https://k6.io/docs/get-started/installation/) installed locally.

## Feed endpoint

Target: **p95 ≤ 500 ms** on staging.

```bash
k6 run backend/load-tests/feed.js -e BASE_URL=https://your-api.railway.app
```

## Presign endpoint

Target: **p95 ≤ 200 ms** on staging. Requires a valid student access token.

```bash
# Obtain token via login, then:
k6 run backend/load-tests/presign.js \
  -e BASE_URL=https://your-api.railway.app \
  -e ACCESS_TOKEN=eyJ...
```

## Reporting

k6 prints summary statistics at the end of each run. Archive the output in your staging QA log and compare against targets in `docs/roadmap.md` Sprint 7.

| Endpoint | p95 target |
|----------|------------|
| `GET /api/v1/moods/feed` | ≤ 500 ms |
| `POST /api/v1/images/upload-url` | ≤ 200 ms |
| `GET /api/v1/statistics/dashboard` | ≤ 2000 ms |
