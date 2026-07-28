---
name: verification-before-completion
description: Run verification and confirm output before claiming work is complete, fixed, or passing. Evidence before assertions always.
metadata:
  version: "1.0.0"
  license: MIT
---

# Verification Before Completion

No completion claim without fresh verification evidence.

## Policy

Before saying a task is done:

1. Identify the command that proves the claim.
2. Run it fresh.
3. Read the actual output.
4. Report what passed, what failed, or what did not run.

If verification cannot run, say so explicitly:

```text
Implemented, but not verified because <reason>. Risk: <what could be wrong>.
```

Do not say "done" when required verification did not run.

## Verification report

```text
Verification:
- Command:
- Result:
- Evidence:
- Not run / reason:
```

## Rules

- Do not infer build success from lint success.
- Do not infer correctness from code inspection alone.
- Do not reuse old output to make a fresh completion claim.
- If checks failed, say what failed and cite the command.
