### Task 9: Full verification

- [ ] **Step 1: Run backend tests**

```bash
cd backend && npm test
```

Expected: all pass

- [ ] **Step 2: Run frontend typecheck / tests if present**

```bash
cd frontend && npm run typecheck
```

(or `npx tsc --noEmit` / project’s equivalent script)

- [ ] **Step 3: Grep for leftover slug API**

```bash
rg "reactionType|userReaction[^s]|REACTION_TYPES" backend/src frontend/src
```

Expected: only legacy migration map / translation key paths / comments

- [ ] **Step 4: Final commit only if fixes needed**; otherwise done.

---