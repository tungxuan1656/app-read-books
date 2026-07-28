---
name: task-router
description: Route tasks using the Direct, Tracked, and High-risk planned model.
metadata:
  version: "1.0.0"
  license: MIT
---

# task-router v1.0

Choose just enough record-keeping and verification for the task at hand. Stop
once the completion condition is met.

## Triage first

Before selecting a mode, confirm:

- what outcome the user wants;
- what is out of scope;
- the observable done condition and how it will be verified.

Read the nearest `AGENTS.md` and only the files directly relevant to the task.
Do not broadly read docs, git history, or harness state. If outcome or
verification cannot be established, ask before proceeding.

## Three modes

| Mode | Choose when | How to work |
| --- | --- | --- |
| **Direct** | Default. Clear, bounded, reversible work that finishes in one session. | No harness artifacts, no formal plan. State scope and done condition inline when useful. |
| **Tracked** | Multiple sessions or handoff; substantial acceptance criteria; multiple owners; or the user explicitly requests tracking. | Use or update only the directly relevant manifest/spec/work files. Do not force global progress updates. |
| **High-risk planned** | Migration; auth/security/privacy; breaking API or schema; irreversible data or external side effect; unresolved material uncertainty. | Write a compact plan: context/outcome, approach, verification, risk/rollback, decisions. Keep it proportionate — no fixed ceremony. |

Direct is the default. Reclassify up when scope grows, a new owner appears, or
new risk emerges. Return to a lighter mode once uncertainty is resolved.

## Scope guard — one feature at a time

Pick one feature from `harness/checks.json` (lowest-priority `passes: false`)
and implement it completely before touching another. Do not attempt multiple
features in one session. If context is running low, stop, update `harness/progress.md`,
commit, and leave a clean state — do not half-implement the next feature.

Before starting implementation in Tracked mode:
1. Run the repo's verification command (from `AGENTS.md`) to confirm the app is healthy.
2. If it fails, fix the existing breakage before adding new code.
3. Only then implement the selected feature.

## Tracked mode — canonical sources

- `harness/manifest.json` — feature registry and lifecycle status.
- `docs/specs/<id>.md` — scope, behavior, and observable acceptance.
- `harness/work/<id>.json` — execution record only (`acceptanceResults`,
  `nextAction`, `completion`). Do not copy status, title, or blocker into work.
- `harness/checks.json` — check registry.

Do not create a competing canonical copy. Report completion only when acceptance
has checkable evidence. A blocker must state its impact and next action.

## Commands and checks

Run a command only when its result can change a decision or completion. Do not
repeat unchanged checks.

- Run `node harness/scripts/validate.mjs` only when using or changing tracked artifacts.
- Run `node harness/scripts/run-checks.mjs` only when a relevant check exists
  or acceptance requires it. Do not run the entire registry by habit.
- Do not invent a check absent from the registry. If a required check cannot
  run, report the blocker.

## Proportionate verification

| Work type | Minimum verification |
| --- | --- |
| Docs / config | Review diff, headings, links. Syntax check only if a parser could break. |
| Narrow code | Nearest relevant test, lint, or typecheck. |
| Public / API | Successful and error contracts, input boundaries, backward compatibility. |
| Cross-system | Relevant integration or fixture; check timeout/retry/cleanup. |
| High-risk | Preconditions confirmed; prefer dry-run; verify rollback and failure modes. |

If required verification is unavailable, stop and report a blocker.

## When to stop or ask

Stop as soon as acceptance and verification are reached. Ask or block when:

- material ambiguity about outcome, scope, or acceptance;
- an unapproved side effect or irreversible action;
- missing required access, secret, or dependency;
- a baseline failure that cannot be attributed to the current change;
- the same failure repeats without new evidence.

## Route and completion reports

**Route result** (short, enough for the implementer):

```text
mode: Direct | Tracked | High-risk planned
outcome: <desired outcome>
scope: <specific artifact/code/doc; non-goal if needed>
done when: <observable condition>
verification: <command/check or reason not run>
```

**Completion report** (what actually happened):

```text
mode: <mode used>
scope/change: <what changed>
verification/evidence: <result and evidence path>
blockers/uncertainty: <none or impact + next action>
```
