import { useLocalSearchParams } from 'expo-router'
import { useMemo } from 'react'

type Parser = 'boolean' | 'number' | 'json' | 'date' | 'string'

type ParserMap = Record<string, Parser>

const parseValue = (value: string | string[] | undefined, parser?: Parser): any => {
  if (typeof value !== 'string') {
    return value
  }

  switch (parser) {
    case 'boolean':
      return value === 'true'
    case 'number': {
      const num = Number(value)
      return isNaN(num) ? undefined : num
    }
    case 'json':
      try {
        if (value) {
          return JSON.parse(value)
        }
        return undefined
      } catch {
        return undefined
      }
    case 'date':
      return new Date(value)
    default:
      return value
  }
}

const stringifyValue = (value: any): string | undefined => {
  if (value === null || value === undefined) {
    return undefined
  }

  const type = typeof value
  if (type === 'string') {
    return value
  }
  if (type === 'boolean' || type === 'number') {
    return value.toString()
  }
  if (value instanceof Date) {
    return value.toISOString()
  }
  if (type === 'object') {
    try {
      return JSON.stringify(value)
    } catch {
      return undefined
    }
  }
  return String(value)
}

/**
 * Converts an object with various value types into an object with string values,
 * suitable for URL search parameters.
 *
 * @param params - The object to stringify.
 * @returns An object where all values are strings.
 */
export function stringifyParams<T extends Record<string, any>>(params: T): Record<string, string> {
  const result: Record<string, string> = {}

  for (const key in params) {
    if (Object.prototype.hasOwnProperty.call(params, key)) {
      const value = params[key]
      const stringified = stringifyValue(value)
      if (stringified !== undefined) {
        result[key] = stringified
      }
    }
  }

  return result
}

/**
 * A hook that wraps `useLocalSearchParams` to provide typed and parsed search parameters.
 *
 * @param parserMap - An object where keys are search param names and values are the desired type ('boolean', 'number', 'json', 'date').
 * @returns An object containing the parsed search parameters.
 */
export function useTypedLocalSearchParams<T extends Record<string, any>>(parserMap: ParserMap): T {
  const params = useLocalSearchParams()
  const stableParserMap = useMemo(() => parserMap, [JSON.stringify(parserMap)])
  const stableParams = useMemo(() => params, [JSON.stringify(params)])

  const typedParams = useMemo(() => {
    const result: Record<string, any> = { ...stableParams }

    for (const key in stableParserMap) {
      if (Object.prototype.hasOwnProperty.call(stableParams, key)) {
        const parser = stableParserMap[key]
        const value = stableParams[key]
        result[key] = parseValue(value, parser)
      }
    }

    return result
  }, [stableParams, stableParserMap])

  return typedParams as T
}
