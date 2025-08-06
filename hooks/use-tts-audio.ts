import { convertTTSCapcut, stopConvertTTSCapcut } from '@/services/convert-tts'
import trackPlayerService from '@/services/track-player-service'
import { breakSummaryIntoLines } from '@/utils/string-helpers'
import React, { useCallback, useEffect } from 'react'
import { Alert, DeviceEventEmitter } from 'react-native'
import { RepeatMode } from 'react-native-track-player'

export default function useTtsAudio(autoPlay = true) {
  const startGenerateAudio = useCallback(
    async (content: string, bookId: string, chapter: number) => {
      try {
        const sentences = breakSummaryIntoLines(
          content
            .replace(/<[^><]*>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim(),
        )

        if (sentences.length === 0) return
        await trackPlayerService.reset()
        console.log(sentences.slice(0, 3))

        await convertTTSCapcut(sentences, `${bookId}_${chapter}`)
        return true
      } catch (error) {
        Alert.alert('Lỗi TTS', 'Không thể tạo audio từ nội dung tóm tắt')
      }
      return false
    },
    [],
  )

  const stopGenerateAudio = useCallback(async () => {
    await trackPlayerService.reset()
    stopConvertTTSCapcut()
  }, [])

  useEffect(() => {
    const subscrition = DeviceEventEmitter.addListener(
      'tts_audio_ready',
      async (data: { filePath: string; audioTaskId: string; index: number }) => {
        try {
          if (autoPlay) {
            const track = {
              id: data.audioTaskId,
              url: data.filePath.startsWith('file://') ? data.filePath : `file://${data.filePath}`,
              title: `${data.audioTaskId}`,
              artist: 'TTS Capcut',
            }
            await trackPlayerService.addTracks([track])
            // Auto-play first track only
            if (data.index === 3) {
              await trackPlayerService.setRepeatMode(RepeatMode.Off)
              await trackPlayerService.skipToTrack(0)
              await trackPlayerService.setRate(1.2)

              setTimeout(async () => {
                try {
                  await trackPlayerService.play()
                } catch (error) {
                  console.error('🎵 [Audio] Auto-play error:', error)
                }
              }, 100)
            }
          }
        } catch (error) {
          console.error('🎵 [Audio] Error adding track:', error)
        }
      },
    )

    return () => subscrition.remove()
  }, [autoPlay])

  return React.useMemo(
    () => ({
      startGenerateAudio,
      stopGenerateAudio,
    }),
    [startGenerateAudio, stopGenerateAudio],
  )
}
