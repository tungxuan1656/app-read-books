export interface AIAction {
  key: string
  name: string
  prompt: string
}

export interface AppSettings {
  OPENAI_API_URL: string
  OPENAI_MODEL: string
  AI_CUSTOM_HEADERS: string
  BOOKS_API_URL: string
  PREFETCH_COUNT: string
  AI_PROVIDER: 'openai'
  AI_PROCESS_ACTIONS: AIAction[]
  AI_MIN_CHUNK_SIZE: string
}

export interface Typography {
  font: string
  fontSize: number
  lineHeight: number
  letterSpacing: number
}

export interface ReadingState {
  bookId: string
  onScreen: boolean
  offset: number
}
