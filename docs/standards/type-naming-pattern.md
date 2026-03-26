# Type Naming Pattern (DTO / Request / Response)

## 1) Required Rules

- Remote transport shape: suffix `DTO`.
- Input payload to API/provider/service boundary: suffix `Request`.
- Output payload from API/provider/service boundary: suffix `Response`.

## 2) Domain Naming

- Keep domain terms explicit: `Book`, `Chapter`, `Reading`, `TTS`, `AIAction`.
- Avoid vague names (`Data`, `Payload`, `Result`) unless a boundary type explicitly requires them.

## 3) Example

```ts
export type BookDTO = {
  id: string
  name: string
  references: string[]
}

export type ProcessChapterRequest = {
  bookId: string
  chapterNumber: number
  actionKey: string
}

export type ProcessChapterResponse = {
  content: string
  cached: boolean
}
```

## 4) Store Types

- Store slices should use semantic names:
  - `Typography`
  - `Settings`
  - `Reading`
- Keep interface names singular and meaningful.

## 5) Checklist

- [ ] Boundary types use DTO/Request/Response consistently.
- [ ] Domain models have explicit names.
- [ ] No mixed or ambiguous naming style in the same module.
