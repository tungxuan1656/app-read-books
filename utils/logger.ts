const isDev = __DEV__

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const shouldLog = (level: LogLevel): boolean => {
  if (isDev) return true
  return level === 'warn' || level === 'error'
}

const formatTag = (tag: string): string => `[${tag}]`

const debug = (tag: string, message: string, ...meta: unknown[]) => {
  if (!shouldLog('debug')) return
  console.debug(formatTag(tag), message, ...meta)
}

const info = (tag: string, message: string, ...meta: unknown[]) => {
  if (!shouldLog('info')) return
  console.info(formatTag(tag), message, ...meta)
}

const warn = (tag: string, message: string, ...meta: unknown[]) => {
  if (!shouldLog('warn')) return
  console.warn(formatTag(tag), message, ...meta)
}

const error = (tag: string, message: string, ...meta: unknown[]) => {
  if (!shouldLog('error')) return
  console.error(formatTag(tag), message, ...meta)
}

export const logger = {
  debug,
  info,
  warn,
  error,
}
