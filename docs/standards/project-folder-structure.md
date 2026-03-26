# Large Project Folder Structure (finalized per new proposal)

## 1) Standard Structure

```text
src/
  app.tsx
  main.tsx

  api/
    client.ts
    endpoints.ts
    feature*/
    ...

  assets/

  hooks/
    shared/
    feature*/
    ...

  components/
    ui/
    shared/
    feature*/
    ...

  stores/
    auth.store.ts       # feature*.store.ts (placed directly, no subfolders)
    control.store.ts
    types.ts
    ...

  lib/
    constants/
    forms/
    i18n/
    storages/
    utils/

  pages/
    feature*/
    ...

  styles/
  types/
```

> `feature*` (replace with actual feature name).

## 2) Strict Boundaries for `lib`

`lib` only contains **cross-feature reusable code** (usable by 2 or more features).

- `lib/constants`: app constants, config constants.
- `lib/forms/form-schemas.ts`: single source of truth for all Zod form schemas in the app.
- `lib/i18n`: internationalization setup.
- `lib/storages`: localStorage/sessionStorage/indexedDB wrappers.
- `lib/utils`: pure utility functions shared across the entire app.

Do not place in `lib`:
- `hooks` (place in `src/hooks/shared` or `src/hooks/feature*`),
- `stores` (place in `src/stores/feature*.store.ts`),
- logic specific to 1 feature.

Do not put in `lib`:
- UI components for 1 feature,
- API handlers for 1 feature.

## 3) File Placement Rules by Layer

- `api/<feature>`: HTTP calls only + endpoint mapping.
- `hooks/shared`: hooks shared across multiple features.
- `hooks/<feature>`: feature-specific hooks (including react-query hooks for the feature).
- `stores/<feature>.store.ts`: zustand store per feature, placed **directly** in `stores/`, no subfolders.
- `lib/forms/form-schemas.ts`: **all form schemas must be here** (do not create `*.schema.ts` in feature folders).
- `components/<feature>`: components belonging to that feature.
- `pages/<feature>`: pages for the feature.
- `types`: shared types or API contracts.

## 4) Import Rules

- Feature code should prioritize importing from within the same feature first.
- Only promote to `lib` when proven reusable.
- Shared hooks import from `hooks/shared`; feature-specific hooks import from `hooks/<feature>`.
- Child components export via `index.ts` in each folder for clean imports.

## 5) Application Checklist

- [ ] Has `api/client.ts`, `api/endpoints.ts` as shared resources
- [ ] Each feature has its own branch in `api/hooks/components/stores/pages`
- [ ] `hooks` separates `shared/` and `feature*/`
- [ ] `stores` placed outside `lib`, flat files as `stores/feature*.store.ts`
- [ ] `lib` only contains `constants`, `forms`, `i18n`, `storages`, `utils`
- [ ] All schemas located in `lib/forms/form-schemas.ts`; features do not create separate `*.schema.ts` files
- [ ] `lib` is not used as a dumping ground for everything
- [ ] Uses consistent import alias (`@/...`)
