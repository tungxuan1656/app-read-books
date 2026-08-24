# Plans — rn-read-books

> Repairs the route `docs/plans/README.md` referenced in `AGENTS.md §Repository map and §Plans.` This file is the index for in-repo implementation plans. The feature index (`feature_index.json`) and progress log (`progress.md`) remain the canonical feature lifecycle sources.

## Purpose

`docs/plans/` holds implementation plans for multi-step work (features, refactors, migrations). Plans are detailed, task-level guides for an engineer with no prior context. They map files to touch, code to write, tests, and verification.

Active plans live here. Terminal (completed/cancelled/superseded) plans are marked closed per template and retained for history. Do not use plans as a second manifest — use `feature_index.json` for lifecycle truth.

## Naming convention

Per `AGENTS.md §Plans`, plan files use:

```
YYYY-MM-DD--plan--<subject-id>--<intent>.md
```

- `YYYY-MM-DD` — creation date.
- `<subject-id>` — kebab-case feature or subject id (matches `feature_index.json` when applicable).
- `<intent>` — short kebab-case intent (e.g., `initial`, `migration`, `follow-up`).

Example: `2026-05-28--plan--openai-migration--initial.md`

## Alternative when no in-repo plan home is wanted

If the repo chooses not to keep plans in-repo, route via the `.agents/skills/writing-plans` skill instead of creating `docs/superpowers/` or similar fallbacks. In this repo we **do** keep plans in-repo, so this `docs/plans/` index is authoritative and the skill's note about asking `agent-docs-architect` or surfacing a path decision applies only when no canonical location exists.

## Lifecycle

- **Active:** file present in `docs/plans/`, linked from spec or work record when applicable.
- **Terminal:** marked closed per template (status section in plan). File stays in place for audit; `progress.md` records completion evidence.
- **Source of truth for status:** `feature_index.json` + `progress.md`. Plans are guidance; feature gates advancement.

## Template — sourced from `.agents/skills/writing-plans/SKILL.md`

Every plan **must** start with the header below (verbatim from the skill). Steps use checkbox (`- [ ]`) syntax for tracking.

### Plan document header

```markdown
# [Feature Name] Implementation Plan

> **Execution:** Follow the repository's implementation and verification rules. Use `subagent-driven-development` or `executing-plans` only when installed and appropriate. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** [One sentence describing what this builds]

**Architecture:** [2-3 sentences about approach]

**Tech Stack:** [Key technologies/libraries]

## Global Constraints

[The spec's project-wide requirements — version floors, dependency limits,
naming and copy rules, platform requirements — one line each, with exact
values copied verbatim from the spec. Every task's requirements implicitly
include this section.]

---
```

### File structure (before tasks)

Map files to create or modify and what each is responsible for. Prefer small, focused files with clear boundaries. Follow existing patterns.

### Task right-sizing

A task is the smallest unit that carries its own test cycle and is worth a fresh reviewer's gate. Fold setup/config/scaffolding/docs into the task that needs them; split only where a reviewer could reject one task while approving its neighbor.

### Bite-sized granularity

Each step is one action (2–5 minutes): write failing test → run to confirm fail → minimal implementation → run to confirm pass → commit.

### Task structure

````markdown
### Task N: [Component Name]

**Files:**
- Create: `exact/path/to/file.py`
- Modify: `exact/path/to/existing.py:123-145`
- Test: `tests/exact/path/to/test.py`

**Interfaces:**
- Consumes: [what this task uses from earlier tasks — exact signatures]
- Produces: [what later tasks rely on — exact function names, parameter
  and return types. A task's implementer sees only their own task; this
  block is how they learn the names and types neighboring tasks use.]

- [ ] **Step 1: Write the failing test**

```python
def test_specific_behavior():
    result = function(input)
    assert result == expected
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/path/test.py::test_name -v`
Expected: FAIL with "function not defined"

- [ ] **Step 3: Write minimal implementation**

```python
def function(input):
    return expected
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/path/test.py::test_name -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tests/path/test.py src/path/file.py
git commit -m "feat: add specific feature"
```
````

### No placeholders

Every step must contain actual content. Never write: `TBD`, `TODO`, `implement later`, `fill in details`, `Add appropriate error handling` without code, `Write tests for the above` without test code, `Similar to Task N`, steps without code blocks, or references to undefined types/functions.

### Self-review (author runs before handing off)

1. **Spec coverage:** Skim each spec requirement — can you point to a task that implements it? List gaps.
2. **Placeholder scan:** Search for red flags from section above. Fix them.
3. **Type consistency:** Do types/signatures/property names match across tasks?

Fix inline if issues found.

### Execution handoff

After saving, offer:

> **"Plan complete and saved to `<plan-path>`. Choose an execution approach:**
> **1. Subagent-driven** - Use `subagent-driven-development` when it is installed, tasks are independent, and the user authorizes delegated execution.
> **2. Inline execution** - Execute in this session, optionally with `executing-plans`, using the repository's verification and branch rules.
> **Which approach?"**

Do not require either optional skill. Record selected approach in the feature or handoff record when present.

## References

- Skill source: `.agents/skills/writing-plans/SKILL.md`
- Agent map route: `AGENTS.md §Repository map and §Plans`
- Spec source: `docs/specs/<id>.md`
- Checks: `./init.sh` (`pnpm run lint && pnpm run tsc-check`)
