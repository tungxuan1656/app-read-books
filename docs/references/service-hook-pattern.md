# Service + Hook Data Pattern (Current Project Standard)

> This project currently does not use TanStack React Query.
> Use service-first architecture with explicit cache and store integration.

## 1) Standard Structure

```text
services/
  <domain>.service.ts
  ai-providers/*.provider.ts

hooks/
  use-<domain>.ts

utils/
  <domain>.helpers.ts
```

## 2) Rules

- Components/screens should consume hooks, not raw service calls directly (except small local actions).
- Services own side effects and IO:
  - network calls
  - filesystem operations
  - sqlite cache access
- Hooks orchestrate:
  - loading state
  - user-facing messages
  - subscriptions/lifecycle

## 3) Caching Strategy

- AI processed chapter cache:
  - `services/database.service.ts` — SQLite CRUD (`processed_chapters`)
  - `services/content-processor.ts` — cache-first processing, in-flight dedup
- File-level cache and cleanup:
  - `utils/file-system.helpers.ts`
- Always check cache before expensive remote processing.

## 4) Service Template

```ts
// services/example.service.ts
export const getExample = async (id: string): Promise<string> => {
  // 1) read cache if available
  // 2) fetch/process if missing
  // 3) persist cache if needed
  // 4) return result
  return ''
}
```

## 5) Hook Template

```ts
// hooks/use-example.ts
import { useEffect, useState } from 'react'
import { getExample } from '@/services/example.service'

export default function useExample(id: string) {
  const [data, setData] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const run = async () => {
      setLoading(true)
      setError(null)
      try {
        const result = await getExample(id)
        if (active) setData(result)
      } catch (e) {
        if (active) setError('Failed to load')
      } finally {
        if (active) setLoading(false)
      }
    }
    run()
    return () => {
      active = false
    }
  }, [id])

  return { data, loading, error }
}
```

## 6) Checklist

- [ ] IO logic lives in services, not UI files.
- [ ] Hook handles lifecycle and state transitions.
- [ ] Cache checked before remote processing.
- [ ] Error path is explicit and user-visible at hook/screen layer.
