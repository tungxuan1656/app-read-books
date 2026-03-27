export interface ServiceError {
  code: string
  message: string
  cause?: unknown
}

export type ServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ServiceError }

export const ok = <T>(data: T): ServiceResult<T> => ({ ok: true, data })

export const fail = <T = never>(
  code: string,
  message: string,
  cause?: unknown,
): ServiceResult<T> => ({
  ok: false,
  error: { code, message, cause },
})
