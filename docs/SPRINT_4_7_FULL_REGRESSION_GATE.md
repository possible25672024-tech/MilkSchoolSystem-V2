# Sprint 4.7 — Full Regression Gate

Date: 2026-07-29

Branch: `feature/sprint-4.7-media-signature-ui`

Status: **PASS — ALL 43 DISCOVERED REGRESSION CHECKS PASSED AFTER THE VACATION LIVE-STOCK FIX**

## Purpose

Run every repository Node regression check after the Shared Media and Signature workflow integration. The gate prevents a hand-maintained list from silently omitting an older or newly added check.

## Runner

```text
tests/run-sprint-4.7-regression.mjs
```

The runner:

- discovers every `tests/*-check.mjs` file at runtime;
- sorts files deterministically;
- requires at least the accepted baseline plus Sprint 4.7 checks;
- runs each check in a separate Node process;
- prints stdout and stderr;
- stops on the first failure;
- applies a two-minute timeout per check;
- exits non-zero on any failure;
- prints the actual passed count and elapsed time.

## Final accepted result

Reported after the Vacation live Teacher-stock correction and adapter status-contract fix:

```text
Vacation Milk Media and Signature integration checks passed.
Vacation live Teacher stock refresh checks passed.
ALL 43 REGRESSION CHECKS PASSED (6.2s)
On branch feature/sprint-4.7-media-signature-ui
Your branch is up to date with 'origin/feature/sprint-4.7-media-signature-ui'.
nothing to commit, working tree clean
```

Relevant correction commits:

```text
209457c fix(media): refresh Vacation preview from live Teacher snapshot
7a7c618 test(media): cover Vacation live Teacher stock refresh
744bde5 fix(media): preserve Vacation adapter status contract
4daf1b9 test(media): keep Vacation status contract stable
```

## Coverage added by Sprint 4.7

The suite includes checks for:

```text
attendance-media-signature-integration-check.mjs
media-evidence-recovery-duplicate-check.mjs
media-policy-check.mjs
media-processor-check.mjs
media-queue-redaction-check.mjs
media-store-check.mjs
pending-media-signature-integration-check.mjs
retroactive-media-signature-integration-check.mjs
signature-pad-check.mjs
teacher-session-roster-fallback-check.mjs
vacation-evidence-login-replay-check.mjs
vacation-live-stock-refresh-check.mjs
vacation-media-signature-integration-check.mjs
```

The count may increase when additional `*-check.mjs` files are added. A larger count is accepted only when every discovered check passes.

## Safety boundary

This Node runner did not perform or authorize:

- real classroom photo selection;
- real signatures;
- Attendance, Pending, Retroactive, or Vacation operational writes;
- real Queue creation or replay;
- direct Firebase Console mutation;
- Room Stock, Main Stock, ledger, or stockLog repair;
- use of quarantined room `อ.3-3`, room ID `mqn0z13eyx5b`, or date `2026-07-28`.

## Closing verification

The Browser Gate is now accepted. Because closing documentation changed after the reported 43-check run, run the automatic suite once more after pulling the final documentation commits:

```powershell
git pull --ff-only origin feature/sprint-4.7-media-signature-ui
node tests/run-sprint-4.7-regression.mjs
if ($LASTEXITCODE -ne 0) {
    throw "TEST FAILED: Sprint 4.7 closing regression"
}
git status
```

Fast-forward integration into `develop` is permitted only after that closing run passes and the feature branch is synchronized with a clean working tree.

No merge to `main`, production deployment, real evidence write, Queue replay, Room Stock mutation, or Main Stock mutation is authorized by this gate.
