export const AppConfigs = {
  API: {
    GEMINI_API_KEY: process.env.EXPO_PUBLIC_GEMINI_API_KEY,
    SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  },
  FEATURES: {
    ENABLE_SUMMARY: true,
    ENABLE_TTS: true,
  },
}
