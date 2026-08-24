# Docs Index — rn-read-books

> Routing index for `docs/`. Pick a task, read the linked file. Business docs use portable language; tech docs use stack terms. Ownership: product behavior → `docs/product/`, design → `docs/design/`, topology → `ARCHITECTURE.md`.

## Product (business-only, portable)

| File | Owns |
|---|---|
| [product/overview.md](./product/overview.md) | Vision, personas, scope, feature and flow summaries, rules summary |
| [product/domain-model.md](./product/domain-model.md) | Entities, relationships, invariants, state machines |
| [product/glossary.md](./product/glossary.md) | Term definitions |
| [product/flows.md](./product/flows.md) | Canonical UX flows and acceptance |
| [product/business-rules.md](./product/business-rules.md) | Durable business rules BR-01..BR-12 |
| [product/integrations.md](./product/integrations.md) | Business view of remote catalog and AI service |
| [product/functional-specs/](./product/functional-specs/) | Per-feature business specs: `book-import`, `book-library`, `book-reader`, `ai-reading`, `chapter-prefetch`, `settings-management` |
| [product/decisions.md](./product/decisions.md) | Business ADR log (append-only): D1 offline-first, D2 ZIP catalog, D3 cache, D4 prefetch N=3, D5 translate/summary |

## Design (interaction, no stack terms)

| File | Owns |
|---|---|
| [design/navigation.md](./design/navigation.md) | Screen graph and navigation rules |
| [design/screens.md](./design/screens.md) | Screen inventory and per-screen behavior |
| [design/design-system.md](./design/design-system.md) | Tokens, color, typography, spacing, motion |

## Tech (stack-specific)

| File | Owns |
|---|---|
| [ARCHITECTURE.md](../ARCHITECTURE.md) | Topology, layer map, dependency direction, invariants (sole owner) |
| [specs/](./specs/) | Checkable behavior per feature: `book-import`, `book-library`, `book-reader`, `ai-reading`, `chapter-prefetch`, `settings-management` |
| [references/README.md](./references/README.md) | Engineering standards index (hooks, services, stores, navigation, storage) |
| [decisions/decisions.md](./decisions/decisions.md) | Tech ADR log (append-only) |
| [plans/README.md](./plans/README.md) | Plans index |

## Task → Read

| Task | Read first | Then |
|---|---|---|
| Understand what the app does | [product/overview.md](./product/overview.md) | [product/flows.md](./product/flows.md), [product/domain-model.md](./product/domain-model.md) |
| Check a business rule or term | [product/business-rules.md](./product/business-rules.md) | [product/glossary.md](./product/glossary.md) |
| See how import or AI works (business) | [product/integrations.md](./product/integrations.md) | [product/functional-specs/book-import.md](./product/functional-specs/book-import.md) or [product/functional-specs/ai-reading.md](./product/functional-specs/ai-reading.md) |
| See screen or navigation | [design/navigation.md](./design/navigation.md) | [design/screens.md](./design/screens.md) |
| Check visual rules | [design/design-system.md](./design/design-system.md) | [references/color-guide.md](./references/color-guide.md), [references/typography-guide.md](./references/typography-guide.md) |
| Implement a feature | [ARCHITECTURE.md](../ARCHITECTURE.md) | [specs/<id>.md](./specs/) + [references/README.md](./references/README.md) |
| Find why a choice was made | [product/decisions.md](./product/decisions.md) for business | [decisions/decisions.md](./decisions/decisions.md) for tech |
| Start work / track progress | [feature_index.json](../feature_index.json) | [progress.md](../progress.md), [AGENTS.md](../AGENTS.md) |
