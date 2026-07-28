# Dialog & Form Interaction Pattern (React Native)

## 1) Preferred Interaction Types

- **Quick confirmation**: use `Alert.alert`.
- **Rich modal/sheet workflow**: use `@gorhom/bottom-sheet`.
- **Inline form section**: render directly in screen and save explicitly.

## 2) Confirmation Pattern

```tsx
Alert.alert('Delete book', 'Are you sure?', [
  { text: 'Cancel', style: 'cancel' },
  { text: 'Delete', style: 'destructive', onPress: handleDelete },
])
```

Use for destructive actions with no complex form inputs.

## 3) Bottom Sheet Pattern

- Keep sheet component reusable (`components/sheet-*.tsx`).
- Control open/close via ref from parent when needed.
- Avoid embedding heavy business logic in sheet component.

## 4) Form-in-Sheet Rules

- Draft state in component/hook.
- Validate before save.
- Commit through store actions or service call.
- Close sheet only after successful commit (or explicit cancel).

## 5) Checklist

- [ ] Chosen interaction type matches complexity.
- [ ] Destructive actions have confirmation.
- [ ] Sheet logic remains UI-focused.
- [ ] Save/cancel behavior is deterministic.
