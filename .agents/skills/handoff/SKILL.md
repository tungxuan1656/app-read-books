---
name: handoff
description: Write a concise handoff note when a session stops with meaningful unfinished work, so the next session can resume without re-discovery.
metadata:
  version: "1.0.0"
  license: MIT
---

# Handoff

Use only when stopping mid-task with meaningful unfinished work.

## When to use

- Implementation pauses with an incomplete step
- A blocker prevents finishing today
- Another person or session must resume

## When not to use

- Work is finished — just record the result normally
- Nothing meaningful is unfinished

## Process

1. Summarize what is done.
2. Name the exact unfinished step and where to resume.
3. List blockers, missing decisions, or environment constraints.
4. List next actions in order.
5. Include the latest verification evidence.

## Output

Write to the smallest artifact that fits the repo convention
(e.g., `harness/progress.md`, a plan's Progress section, or a
dedicated handoff file if the repo uses one). Keep it concise:

```text
Handoff:
- Done:
- In progress / resume at:
- Blockers:
- Next steps:
- Evidence:
```

## Rules

- Do not duplicate entire plan bodies — reference the plan file instead.
- Clear stale handoff notes when the work finishes.
- Do not use a handoff as a second progress log.
