# Sprint 4.7 — Full Regression Gate

Date: 2026-07-29

Branch: `feature/sprint-4.7-media-signature-ui`

Status: RUNNER IMPLEMENTED / LOCAL VALIDATION PENDING

## Purpose

Run every repository Node regression check after the Shared Media and Signature workflow integration. The gate prevents a hand-maintained command list from silently omitting older or newly added tests.

## Runner

```text
tests/run-sprint-4.7-regression.mjs
```

The runner:

- discovers every `tests/*-check.mjs` file at runtime;
- sorts the files deterministically;
- requires at least 42 checks;
- requires all 12 Sprint 4.7 checks explicitly;
- runs each check in a separate Node process;
- prints stdout and stderr for each check;
- stops immediately on the first failure;
- applies a two-minute timeout to each check;
- returns a non-zero exit code when any check fails;
- prints the actual passed-check count and elapsed time when complete.

## Regression Count

The accepted Sprint 4.6 baseline contained:

```text
30 regression checks
```

Sprint 4.7 added these 12 checks:

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
vacation-media-signature-integration-check.mjs
```

The runner therefore rejects a suite containing fewer than 42 checks. A larger count is accepted so future checks are included automatically.

## Local Command

```powershell
node tests/run-sprint-4.7-regression.mjs
if ($LASTEXITCODE -ne 0) {
    throw "TEST FAILED: Sprint 4.7 full regression"
}

git status
git log -8 --oneline
```

Expected final line:

```text
ALL 42 REGRESSION CHECKS PASSED
```

The number may be higher than 42 when additional `*-check.mjs` files exist.

## Safety Boundary

This runner executes repository Node checks only. It does not authorize:

- real classroom photo selection;
- real signatures;
- Attendance, Pending, Retroactive, or Vacation operational writes;
- real Queue creation or replay;
- direct Firebase Console mutation;
- Room Stock, Main Stock, ledger, or stockLog repair;
- use of quarantined room `อ.3-3`, room ID `mqn0z13eyx5b`, or date `2026-07-28`.

A failing check must be fixed on the feature branch and the complete runner must be restarted from the beginning.

## Acceptance

This gate passes only when:

1. every discovered check exits successfully;
2. the final runner output reports all checks passed;
3. the feature branch matches Origin;
4. the working tree is clean.

After this gate passes, proceed to desktop and 820 x 1180 read-only browser validation. No real evidence or stock write is permitted during browser validation.
