---
name: prototype
description: Build a throwaway spike when UX flow, state shape, or domain logic is too uncertain to commit to production code directly.
metadata:
  version: "1.0.0"
  license: MIT
---

# Prototype

Use when the fastest way to answer the question is to build a small disposable thing.

## When to use

- UX or interaction direction is uncertain — need to see it to decide
- A state machine or business rule is easier to judge by running it than by reading prose
- `brainstorming` narrowed the question but not enough to commit to production code

## When not to use

- The implementation path is already clear
- The code is intended to ship directly
- The question can be answered by reading existing docs and code

## Rules

1. Mark the prototype as throwaway in its name or heading.
2. Keep it close to the real code area — do not invent a distant sandbox tree.
3. One obvious command to run it.
4. Keep state local and disposable.
5. Skip production polish and reusable abstractions.
6. After learning the answer, capture the result and delete or absorb the prototype.

## Output

```text
Prototype result:
- Question answered:
- Files / how to run:
- What we learned:
- Next: [promote to plan | revise | delete]
```

The durable artifact is the answer, not the prototype code. Record the result in
the appropriate plan, spec, or reference doc.
