---
name: executing-plans
description: Execute an existing written plan step by step, with verification checkpoints.
metadata:
  version: "1.0.0"
  license: MIT
---

# Executing Plans

Load the plan, review it critically, execute step by step, verify before claiming done.

## Process

1. **Read the plan completely.** Raise any concerns before starting — do not guess through ambiguity.
2. **Execute each step in order.** Mark steps done as you go.
3. **Run verification after each step that changes observable behavior.**
4. **Stop and ask** when blocked — a missing dependency, a failing check, an unclear instruction. Do not force through blockers.

## When to stop and escalate

Go back to `brainstorming` or `writing-plans` when execution reveals:
- Invalid assumptions in the plan
- Missing acceptance criteria
- Unexpected constraints that change the approach

## Completion

Before claiming done, run the final verification specified in the plan. Use
`verification-before-completion` if in doubt. Record evidence.

If stopping mid-plan, write a handoff using `handoff`.
