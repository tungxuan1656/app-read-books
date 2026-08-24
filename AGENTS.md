# AGENTS.md

React Native (Expo SDK 54) app for reading books/novels with AI translation/summarization via OpenAI-compatible endpoint

Detected stack: `Expo SDK 54 · React Native 0.81 · TypeScript 5.9 · single pnpm workspace`

## Repository map

- `ARCHITECTURE.md` — architecture and layer map
- `docs/specs/<id>.md` — feature specifications
- `docs/references/` — engineering standards and patterns
- `docs/plans/` + `docs/product/overview.md` — plans index and product overview

## Assess the task

Before creating or updating feature, plan, or progress artifacts, assess the task's project scale, complexity, and impact. Use no feature for lightweight work, an inline feature plan for bounded tracked work, and a separate linked plan only for substantial work.

For work that does not need a feature, read only the relevant sources and run proportional verification without updating feature or progress state.

## Start feature work

1. Run `./init.sh`.
2. Read `feature_index.json`.
3. Read the selected feature file in `features/`.
4. Read the latest relevant block in `progress.md`.
5. Load only the documents linked by the selected feature.

If baseline verification fails, record the failure. Fix it only when the current scope includes it.

## Working rules

- Keep at most one feature `active`. Zero active features means the repository is idle.
- Use only `todo`, `active`, `blocked`, or `done` as feature status.
- Start `todo` work only after the user selects or approves it.
- Keep feature work inside the active feature's scope and acceptance criteria.
- Complete every dependency before activating its dependent feature.
- Record scope, acceptance, evidence, and handoff in the feature file.
- Record a feature result in `progress.md` only when the result, blocker, handoff, or next action materially changes. Do not copy feature scope there.
- Update `init.sh` when verification commands or workspace modules change.

## Plans

| Mode | Use when | Signals for external plan |
|---|---|---|
| No feature | <20 lines, 1 file, no API/DB/complexity change | — |
| Inline plan (`features/feat-<id>.md`) | 1-3 files, 1 workspace, <200 lines, single concern, <1 day | — |
| External plan (`docs/plans/feat-<id>.md`) | Substantial work | >=4 files or >=2 workspaces, DB migration or breaking API, needs phases/rollback, or needs multi-agent file ownership |

Do not create `docs/plans/feat-<id>.md` for bounded work.

## Escalation

- Read the relevant project document before making an architecture or product decision.
- Ask the user when requirements, scope, ownership, or a repeated verification failure remain unclear.

## Feature done

A feature is done only when:

- [ ] Every acceptance criterion passes.
- [ ] `./init.sh` passes.
- [ ] The feature file records verification evidence.
- [ ] `progress.md` records the result and next action.

## End feature session

1. Update the feature status and handoff.
2. When state materially changed, add a new block below the final template note in `progress.md`; do not edit older blocks.
3. Record blockers and one next action when they exist.

## Verification

- Full: `./init.sh`

<!-- harness-slim 1.4.0 · generated 2026-08-24 · managed sections above; check drift with skill CHANGELOG.md -->
