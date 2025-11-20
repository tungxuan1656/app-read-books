import { Directory, Paths } from 'expo-file-system'
import { dbService } from './database-service'
import { convertTTSCapcut } from './convert-tts'
import { breakSummaryIntoLines } from '@/utils/string-helpers'
import { DeviceEventEmitter } from 'react-native'
import type { ReadingMode } from '@/controllers/store'

const TTS_BASE_DIR = new Directory(Paths.document, 'tts_audio')

export class TTSService {
  async generateTTS(
    bookId: string,
    chapter: number,
    mode: ReadingMode,
    content: string
  ): Promise<boolean> {
    try {
      // 1. Check if already generated
      const existingCount = await dbService.getTTSCount(bookId, chapter, mode)
      if (existingCount > 0) {
        console.log(`✅ TTS already exists: ${bookId} ch.${chapter} [${mode}]`)
        await this.emitExistingTTS(bookId, chapter, mode)
        return true
      }

      // 2. Clean HTML and split sentences
      const cleanContent = content.replace(/<[^><]*>/g, ' ').replace(/\s+/g, ' ').trim()

      const sentences = breakSummaryIntoLines(cleanContent)
      if (sentences.length === 0) return false

      console.log(`🎵 Generating TTS: ${sentences.length} sentences [${mode}]`)

      // 3. Create directory structure
      const chapterDir = new Directory(TTS_BASE_DIR, `${bookId}/${chapter}/${mode}`)
      chapterDir.create({ idempotent: true, intermediates: true })

      // 4. Generate TTS for each sentence
      const taskPrefix = `${bookId}_${chapter}_${mode}`

      // Setup listener for TTS completion
      const listener = DeviceEventEmitter.addListener(
        'tts_audio_ready',
        async (data: { filePath: string; audioTaskId: string; index: number }) => {
          if (!data.audioTaskId.startsWith(taskPrefix)) return

          // Save to database
          await dbService.saveTTSAudio(
            bookId,
            chapter,
            mode,
            data.index,
            sentences[data.index],
            data.filePath
          )
        }
      )

      // Call Capcut TTS
      await convertTTSCapcut(sentences, taskPrefix, chapterDir.uri)

      // Cleanup listener
      setTimeout(() => listener.remove(), 5000)

      return true
    } catch (error) {
      console.error('❌ TTS generation failed:', error)
      return false
    }
  }

  private async emitExistingTTS(
    bookId: string,
    chapter: number,
    mode: ReadingMode
  ): Promise<void> {
    const audios = await dbService.getTTSAudios(bookId, chapter, mode)

    for (const audio of audios) {
      DeviceEventEmitter.emit('tts_audio_ready', {
        filePath: audio.file_path,
        audioTaskId: `${bookId}_${chapter}_${mode}_${audio.sentence_index}`,
        index: audio.sentence_index,
      })
    }
  }

  async clearTTS(bookId: string, chapter?: number, mode?: ReadingMode): Promise<void> {
    await dbService.clearTTSCache(bookId, chapter, mode)

    // Also delete files
    const baseDir =
      chapter && mode
        ? new Directory(TTS_BASE_DIR, `${bookId}/${chapter}/${mode}`)
        : new Directory(TTS_BASE_DIR, bookId)

    try {
      baseDir.delete()
    } catch (error) {
      console.error('Error deleting TTS files:', error)
    }
  }
}

export const ttsService = new TTSService()
