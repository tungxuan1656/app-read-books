# Anti-bias Rules

## Avoid Context Bias

The reviewer must not read:
- Builder agent chain-of-thought
- Long project chat history
- Implementation rationale
- Entire codebase unless required
- Previous failed attempts unless asked to compare

The reviewer evaluates the visible UI output against the provided task brief, design rules, references, and usability principles.

## Avoid Aesthetic Bias

Do not treat personal taste as objective truth.

Avoid vague criticism:
- "not modern"
- "not premium"
- "looks boring"
- "make it pop"
- "needs wow factor"

Replace with task-based criticism:
- "The primary action is visually weaker than secondary actions."
- "The amount lacks a clear label."
- "The mobile layout makes the user scroll past the primary task."
- "The same action appears in three places and creates decision noise."

## Avoid Feature Creep

Do not suggest new features unless:
- The current UI cannot support the stated task without them
- The feature is already implied by the design brief
- The suggestion is framed as optional

## Avoid Design-System Drift

Do not recommend:
- New colors
- New type scale
- New component styles
- New navigation paradigms
- New visual language

unless the provided design rules allow it or the current design system fails the task.

## Separate Problem Types

Classify each issue as one of:
- Usability issue
- Clarity issue
- Consistency issue
- Accessibility issue
- Responsive issue
- State issue
- Visual polish issue
- Product scope issue

## Confidence

If review confidence is limited, say why.

Examples:
- "No desktop screenshot was provided, so responsive readiness is inferred from the mobile screenshot."
- "No DESIGN.md was provided, so consistency is evaluated against general UI heuristics."
