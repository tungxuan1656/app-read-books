import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  DeviceEventEmitter,
  EmitterSubscription,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import TrackPlayer, {
  Event,
  State,
  useTrackPlayerEvents,
  usePlaybackState,
  RepeatMode,
  useIsPlaying,
} from 'react-native-track-player'
import { AppPalette } from '@/assets'
import { VectorIcon } from '@/components/Icon'
import { AppTypo } from '@/constants'
import TrackPlayerService from '@/services/track-player-service'
import { convertTTSCapcut, cancelTTSConversion, resetTTSCancellation } from '@/services/convert-tts'
import { breakSummaryIntoLines } from '@/utils/string-helpers'
import { showToastError } from '@/utils'

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
  // States
  const [audioFilePaths, setAudioFilePaths] = useState<string[]>([])
  const [currentAudioIndex, setCurrentAudioIndex] = useState<number | null>(null)
  const [isTTSGenerating, setIsTTSGenerating] = useState(false)
  const [ttsProgress, setTtsProgress] = useState({ current: 0, total: 0 })

  // Refs
  const ttsEventSubscription = useRef<EmitterSubscription | null>(null)
  const summaryEventSubscription = useRef<EmitterSubscription | null>(null)

  // Hooks
  const trackPlayerService = TrackPlayerService.getInstance()
  const playbackState = usePlaybackState()
  const isPlaying = useIsPlaying()

  // Event listeners setup
  useEffect(() => {
    if (!bookId || !chapterNumber) return

    // Summary ready listener
    summaryEventSubscription.current = DeviceEventEmitter.addListener(
      `summary_ready_${bookId}_${chapterNumber}`,
      (data: { content: string }) => {
        console.log('🎵 [Audio] Received summary, starting TTS...')
        generateTTSFromSummary(data.content)
      },
    )

    // Cancel audio listener
    const cancelSubscription = DeviceEventEmitter.addListener(`cancel_audio_${bookId}`, () => {
      console.log('🎵 [Audio] Cancel audio event received')
      handleCancelAudio()
    })

    return () => {
      summaryEventSubscription.current?.remove()
      cancelSubscription.remove()
    }
  }, [bookId, chapterNumber])

  // TTS audio ready listener
  useEffect(() => {
    ttsEventSubscription.current = DeviceEventEmitter.addListener(
      'tts_audio_ready',
      async (data: { filePath: string; sentenceIndex: number }) => {
        try {
          setTtsProgress((prev) => ({ ...prev, current: prev.current + 1 }))

          const track = {
            id: `tts-${bookId}-${chapterNumber}-${data.sentenceIndex}`,
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
          if (data.sentenceIndex === 0) {
            setCurrentAudioIndex(0)
            await trackPlayerService.setRepeatMode(RepeatMode.Off)
            await trackPlayerService.skipToTrack(0)
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

    return () => ttsEventSubscription.current?.remove()
  }, [bookId, chapterNumber, bookName])

  // Track change listener
  useTrackPlayerEvents([Event.PlaybackActiveTrackChanged], (event) => {
    if (event.type === Event.PlaybackActiveTrackChanged && event.index !== undefined) {
      setCurrentAudioIndex(event.index)
    }
  }) // Generate TTS from summary
  const generateTTSFromSummary = useCallback(
    async (content: string) => {
      if (!content || !bookId || !chapterNumber) return

      setIsTTSGenerating(true)
      resetTTSCancellation()

      try {
        const sentences = breakSummaryIntoLines(content).slice(0, 5)
        if (sentences.length === 0) return

        setTtsProgress({ current: 0, total: sentences.length })
        await trackPlayerService.reset()
        setAudioFilePaths([])
        setCurrentAudioIndex(null)

        console.log('🎵 [TTS] Starting conversion for', sentences.length, 'sentences')

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
      setTtsProgress({ current: 0, total: 0 })
    }
    await trackPlayerService.reset()
    setAudioFilePaths([])
    setCurrentAudioIndex(null)
  }, [isTTSGenerating])

  // Handle play/pause
  const handlePlayPause = useCallback(async () => {
    if (currentAudioIndex === null || audioFilePaths.length === 0) {
      console.log('🎵 [PlayPause] No audio available')
      return
    }

    try {
      const currentState = playbackState.state

      if (currentState === State.Error) {
        // Reload tracks on error
        console.log('🎵 [PlayPause] Recovering from error state...')
        await trackPlayerService.reset()

        const tracks = audioFilePaths.map((path, index) => ({
          id: `tts-${bookId}-${chapterNumber}-${index}`,
          url: path.startsWith('file://') ? path : `file://${path}`,
          title: `Part ${index + 1}`,
          artist: bookName || 'Unknown',
        }))

        await trackPlayerService.addTracks(tracks)
        await trackPlayerService.skipToTrack(currentAudioIndex)
        await trackPlayerService.play()
      } else if (currentState === State.Playing) {
        await trackPlayerService.pause()
      } else {
        await trackPlayerService.play()
      }
    } catch (error) {
      console.error('🎵 [PlayPause] Error:', error)
      showToastError('Lỗi khi phát/dừng audio.')
    }
  }, [currentAudioIndex, audioFilePaths, playbackState.state, bookId, chapterNumber, bookName])

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
      ttsEventSubscription.current?.remove()
      summaryEventSubscription.current?.remove()
      if (isTTSGenerating) cancelTTSConversion()
    }
  }, [isTTSGenerating])

  return (
    <View style={styles.ttsContainer}>
      <Text style={[AppTypo.caption.medium, styles.progressText]}>
        {currentAudioIndex !== null ? currentAudioIndex + 1 : '-'} /{' '}
        {audioFilePaths.length || (isTTSGenerating ? ttsProgress.total : 0)}
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
