# API + React Query Pattern (Quick Implementation)

## 1) Standard Structure

```text
src/
  api/
    client.ts
    endpoints.ts
    <domain>.ts
    <domain>.mock.ts   ← mock fixtures (only used when backend is not ready)
  hooks/api/
    use-<domain>.ts
```

- API layer: HTTP calls only, fully typed.
- Hook layer: manages cache, keys, invalidation, data transformation.
- Mock layer: fixtures separated into `<domain>.mock.ts`, **not embedded directly** in components or hooks.

## 2) Hard Rules

- All endpoints must be declared in `API_ENDPOINTS`.
- Hook queries must always have `queryKey` from `*_KEYS`.
- Successful mutations must `invalidateQueries` with the correct scope.
- UI should only call hooks, not directly call `api/*` files.
- **Do not use `select: (data) => data`** — identity callbacks that don't transform anything must be removed entirely.
- **Before adding a new query/hook**, check if the data can be derived from an existing store or query — avoid parallel API calls for data that has already been fetched.

## 2a) Mock Data Pattern

When backend is not ready, mocks must be placed in `api/<domain>.mock.ts`, **not embedded inline** in components:

```ts
// api/shifts.mock.ts
import type { ShiftSlot } from '@/types/shift'

// Mock fixtures — replace with real HTTP call once backend is available.
export const MOCK_SHIFTS: ShiftSlot[] = [...]
```

API module imports and re-exports mock with a clear TODO:

```ts
// api/shifts.ts
import { MOCK_SHIFTS } from './shifts.mock'

// TODO: Replace with real HTTP call once backend endpoint is available.
// Example: return client.get<ApiResponse<ShiftSlot[]>>(API_ENDPOINTS.shifts.slots)
export const getShiftSlots = async (): Promise<ShiftSlot[]> => {
  return Promise.resolve(MOCK_SHIFTS)
}
```

## 3) API Module Template

```ts
// api/example.ts
import type { ApiResponse, ExampleDTO, CreateExampleRequest } from '@/types/api'
import { client } from './client'
import { API_ENDPOINTS } from './endpoints'

export const getExamples = async (): Promise<ApiResponse<ExampleDTO[]>> => {
  const response = await client.get<ApiResponse<ExampleDTO[]>>(API_ENDPOINTS.examples.list)
  return response.data
}

export const createExample = async (
  payload: CreateExampleRequest,
): Promise<ApiResponse<ExampleDTO>> => {
  const response = await client.post<ApiResponse<ExampleDTO>>(API_ENDPOINTS.examples.list, payload)
  return response.data
}
```

## 4) Hook Module Template

```ts
// hooks/api/use-example.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { createExample, getExamples } from '@/api/example'

export const EXAMPLE_KEYS = {
  all: ['examples'] as const,
  list: () => [...EXAMPLE_KEYS.all, 'list'] as const,
}

export const useExamples = () => {
  return useQuery({
    queryKey: EXAMPLE_KEYS.list(),
    queryFn: getExamples,
    select: (res) => res.data, // UI receives plain data
  })
}

export const useCreateExample = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createExample,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EXAMPLE_KEYS.all })
    },
  })
}
```

## 5) Query Key Pattern

```ts
export const DOMAIN_KEYS = {
  all: ['domain'] as const,
  list: (params?: unknown) => ['domain', 'list', params] as const,
  detail: (id: string) => ['domain', 'detail', id] as const,
}
```

## 6) Infinite Query Pattern

```ts
useInfiniteQuery({
  queryKey: DOMAIN_KEYS.list(params),
  queryFn: ({ pageParam }) => getItems({ ...params, cursor: pageParam }),
  initialPageParam: undefined as string | undefined,
  getNextPageParam: (lastPage) =>
    lastPage.success && lastPage.data?.pagination.hasMore
      ? lastPage.data.pagination.nextCursor
      : undefined,
})
```

## 7) Mapping to Existing Code

- HTTP client + refresh token: [src/api/client.ts](../../src/api/client.ts)
- Endpoint registry: [src/api/endpoints.ts](../../src/api/endpoints.ts)
- Example hook domain (query + mutation + invalidate): [src/hooks/api/use-deeds.ts](../../src/hooks/api/use-deeds.ts)
- Example infinite query hook: [src/hooks/api/use-inner-journal.ts](../../src/hooks/api/use-inner-journal.ts)
- Global QueryClient + cache persist: [src/main.tsx](../../src/main.tsx)

## 8) Checklist When Adding a New API

- [ ] Add endpoint to `API_ENDPOINTS`
- [ ] Create function in `api/<domain>.ts`
- [ ] Create `*_KEYS` in `hooks/api/use-<domain>.ts`
- [ ] Write corresponding `useQuery`/`useMutation`
- [ ] Add `invalidateQueries` for mutations
- [ ] Use `select` to return plain data for UI — **remove `select: (data) => data`** if not transforming
- [ ] If using mock: separate into `api/<domain>.mock.ts` + add comment `// TODO: replace with real HTTP call`
- [ ] Check if data already exists in another store/query before creating a new hook
