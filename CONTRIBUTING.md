# Collaboration workflow

## Source of truth

- `master` is always demoable. Do not commit directly to it.
- The database contract lives in `supabase/migrations/` and `docs/database.md`.
- Any API or UI change that needs new data must update the page contract in `docs/page-contracts.md` in the same pull request.

## Branches

Create one focused branch per task:

```text
feature/auth-profile
feature/group-workspace
feature/scheduling
feature/data-integration
fix/<short-description>
docs/<short-description>
```

## Pull request checklist

- [ ] The branch changes one coherent screen, flow, or data concern.
- [ ] No Google OAuth token, API key, or `.env` file is committed.
- [ ] Route-level data needs match `docs/page-contracts.md`.
- [ ] Database changes are added as a new migration; never edit an applied migration.
- [ ] The happy-path demo still works: request -> top 3 -> AI explanation -> confirm.

## Merge order for the hackathon

1. Merge the database migration and mock fixture contract.
2. Build and merge `login.html`, `personal.html`, and `group.html` in parallel using the [static HTML merge guide](docs/html-merge-guide.md).
3. Run `scripts/validate-pages.ps1 -RequireComplete` only after all three pages have landed.
4. Reserve the final 30 minutes for one clean demo pass on `master`.

## Commit style

Use short, searchable commits:

```text
feat(db): add initial scheduling schema
feat(group): render member availability tabs
fix(scheduler): require all required attendees
docs: clarify weekly report privacy
```
