import { MMKV } from 'react-native-mmkv'
import { Directory, Paths } from 'expo-file-system'
import { dbService } from '@/services/database.service'

export async function migrateToNewSystem() {
  console.log('🔄 Starting migration to new cache system...')

  try {
    // 1. Clear old MMKV caches
    try {
      const summaryCache = new MMKV({ id: 'summary-cache', encryptionKey: 'chapter-summaries' })
      summaryCache.clearAll()
      console.log('✅ Cleared old summary cache (MMKV)')
    } catch (e) {
      console.log('⚠️ Summary cache already cleared or not found')
    }

    try {
      const ttsCache = new MMKV({ id: 'tts-cache', encryptionKey: 'tts-audio-files' })
      ttsCache.clearAll()
      console.log('✅ Cleared old TTS cache (MMKV)')
    } catch (e) {
      console.log('⚠️ TTS cache already cleared or not found')
    }

    // 2. Delete old TTS directory
    try {
      const oldTTSDir = new Directory(Paths.document, 'tts_audio')
      if (oldTTSDir.exists) {
        oldTTSDir.delete()
        console.log('✅ Deleted old TTS directory')
      }
    } catch (e) {
      console.log('⚠️ Old TTS directory not found or already deleted')
    }

    // 3. Initialize new database
    await dbService.initialize()
    console.log('✅ Initialized new SQLite database')

    // 4. Create new TTS directory structure
    const newTTSDir = new Directory(Paths.document, 'tts_audio')
    newTTSDir.create({ idempotent: true })
    console.log('✅ Created new TTS directory structure')

    console.log('✅ Migration completed successfully!')
    return true
  } catch (error) {
    console.error('❌ Migration failed:', error)
    return false
  }
}
