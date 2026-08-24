# AGENTS.md

rn-read-books is a single-user offline reading app. Users import books once from a remote catalog and read with optional AI translate or summary via a configurable OpenAI-compatible service.

## Start here

- Architecture → [ARCHITECTURE.md](./ARCHITECTURE.md) — topology, layer map, dependency direction, invariants
- Business behavior → [docs/product/overview.md](./docs/product/overview.md) — vision, personas, scope, features, flows, rules
- Design → [docs/design/navigation.md](./docs/design/navigation.md) · [docs/design/screens.md](./docs/design/screens.md) · [docs/design/design-system.md](./docs/design/design-system.md)
- Subsystem rules → [docs/references/README.md](./docs/references/README.md) — hooks, services, stores, navigation, storage
- Docs routing → [docs/index.md](./docs/index.md) — Task → Read table for all docs
- Work state → [feature_index.json](./feature_index.json) · [progress.md](./progress.md)

## Repository map

Canonical routing lives in [docs/index.md](./docs/index.md) — Task → Read table owns file ownership. Summary below, do not duplicate details here.

**Business (portable, no stack terms):** `docs/product/` (`overview`, `domain-model`, `glossary`, `flows`, `business-rules`, `integrations`, `decisions`) + `docs/product/functional-specs/` (6 features) + `docs/design/` (`navigation`, `screens`, `design-system`)
**Tech (stack-specific):** `ARCHITECTURE.md` (sole owner of topology) · `docs/specs/<id>.md` (checkable contracts) · `docs/references/` (see `docs/references/README.md` index) · `docs/decisions/decisions.md` (tech ADRs) · `docs/plans/` (plans index)

## Assess the task

Before creating or updating feature, plan, or progress artifacts, assess project scale, complexity, and impact. Use no feature for lightweight work, an inline feature plan for bounded tracked work, and a separate linked plan only for substantial work.

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

## End session

1. Update the feature status and handoff.
2. When state materially changed, add a new block below the final template note in `progress.md`; do not edit older blocks.
3. Record blockers and one next action when they exist.

## Verification

- Full: `./init.sh`

<!-- harness-slim 1.4.0 · generated 2026-08-24 · managed sections above; check drift with skill CHANGELOG.md -->
