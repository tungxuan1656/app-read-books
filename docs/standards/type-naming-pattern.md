# Type Naming Pattern (DTO / Request / Response)

## 1) Required Rules

- Data objects exchanged between FE/BE: suffix `DTO`.
- Data types sent to API: suffix `Request`.
- Data types received from API (beyond the common wrapper): suffix `Response`.

## 2) Naming Conventions

- Entity DTO: `UserDTO`, `GoalDTO`, `JournalEntryDTO`.
- API input: `CreateDeedRequest`, `UpdateMeRequest`, `GetGoalHistoryRequest`.
- API business output: `AuthResponse`, `SessionResponse`, `GoalHistoryResponse`.
- Common wrapper remains: `ApiResponse<T>`.

## 3) Standard Template

```ts
export type UserDTO = {
  id: string
  email: string
  name: string
}

export type UpdateMeRequest = {
  name?: string
  avatarUrl?: string
}

export type GoalHistoryResponse = {
  items: GoalHistoryItemDTO[]
  pagination: PaginationDTO
}
```

## 4) Usage in API Functions

```ts
export const updateMe = async (
  payload: UpdateMeRequest,
): Promise<ApiResponse<UserDTO>> => {
  const response = await client.patch<ApiResponse<UserDTO>>(API_ENDPOINTS.users.me, payload)
  return response.data
}
```

## 5) Do Not Use

- `UserData`, `GoalModel`, `Payload`, `Result` (ambiguous, non-standard).
- Mixing DTO with Request/Response in the same type name.

## 6) Quick Checklist

- [ ] Data exchange type objects have `DTO` suffix
- [ ] API input types have `Request` suffix
- [ ] API business output types have `Response` suffix
- [ ] API functions return explicitly typed `Promise<ApiResponse<...>>`
