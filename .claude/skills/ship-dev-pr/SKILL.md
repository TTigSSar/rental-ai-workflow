---
name: ship-dev-pr
description: The DoRent git delivery workflow — commit on `dev`, push to `origin/dev`, open a pull request into remote `main`. Use whenever finishing a change in rental-app, rental-api, or Rental-Ui; whenever asked to commit, push, ship, deliver, or open a PR; and before wrapping up a session. Local `main` branches no longer exist — never switch to or recreate them.
---

# Ship work: dev → origin/dev → PR to main

## The three repositories

`rental-app/` is the outer repo; `rental-api/` and `Rental-Ui/` are **separate nested git repos** inside it (each has its own `.git`). Every git command must target the right one — always pass `-C <repo>` or verify the working directory.

| Path | Remote |
|---|---|
| `.` (rental-app) | `https://github.com/TTigSSar/rental-ai-workflow.git` |
| `rental-api/` | `https://github.com/Tigran-developer/rental-api.git` |
| `Rental-Ui/` | `https://github.com/Tigran-developer/Rental-Ui.git` |

## Hard rules

1. **There is no local `main` in any of the three repos** — Tigran deleted them on 2026-07-31. Never run `git switch main`, `git checkout main`, `git branch main`, or `git merge main` locally. `origin/main` is read-only reference; it changes only when a PR is merged on GitHub.
2. **All work happens on `dev`.** This applies to all three repos, including the outer `rental-app` repo (the old "commit outer repo to main" exception is dead — it went away with the local `main` branches).
3. **Merging into `main` is human-only**, and it happens through the GitHub PR UI. Never merge a PR yourself, never push to `main`.
4. Commit immediately after each completed change — do not batch until session end. Nothing may be left uncommitted when the session wraps up.
5. Delegated subagents leave changes uncommitted; the orchestrator commits.

## The flow

Run this per repo that was actually touched. Skip repos with no changes.

### 1. Confirm you are on `dev`

```bash
git -C <repo> status -sb
```

Expect `## dev` or `## dev...origin/dev`. If somehow detached or elsewhere: `git -C <repo> switch dev`. If `dev` itself is missing, create it from the remote — **never from a local main**: `git -C <repo> switch -c dev origin/main`.

### 2. Commit on `dev`

Stage deliberately — `rental-api` accumulates untracked junk under
`src/RentalPlatform.Api/wwwroot/uploads/listings/**` from local runs. Never `git add -A` there; add the specific paths you changed.

```bash
git -C <repo> add <paths>
git -C <repo> commit -m "<type>(<scope>): <subject>"
```

Conventional-commit style, matching existing history (`feat`, `fix`, `docs`, `chore`, `refactor`, `test`). End the message with:

```
Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
```

### 3. Push to `origin/dev`

```bash
git -C <repo> push origin dev
```

The outer `rental-app` and `Rental-Ui` local `dev` branches have **no upstream configured** — use `git -C <repo> push -u origin dev` the first time so later pushes are bare. `rental-api/dev` already tracks `origin/dev`.

Auth is Git Credential Manager over HTTPS; pushes work without extra setup. If a push is rejected as non-fast-forward, `git -C <repo> pull --rebase origin dev` and push again — never force-push a shared branch.

### 4. Open the pull request `dev` → `main`

**`gh` is not installed on this machine** (checked 2026-07-31, absent from PATH and from `C:\Program Files\GitHub CLI`). So do not attempt `gh pr create` — it will fail. Instead, hand Tigran the prefilled compare link:

- rental-app: https://github.com/TTigSSar/rental-ai-workflow/compare/main...dev?expand=1
- rental-api: https://github.com/Tigran-developer/rental-api/compare/main...dev?expand=1
- Rental-Ui: https://github.com/Tigran-developer/Rental-Ui/compare/main...dev?expand=1

Post the link(s) in your reply along with a ready-to-paste PR title and body:

```markdown
## Summary
- <what changed, one bullet per meaningful change>

## Verification
- <builds/tests/e2e actually run, with real results>

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

If Tigran later installs and authenticates `gh`, prefer it and create the PR directly:

```bash
gh pr create --repo <owner>/<repo> --base main --head dev --title "<title>" --body "<body>"
```

Re-check `gh --version` before assuming either path.

### 5. Report

State per repo: branch, commit sha + subject, push result, PR link. Then stop — the merge is Tigran's call.

## Reusing an open PR

`dev` is long-lived, so a PR from `dev` → `main` may already be open. Pushing more commits to `origin/dev` updates that PR automatically — do not open a second one. If unsure whether a PR is open, say so and give the compare link; GitHub shows the existing PR instead of a new-PR form when one exists.

## Housekeeping

`rental-api` carries two stale local branches, `D` and `mina`, plus `rental-app` has `feature/chat-realtime` and `fix/utc-datetime-serialization`. Leave them alone unless Tigran asks for cleanup.
