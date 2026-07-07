# Mistakes Log

One entry per lesson. Check this file before working in an unfamiliar area.
Record both failures and confirmed non-obvious approaches — with the why.

Template:

```
## M-001: <One-line lesson>
Date: YYYY-MM-DD | Area: backend|frontend|contract|infra
**Symptom:** what went wrong / what looked confusing.
**Cause:** the actual reason.
**Rule:** how to avoid it next time.
```

---

## M-001: rental-api/README.md is outdated — do not treat it as truth
Date: 2026-07-06 | Area: backend
**Symptom:** README describes an early toys-MVP: no reviews, no notifications, no booking activate/complete/cancel, no listing Draft/Archived statuses, Angular version wrong.
**Cause:** README was written for the MVP milestone and never updated as features landed.
**Rule:** source of truth = controllers + `api-contract.ts` + domain enums. Update or delete stale README sections when touching a described area.

## M-002: A delegated agent seeded the EXEMPLAR feature, not the requested one
Date: 2026-07-07 | Area: infra (agent workflow)
**Symptom:** backend-dev was asked to add a **chat conversation** dev seed. It instead wrote a `SeedNotificationsAsync` method seeding NOTIFICATIONS (the feature it had read as a pattern exemplar), wired it into the seed runner, then died on a session limit before adding the requested get-or-create route. Orchestrator caught it on review and reverted the off-task change.
**Cause:** the spec pointed the agent at the notifications vertical as a "mirror this pattern" exemplar; the agent conflated "mirror the pattern" with "seed that feature's data." Cold subagents blur exemplar-vs-target when both are named in the same task.
**Rule:** when a spec cites an exemplar feature, state explicitly "reproduce the *shape*, do NOT create the exemplar's data/entities." Always verify a delegated agent's diff against the spec before integrating — never commit an agent's output unreviewed. Keep seed/data tasks separate from pattern-study tasks.

## M-003: Documented dev-seed password was wrong (`LocalDemo123!` ≠ `Demo1234`)
Date: 2026-07-07 | Area: infra (docs vs code)
**Symptom:** every seed-account login returned 401 during live verification. Docs (rental-api README, root CLAUDE.md, verifier.md, the session's demo-accounts note) all said the password is `LocalDemo123!`; the actual value in `DevelopmentSeedCredentials.cs` (const `Password`) is **`Demo1234`**.
**Cause:** the seed password was changed in code at some point; the docs were never updated, and CLAUDE.md/agent files inherited the stale value.
**Rule:** source of truth for the seed password is `DevelopmentSeedCredentials.Password`, not any doc. Fixed CLAUDE.md + verifier.md to `Demo1234`. When an agent (esp. verifier) needs seed creds, it should read that constant rather than trust docs.

## M-004: `takeUntilDestroyed()` bare in `ngOnInit()` → NG0203 runtime crash (green build/tests)
Date: 2026-07-07 | Area: frontend
**Symptom:** the chat thread page rendered blank on all viewports. `dotnet`/`npm` builds AND all unit tests were green — the failure only surfaced in the live walk (screenshots). Root cause: `takeUntilDestroyed()` called bare inside `ngOnInit` throws `NG0203: can only be used within an injection context`.
**Cause:** `takeUntilDestroyed()` needs an injection context (constructor / field initializer) unless a `DestroyRef` is passed explicitly. `ngOnInit` is not an injection context. Compiles fine; crashes at runtime. The chat feature had **zero unit tests**, so nothing caught it before the live walk.
**Rule:** call `takeUntilDestroyed()` in a field initializer/constructor, or pass `takeUntilDestroyed(this.destroyRef)` with an injected `DestroyRef`, when used in a lifecycle hook. Every new feature needs at least one component-render spec (`fixture.detectChanges()`) — it catches injection-context and template crashes that build+typecheck miss. This is why the two-tier verification's **live walk with screenshots** is mandatory: build+tests were all green here.
