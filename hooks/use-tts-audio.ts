import {
  convertTTSCapcut,
  resetTTSCancellation,
  stopConvertTTSCapcut,
} from '@/services/convert-tts'
import trackPlayerService from '@/services/track-player-service'
import { breakSummaryIntoLines } from '@/utils/string-helpers'
import React, { useCallback, useEffect, useState } from 'react'
import { Alert, DeviceEventEmitter } from 'react-native'
import { Event, RepeatMode, useIsPlaying, useTrackPlayerEvents } from 'react-native-track-player'

export default function useTtsAudio(autoPlay = true) {
  const [listAudios, setListAudios] = useState<string[]>([])
  const [currentAudioIndex, setCurrentAudioIndex] = useState<number | null>(null)
  const isPlaying = useIsPlaying()

  const startGenerateAudio = useCallback(
    async (content: string, bookId: string, chapter: number) => {
      try {
        const sentences = breakSummaryIntoLines(content)
        if (sentences.length === 0) return
        await trackPlayerService.reset()
        setListAudios([])
        setCurrentAudioIndex(null)
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
    setListAudios([])
    setCurrentAudioIndex(null)
    stopConvertTTSCapcut()
  }, [])

  useEffect(() => {
    const subscrition = DeviceEventEmitter.addListener(
      'tts_audio_ready',
      async (data: { filePath: string; audioTaskId: string; index: number }) => {
        try {
          setListAudios((prev) => {
            const newPaths = [...prev]
            newPaths.push(data.filePath)
            return newPaths
          })

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
              setCurrentAudioIndex(0)
              await trackPlayerService.setRepeatMode(RepeatMode.Off)
              await trackPlayerService.skipToTrack(0)
              await trackPlayerService.setRate(1.5)

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

  useTrackPlayerEvents([Event.PlaybackActiveTrackChanged], (event) => {
    if (event.type === Event.PlaybackActiveTrackChanged && event.index !== undefined) {
      setCurrentAudioIndex(event.index)
    }
  })

  const handlePlayPause = useCallback(async () => {
    if (isPlaying) {
      await trackPlayerService.pause()
    } else {
      await trackPlayerService.play()
    }
  }, [isPlaying])

  // Navigation handlers
  const handlePrevious = useCallback(() => {
    trackPlayerService.skipToPrevious()
  }, [])

  const handleNext = useCallback(() => {
    trackPlayerService.skipToNext()
  }, [])

  return {
    listAudios,
    currentAudioIndex,
    isPlaying,
    startGenerateAudio,
    stopGenerateAudio,
    handlePlayPause,
    handlePrevious,
    handleNext,
  }
}
