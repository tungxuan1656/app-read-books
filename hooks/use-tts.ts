import { useEffect, useRef, useCallback } from 'react'
import { DeviceEventEmitter } from 'react-native'
import { Directory, Paths } from 'expo-file-system'
import { RepeatMode } from 'react-native-track-player'
import { breakSummaryIntoLines } from '@/utils/string-helpers'
import { convertTTSCapcut, stopConvertTTSCapcut } from '@/services/tts.service'
import { audioPlayerService } from '@/services/audio-player.service'

// Temp directory for TTS audio files
const TTS_TEMP_DIR = new Directory(Paths.document, 'tts_temp')

/**
 * Hook để xử lý Text-to-Speech
 * - Nhận content, tự động split thành sentences
 * - Convert từng sentence và add vào track-player
 * - Không cache, files lưu tạm với tên ngẫu nhiên
 * - Auto cleanup khi content thay đổi
 */
export function useTTS(content: string, autoPlay: boolean = true) {
  const isProcessingRef = useRef(false)
  const currentTaskIdRef = useRef<string>('')

  // Cleanup TTS temp folder
  const cleanupTempFolder = useCallback(() => {
    try {
      const dirInfo = Paths.info(TTS_TEMP_DIR.uri)
      if (dirInfo.exists && dirInfo.isDirectory) {
        TTS_TEMP_DIR.delete()
        console.log('🗑️ [TTS] Temp folder deleted')
      }
      TTS_TEMP_DIR.create({ intermediates: true, idempotent: true })
      console.log('✅ [TTS] Temp folder recreated')
    } catch (error) {
      console.error('❌ [TTS] Error cleaning temp folder:', error)
    }
  }, [])

  // Stop current TTS process
  const stopTTS = useCallback(async () => {
    console.log('🛑 [TTS] Stopping TTS process...')
    isProcessingRef.current = false
    stopConvertTTSCapcut()
    await audioPlayerService.reset()
    cleanupTempFolder()
  }, [cleanupTempFolder])

  // Start TTS process
  const startTTS = useCallback(async () => {
    if (!content || content.trim().length === 0) {
      console.log('⚠️ [TTS] Empty content, skipping TTS')
      return
    }

    if (isProcessingRef.current) {
      console.log('⚠️ [TTS] Already processing, skipping')
      return
    }

    try {
      isProcessingRef.current = true

      // Generate unique task ID
      const taskId = `tts_${Date.now()}_${Math.random().toString(36).substring(7)}`
      currentTaskIdRef.current = taskId

      console.log(`🎤 [TTS] Starting with task ID: ${taskId}`)

      // Clean content and split into sentences
      const cleanContent = content
        .replace(/<[^><]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()

      const sentences = breakSummaryIntoLines(cleanContent)

      if (sentences.length === 0) {
        console.log('⚠️ [TTS] No sentences to process')
        isProcessingRef.current = false
        return
      }

      console.log(`📝 [TTS] Processing ${sentences.length} sentences`)

      // Reset track player
      await audioPlayerService.reset()

      // Convert sentences to audio
      await convertTTSCapcut(sentences, taskId, TTS_TEMP_DIR.uri)

      console.log('✅ [TTS] Conversion completed')
    } catch (error) {
      console.error('❌ [TTS] Error:', error)
    } finally {
      isProcessingRef.current = false
    }
  }, [content])

  // Listen for audio ready events
  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(
      'tts_audio_ready',
      async (data: { filePath: string; audioTaskId: string; index: number }) => {
        try {
          // Only add if it's from current task
          if (!currentTaskIdRef.current || !data.audioTaskId.startsWith(currentTaskIdRef.current)) {
            return
          }

          const track = {
            id: data.audioTaskId,
            url: data.filePath.startsWith('file://') ? data.filePath : `file://${data.filePath}`,
            title: `TTS ${data.index}`,
            artist: 'TTS Audio',
          }

          await audioPlayerService.addTracks([track])

          // Auto-play first track only
          if (autoPlay && data.index === 3) {
            await audioPlayerService.setRepeatMode(RepeatMode.Off)
            await audioPlayerService.skipToTrack(0)
            await audioPlayerService.setRate(1.2)

            setTimeout(async () => {
              try {
                await audioPlayerService.play()
                console.log('▶️ [TTS] Auto-play started')
              } catch (error) {
                console.error('❌ [TTS] Auto-play error:', error)
              }
            }, 100)
          }
        } catch (error) {
          console.error('❌ [TTS] Error adding track:', error)
        }
      },
    )

    return () => subscription.remove()
  }, [autoPlay])

  // Auto cleanup and restart when content changes
  useEffect(() => {
    stopTTS()
    // Small delay to ensure cleanup completes
    const timer = setTimeout(() => {
      startTTS()
    }, 300)

    return () => {
      clearTimeout(timer)
      stopTTS()
    }
  }, [content])

  return {
    startTTS,
    stopTTS,
    isProcessing: isProcessingRef.current,
  }
}

/**
 * Cleanup TTS temp folder on app start
 */
export function cleanupTTSOnAppStart() {
  try {
    const dirInfo = Paths.info(TTS_TEMP_DIR.uri)
    if (dirInfo.exists && dirInfo.isDirectory) {
      TTS_TEMP_DIR.delete()
      console.log('🗑️ [TTS] Temp folder cleaned on app start')
    }
    TTS_TEMP_DIR.create({ intermediates: true, idempotent: true })
  } catch (error) {
    console.error('❌ [TTS] Error cleaning on app start:', error)
  }
}
