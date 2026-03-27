export interface AIAction {
  key: string
  name: string
  prompt: string
}

export interface AppSettings {
  COPILOT_API_URL: string
  COPILOT_MODEL: string
  SUPABASE_ANON_KEY: string
  PREFETCH_COUNT: string
  AI_PROVIDER: 'copilot'
  AI_PROCESS_ACTIONS: AIAction[]
  COPILOT_MIN_CHUNK_SIZE: string
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
