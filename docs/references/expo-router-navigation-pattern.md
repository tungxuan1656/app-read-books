# Expo Router Navigation Pattern

## 1) Route Structure

- Use file-based routing under `app/`.
- Each screen should be `app/<feature>/index.tsx`.
- Keep `_layout.tsx` responsible for app-level providers and stack config.

## 2) Navigation Rules

- Use `router.push` for forward navigation.
- Use `router.back` for simple back behavior.
- Keep navigation params serializable.
- Prefer typed param helpers (for example `use-typed-local-search-params`).

## 3) Param Safety

- Validate required params at screen entry.
- If param is missing or invalid, fail gracefully (show error fallback or navigate back).
- Avoid ad-hoc parsing logic duplicated across screens.

## 4) Example Pattern

```ts
router.push({
  pathname: '/reading',
  params: stringifyParams({ bookId }),
})
```

## 5) Checklist

- [ ] Route file path follows Expo Router convention.
- [ ] Screen validates incoming params.
- [ ] Navigation uses centralized helper for param serialization when needed.
- [ ] No business logic hidden in navigation callbacks.
