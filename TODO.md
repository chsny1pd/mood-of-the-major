# Mood of the Major — Active Tasks

> Sprint tracker for implementation work. See [`docs/roadmap.md`](./docs/roadmap.md) for full milestone definitions.

## Sprint 1 — Project Foundation

- [x] Backend scaffold (Clean Architecture folders, Express, health endpoints)
- [x] Frontend scaffold (Vite + React 19 + Tailwind, landing page)
- [x] ESLint + Prettier (frontend and backend)
- [x] GitHub Actions `ci.yml`
- [x] MongoDB connection + Mongoose models for reference data
- [x] Seed script (faculties, majors, emotion tags)
- [ ] Provision MongoDB Atlas dev cluster (`ASM-003`)
- [ ] Provision Cloudflare R2 dev bucket
- [ ] Provision Railway project (root: `backend/`)
- [ ] Provision Vercel project (root: `frontend/`)
- [ ] Enable branch protection on `main` (require PR + passing CI)

## Sprint 2 — Authentication (next)

- [ ] AuthService, JWT, bcrypt, user repository
- [ ] Register / login / logout / refresh / me routes
- [ ] Frontend auth pages and AuthContext
