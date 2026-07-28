---
name: brainstorming
description: Structured exploration when initial thinking reveals ambiguity, competing approaches, unclear acceptance criteria, or meaningful tradeoffs. Do not use for every task.
metadata:
  version: "1.0.0"
  license: MIT
---

# Brainstorming

Use this skill only when the right direction is not yet clear.

## When to use

- Requirements are ambiguous or acceptance criteria are unclear
- Multiple viable approaches with real tradeoffs
- The decision affects behavior, architecture, security, or long-term maintainability
- The user explicitly asks to explore options

## When not to use

- Typo fixes, mechanical renames, one-line config changes
- Simple bug fixes with known cause and narrow scope
- Executing an already-approved plan

## Process

1. Name the open decision.
2. Ask concise clarifying questions only when the codebase cannot answer.
3. Compare 2–3 viable approaches when tradeoffs matter.
4. Recommend one with clear reasons.

## Output

```text
Brainstorm result:
- Problem:
- Assumptions:
- Options:
- Tradeoffs:
- Recommendation:
- Open questions:
- Next step: [direct execution | writing-plans | prototype]
```

If the direction is clear after discussion, proceed without forcing a design doc.
Record durable decisions only in the smallest appropriate artifact (spec, plan, or reference doc).
