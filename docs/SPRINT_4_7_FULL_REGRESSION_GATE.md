# Sprint 4.7 — Full Regression Gate

Date: 2026-07-29

Branch: `feature/sprint-4.7-media-signature-ui`

Status: PASS — every discovered regression check passed; branch was synchronized and the working tree was clean at local acceptance.

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

The runner rejects a suite containing fewer than 42 checks. A larger count is accepted so future checks are included automatically.

## Accepted Local Result

The PowerShell command completed through `git status` and `git log` without reaching the failure `throw`. This proves that every check discovered by the runner exited successfully.

Accepted repository state before browser-gate documentation commits:

```text
On branch feature/sprint-4.7-media-signature-ui
Your branch is up to date with 'origin/feature/sprint-4.7-media-signature-ui'.
nothing to commit, working tree clean
HEAD 9cb1008
```

The passed count was at least the enforced 42-check minimum and included every required Sprint 4.7 check.

## Safety Boundary

This runner executes repository Node checks only. It did not perform or authorize:

- real classroom photo selection;
- real signatures;
- Attendance, Pending, Retroactive, or Vacation operational writes;
- real Queue creation or replay;
- direct Firebase Console mutation;
- Room Stock, Main Stock, ledger, or stockLog repair;
- use of quarantined room `อ.3-3`, room ID `mqn0z13eyx5b`, or date `2026-07-28`.

## Acceptance

Confirmed:

1. every discovered check exited successfully;
2. the runner did not invoke its failure path;
3. the feature branch matched Origin;
4. the working tree was clean.

Next gate:

```text
Desktop and 820 x 1180 read-only browser validation
```

No real evidence, Firebase mutation, Queue replay, Room Stock mutation, or Main Stock mutation is permitted during browser validation.
