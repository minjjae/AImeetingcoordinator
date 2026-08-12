# Static HTML page merge guide

This guide is for the three independently built hackathon pages. It prevents filename collisions and guarantees one uninterrupted demo path once the files are merged.

## Fixed filenames and ownership

| File | Owner area | Required page marker | Must demonstrate |
| --- | --- | --- | --- |
| `login.html` | Login owner | `<html lang="ko" data-page="login">` | Google Calendar connection entry point and transition to the dashboard |
| `personal.html` | Personal-page owner | `<html lang="ko" data-page="personal">` | personal schedule, weekly report, and right-side group list |
| `group.html` | Group-page owner | `<html lang="ko" data-page="group">` | members, candidate slots, AI recommendation, confirmation state |

Every page must have a non-empty `<title>` and must remain a standalone HTML document. Do not rename these files after another page has linked to them.

## Fixed demo navigation

Use ordinary anchors or `window.location.href`; no server router is necessary for the static demo.

```text
login.html -- "Google Calendar 연결" --> personal.html
personal.html -- group card --> group.html
group.html -- "내 대시보드" --> personal.html
```

`group.html` is the pitch-critical screen. It must make this flow visible:

```text
natural-language request -> deterministic Top 3 candidates -> AI explanation -> confirm
```

## Shared data rules

- Use `fixtures/mvp-demo.json` field names as the shared vocabulary.
- Calendar details are never displayed; only `available`, `busy`, and the time range are shared.
- Keep API keys, Google OAuth tokens, Supabase service-role keys, and personal emails out of HTML and commits.
- Do not change the database migration or fixture shape without announcing it in the pull request.

## Individual-page workflow

```powershell
git switch master
git pull origin master
git switch -c feature/page-login # personal or group owner changes the suffix

# edit only the assigned HTML file and its own assets
powershell -ExecutionPolicy Bypass -File scripts/validate-pages.ps1

git add login.html
git commit -m "feat(login): add calendar connection page"
git push -u origin feature/page-login
```

The normal validator allows other assigned pages to be missing. That is intentional: all three owners can work in parallel.

## Merge checklist for the integrator

1. Review each PR for its fixed filename, `data-page` marker, non-empty title, and absence of secrets.
2. Merge the pages in any order; each owner edits a different file, so no HTML conflict should occur.
3. After all three pages are on `master`, run the complete gate:

   ```powershell
   powershell -ExecutionPolicy Bypass -File scripts/validate-pages.ps1 -RequireComplete
   ```

4. Open `login.html` and manually click the full demo route. Verify that the group page displays the same member names, candidate scores, and AI recommendation as `fixtures/mvp-demo.json`.
5. Record any fixes in the PR and reserve the last demo pass for `master`, not an unmerged feature branch.

## Automation

GitHub Actions runs `scripts/validate-pages.ps1` on every HTML pull request and on pushes to `master`. It catches malformed page shells, missing page markers, and likely leaked secrets while keeping parallel page work unblocked.
