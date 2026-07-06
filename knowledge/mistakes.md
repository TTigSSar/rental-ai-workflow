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
