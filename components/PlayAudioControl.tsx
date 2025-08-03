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
  // TTS states
  const [audioFilePaths, setAudioFilePaths] = useState<string[]>([])
  const [currentAudioIndex, setCurrentAudioIndex] = useState<number | null>(null)
  const [isTTSGenerating, setIsTTSGenerating] = useState(false)
  const [ttsProgress, setTtsProgress] = useState({ current: 0, total: 0 })

  // Event subscription refs
  const ttsEventSubscription = useRef<EmitterSubscription | null>(null)
  const summaryEventSubscription = useRef<EmitterSubscription | null>(null)

  // Track Player setup
  const trackPlayerService = TrackPlayerService.getInstance()
  const playbackState = usePlaybackState()
  const isPlaying = useIsPlaying()

  // Setup event listeners
  useEffect(() => {
    const setupEventListeners = () => {
      // Listen for summary content from ReviewBottomSheet
      if (summaryEventSubscription.current) {
        summaryEventSubscription.current.remove()
      }

      summaryEventSubscription.current = DeviceEventEmitter.addListener(
        `summary_ready_${bookId}_${chapterNumber}`,
        async (data: { content: string }) => {
          console.log(
            '🎵 [PlayAudioControl] Received summary content:',
            data.content.substring(0, 100) + '...',
          )
          await generateTTSFromSummary(data.content)
        },
      )

      // Listen for chapter navigation events
      const cancelEventSubscription = DeviceEventEmitter.addListener(
        `cancel_audio_${bookId}`,
        async () => {
          console.log('🎵 [PlayAudioControl] Received cancel audio event')
          await handleCancelAudio()
        },
      )

      return () => {
        if (summaryEventSubscription.current) {
          summaryEventSubscription.current.remove()
        }
        cancelEventSubscription.remove()
      }
    }

    if (bookId && chapterNumber) {
      return setupEventListeners()
    }
  }, [bookId, chapterNumber])

  // TTS audio ready event listener
  useEffect(() => {
    if (ttsEventSubscription.current) {
      ttsEventSubscription.current.remove()
    }

    ttsEventSubscription.current = DeviceEventEmitter.addListener(
      'tts_audio_ready',
      async (data: { filePath: string; sentenceIndex: number; isFromCache: boolean }) => {
        console.log('🎵 [TTS Event] Audio ready:', data)

        try {
          // Update progress
          setTtsProgress((prev) => ({ ...prev, current: prev.current + 1 }))

          // Prepare track for TrackPlayer
          const normalizedPath = data.filePath.startsWith('file://')
            ? data.filePath
            : `file://${data.filePath}`

          const track = {
            id: `tts-${bookId}-${chapterNumber}-${data.sentenceIndex}`,
            url: normalizedPath,
            title: `TTS Part ${data.sentenceIndex + 1}`,
            artist: bookName || 'Unknown',
          }

          // Add track to TrackPlayer
          await trackPlayerService.addTracks([track])

          // Update audio file paths state
          setAudioFilePaths((prev) => {
            const newPaths = [...prev]
            newPaths[data.sentenceIndex] = data.filePath
            return newPaths
          })

          // If this is the first track, set it as current and start playing
          if (data.sentenceIndex === 0) {
            setCurrentAudioIndex(0)
            await trackPlayerService.setRepeatMode(RepeatMode.Off)
            await trackPlayerService.skipToTrack(0)
            // Auto-play the first track
            await trackPlayerService.play()
          }

          console.log(`🎵 [TTS Event] Track ${data.sentenceIndex} added to player`)
        } catch (error) {
          console.error('🎵 [TTS Event] Error handling audio ready event:', error)
        }
      },
    )

    return () => {
      if (ttsEventSubscription.current) {
        ttsEventSubscription.current.remove()
      }
    }
  }, [bookId, chapterNumber, bookName])

  // TrackPlayer events
  useTrackPlayerEvents([Event.PlaybackActiveTrackChanged], async (event) => {
    if (event.type === Event.PlaybackActiveTrackChanged && event.index !== undefined) {
      setCurrentAudioIndex(event.index)
    }
  })
  
  const generateTTSFromSummary = useCallback(
    async (content: string) => {
      if (!content || !bookId || !chapterNumber) return

      console.log('🎵 [TTS Debug] Starting TTS generation...')
      console.log('🎵 [TTS Debug] Content length:', content.length)

      setIsTTSGenerating(true)

      // Reset TTS cancellation state
      resetTTSCancellation()

      try {
        // Break summary into shorter lines for better TTS
        const sentences = breakSummaryIntoLines(content).slice(0, 5) // Limit to 5 lines for TTS
        console.log('🎵 [TTS Debug] Broke into lines:', sentences.length)

        if (sentences.length === 0) {
          console.log('🎵 [TTS Debug] No lines found, returning')
          return
        }

        // Set up progress tracking
        setTtsProgress({ current: 0, total: sentences.length })

        // First reset the player to clear any existing tracks
        await trackPlayerService.reset()
        setAudioFilePaths([])
        setCurrentAudioIndex(null)

        console.log('🎵 [TTS Debug] Starting conversion with options:', {
          linesCount: sentences.length,
          voice: 'BV421_vivn_streaming',
          bookId: bookId,
          chapterNumber: chapterNumber,
        })

        // Start TTS conversion - this will emit events as each audio file is ready
        const audioPaths = await convertTTSCapcut(sentences, {
          voice: 'BV421_vivn_streaming',
          bookId: bookId,
          chapterNumber: chapterNumber,
        })

        console.log('🎵 [TTS Debug] convertTTSCapcut completed:', {
          audioPathsCount: audioPaths.length,
        })

        if (audioPaths.length > 0) {
          console.log('🎵 [TTS Debug] TTS generation completed successfully')
        } else {
          console.log('🎵 [TTS Debug] No audio paths returned')
        }
      } catch (error) {
        console.error('🎵 [TTS Debug] Error generating TTS:', error)
        Alert.alert('Lỗi TTS', 'Không thể tạo audio từ nội dung tóm tắt')
      } finally {
        setIsTTSGenerating(false)
        console.log('🎵 [TTS Debug] TTS generation process finished')
      }
    },
    [trackPlayerService, bookId, chapterNumber],
  )

  const handleCancelAudio = useCallback(async () => {
    console.log('🎵 [PlayAudioControl] Cancelling audio generation and playback...')

    // Cancel TTS generation if in progress
    if (isTTSGenerating) {
      console.log('🎵 [PlayAudioControl] Cancelling TTS generation...')
      cancelTTSConversion()
      setIsTTSGenerating(false)
      setTtsProgress({ current: 0, total: 0 })
    }

    // Reset player and states
    await trackPlayerService.reset()
    setAudioFilePaths([])
    setCurrentAudioIndex(null)
  }, [isTTSGenerating, trackPlayerService])

  const handlePlayPause = useCallback(async () => {
    console.log('🎵 [PlayPause] Button pressed')
    console.log('🎵 [PlayPause] Current audio index:', currentAudioIndex)
    console.log('🎵 [PlayPause] Audio files length:', audioFilePaths.length)
    console.log('🎵 [PlayPause] Playback state:', playbackState.state)

    if (currentAudioIndex === null || audioFilePaths.length === 0) {
      console.log('🎵 [PlayPause] No audio available to play')
      return
    }

    try {
      // If we're in error state, try to reload the track
      if (playbackState.state === State.Error) {
        console.log('🎵 [PlayPause] In error state, trying to reload track...')
        await trackPlayerService.reset()

        // Re-add the tracks
        const tracks = audioFilePaths.map((path, index) => {
          const normalizedPath = path.startsWith('file://') ? path : `file://${path}`
          return {
            id: `tts-${bookId}-${chapterNumber}-${index}`,
            url: normalizedPath,
            title: `TTS Part ${index + 1}`,
            artist: bookName || 'Unknown',
          }
        })

        await trackPlayerService.addTracks(tracks)
        await trackPlayerService.skipToTrack(currentAudioIndex)
        await trackPlayerService.play()
      } else if (playbackState.state === State.Playing) {
        console.log('🎵 [PlayPause] Currently playing, pausing...')
        await trackPlayerService.pause()
      } else {
        console.log('🎵 [PlayPause] Not playing, starting playback...')
        await trackPlayerService.play()
      }
    } catch (error) {
      console.error('🎵 [PlayPause] Error during play/pause:', error)
      showToastError('Lỗi khi phát/dừng audio.')
    }
  }, [
    currentAudioIndex,
    playbackState.state,
    trackPlayerService,
    audioFilePaths.length,
    audioFilePaths,
    bookId,
    chapterNumber,
    bookName,
  ])

  const handlePrevious = useCallback(async () => {
    if (currentAudioIndex !== null && currentAudioIndex > 0) {
      const newIndex = currentAudioIndex - 1
      setCurrentAudioIndex(newIndex)
      await trackPlayerService.skipToPrevious()
    }
  }, [currentAudioIndex, trackPlayerService])

  const handleNext = useCallback(async () => {
    if (currentAudioIndex !== null && currentAudioIndex < audioFilePaths.length - 1) {
      const newIndex = currentAudioIndex + 1
      setCurrentAudioIndex(newIndex)
      await trackPlayerService.skipToNext()
    }
  }, [currentAudioIndex, audioFilePaths.length, trackPlayerService])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (ttsEventSubscription.current) {
        ttsEventSubscription.current.remove()
      }
      if (summaryEventSubscription.current) {
        summaryEventSubscription.current.remove()
      }
      if (isTTSGenerating) {
        cancelTTSConversion()
      }
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
