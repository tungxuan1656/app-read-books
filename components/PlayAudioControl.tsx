import { AppPalette } from '@/assets'
import { VectorIcon } from '@/components/Icon'
import { AppTypo } from '@/constants'
import { cancelTTSConversion, convertTTSCapcut, resetTTSCancellation } from '@/services/convert-tts'
import trackPlayerService from '@/services/track-player-service'
import { breakSummaryIntoLines } from '@/utils/string-helpers'
import React, { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Alert, DeviceEventEmitter, StyleSheet, Text, View } from 'react-native'
import TrackPlayer, {
  Event,
  RepeatMode,
  useIsPlaying,
  useTrackPlayerEvents,
} from 'react-native-track-player'

interface PlayAudioControlProps {
  bookId?: string
  chapterNumber?: number
  bookName?: string
}

export default function PlayAudioControl({
  bookId,
  chapterNumber,
  bookName,
}: PlayAudioControlProps) {
  const [audioFilePaths, setAudioFilePaths] = useState<string[]>([])
  const [currentAudioIndex, setCurrentAudioIndex] = useState<number | null>(null)
  const [isTTSGenerating, setIsTTSGenerating] = useState(false)
  const isPlaying = useIsPlaying()

  useEffect(() => {
    if (!bookId || !chapterNumber) return
    const subs1 = DeviceEventEmitter.addListener(
      `summary_ready_${bookId}_${chapterNumber}`,
      (data: { content: string }) => {
        console.log('🎵 [Audio] Received summary, starting TTS...')
        generateTTSFromSummary(data.content)
      },
    )

    const cancelSubscription = DeviceEventEmitter.addListener(`cancel_audio_${bookId}`, () => {
      console.log('🎵 [Audio] Cancel audio event received')
      handleCancelAudio()
    })

    return () => {
      subs1.remove()
      cancelSubscription.remove()
    }
  }, [bookId, chapterNumber])

  useEffect(() => {
    const subscrition = DeviceEventEmitter.addListener(
      'tts_audio_ready',
      async (data: { filePath: string; sentenceIndex: number; name: string }) => {
        console.log('🎵 [Audio] TTS audio ready:', data)

        try {
          const track = {
            id: data.name,
            url: data.filePath.startsWith('file://') ? data.filePath : `file://${data.filePath}`,
            title: `Part ${data.sentenceIndex + 1}`,
            artist: bookName || 'Unknown',
          }

          await trackPlayerService.addTracks([track])

          setAudioFilePaths((prev) => {
            const newPaths = [...prev]
            newPaths[data.sentenceIndex] = data.filePath
            return newPaths
          })

          // Auto-play first track only
          if (data.sentenceIndex === 3) {
            setCurrentAudioIndex(0)
            await trackPlayerService.setRepeatMode(RepeatMode.Off)
            await trackPlayerService.skipToTrack(0)
            TrackPlayer.setRate(1.5)
            // Start playing immediately when first track is ready
            setTimeout(async () => {
              try {
                await trackPlayerService.play()
                console.log('🎵 [Audio] Auto-playing first track')
              } catch (error) {
                console.error('🎵 [Audio] Auto-play error:', error)
              }
            }, 100)
          }
        } catch (error) {
          console.error('🎵 [Audio] Error adding track:', error)
        }
      },
    )

    return () => subscrition.remove()
  }, [])

  useTrackPlayerEvents([Event.PlaybackActiveTrackChanged], (event) => {
    if (event.type === Event.PlaybackActiveTrackChanged && event.index !== undefined) {
      setCurrentAudioIndex(event.index)
    }
  })

  const generateTTSFromSummary = useCallback(
    async (content: string) => {
      if (!content || !bookId || !chapterNumber) return

      setIsTTSGenerating(true)
      resetTTSCancellation()

      try {
        const sentences = breakSummaryIntoLines(content)
        if (sentences.length === 0) return
        await trackPlayerService.reset()
        setAudioFilePaths([])
        setCurrentAudioIndex(null)
        await convertTTSCapcut(sentences, {
          voice: 'BV421_vivn_streaming',
          bookId,
          chapterNumber,
        })
      } catch (error) {
        console.error('🎵 [TTS] Error:', error)
        Alert.alert('Lỗi TTS', 'Không thể tạo audio từ nội dung tóm tắt')
      } finally {
        setIsTTSGenerating(false)
      }
    },
    [bookId, chapterNumber],
  )

  // Cancel audio generation and playback
  const handleCancelAudio = useCallback(async () => {
    if (isTTSGenerating) {
      cancelTTSConversion()
      setIsTTSGenerating(false)
    }
    await trackPlayerService.reset()
    setAudioFilePaths([])
    setCurrentAudioIndex(null)
  }, [isTTSGenerating])

  // Handle play/pause
  const handlePlayPause = useCallback(async () => {
    if (isPlaying) {
      await trackPlayerService.pause()
    } else {
      if (currentAudioIndex === null && audioFilePaths.length > 0) {
        await trackPlayerService.skipToTrack(0)
      }
      await trackPlayerService.play()
    }
  }, [isPlaying, currentAudioIndex, audioFilePaths])

  // Navigation handlers
  const handlePrevious = useCallback(async () => {
    if (currentAudioIndex !== null && currentAudioIndex > 0) {
      await trackPlayerService.skipToPrevious()
    }
  }, [currentAudioIndex])

  const handleNext = useCallback(async () => {
    if (currentAudioIndex !== null && currentAudioIndex < audioFilePaths.length - 1) {
      await trackPlayerService.skipToNext()
    }
  }, [currentAudioIndex, audioFilePaths.length])

  // Cleanup
  useEffect(() => {
    return () => {
      if (isTTSGenerating) cancelTTSConversion()
    }
  }, [isTTSGenerating])

  return (
    <View style={styles.ttsContainer}>
      <Text style={[AppTypo.caption.medium, styles.progressText]}>
        {currentAudioIndex !== null ? currentAudioIndex + 1 : '-'} /{' '}
        {audioFilePaths.length || (isTTSGenerating ? audioFilePaths.length : 0)}
      </Text>
      {audioFilePaths.length === 0 ? (
        <ActivityIndicator size={'small'} color={'#FFF'} style={{ paddingVertical: 4 }} />
      ) : (
        <>
          <VectorIcon
            name={'backward'}
            font="FontAwesome6"
            size={16}
            buttonStyle={{ width: 32, height: 32 }}
            color={AppPalette.white}
            onPress={handlePrevious}
          />
          <VectorIcon
            name={isPlaying.playing ? 'pause' : 'play'}
            font="FontAwesome6"
            size={16}
            buttonStyle={{ width: 32, height: 32 }}
            color={AppPalette.white}
            onPress={handlePlayPause}
          />
          <VectorIcon
            name={'forward'}
            font="FontAwesome6"
            size={16}
            buttonStyle={{ width: 32, height: 32 }}
            color={AppPalette.white}
            onPress={handleNext}
          />
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  ttsContainer: {
    backgroundColor: AppPalette.gray400,
    borderRadius: 100,
    flexDirection: 'row',
    alignSelf: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 16,
    gap: 8,
  },
  progressText: {
    color: AppPalette.white,
    marginRight: 8,
  },
})
