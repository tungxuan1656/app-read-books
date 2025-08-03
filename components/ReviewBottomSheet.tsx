import { AppColors, AppPalette } from '@/assets'
import { VectorIcon } from '@/components/Icon'
import { AppTypo } from '@/constants'
import { useBookInfo, useReading } from '@/controllers/context'
import { convertTTSCapcut, cancelTTSConversion, resetTTSCancellation } from '@/services/convert-tts'
import { summarizeChapter, validateGeminiApiKey } from '@/services/gemini-service'
import { getBookChapterContent, getChapterHtml, showToastError } from '@/utils'
import { getCachedSummary, setCachedSummary } from '@/utils/summary-cache'
import { clearBookCache, getBookCacheStats } from '@/utils/cache-manager'
import { breakSummaryIntoLines } from '@/utils/string-helpers'
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet'
import TrackPlayer, {
  Event,
  State,
  useTrackPlayerEvents,
  usePlaybackState,
  useProgress,
  RepeatMode,
  useIsPlaying,
} from 'react-native-track-player'
import TrackPlayerService from '@/services/track-player-service'
import * as FileSystem from 'expo-file-system'
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  DeviceEventEmitter,
  EmitterSubscription,
} from 'react-native'

export interface ReviewBottomSheetRef {
  present: () => void
  close: () => void
}

interface ReviewBottomSheetProps {
  bookId?: string
  bookInfo?: Book
  chapterNumber?: number
  onNavigateToChapter?: (direction: 'prev' | 'next') => void
  font?: string
  lineHeight?: number
  fontSize?: number
}

type LoadingState = 'idle' | 'loadingChapter' | 'summarizing' | 'generatingTTS'

const ReviewBottomSheet = forwardRef<ReviewBottomSheetRef, ReviewBottomSheetProps>(
  (
    {
      bookId,
      bookInfo: passedBookInfo,
      chapterNumber,
      onNavigateToChapter,
      font,
      lineHeight,
      fontSize,
    },
    ref,
  ) => {
    const bottomSheetRef = React.useRef<BottomSheet>(null)
    const chapterContent = useRef('')
    const summarizedContent = useRef('')
    const [loadingState, setLoadingState] = useState<LoadingState>('idle')

    // TTS states
    const [audioFilePaths, setAudioFilePaths] = useState<string[]>([])
    const [currentAudioIndex, setCurrentAudioIndex] = useState<number | null>(null)
    const [isTTSGenerating, setIsTTSGenerating] = useState(false)
    const [ttsProgress, setTtsProgress] = useState({ current: 0, total: 0 })

    // Event subscription refs
    const ttsEventSubscription = useRef<EmitterSubscription | null>(null)

    // Track Player setup
    const trackPlayerService = TrackPlayerService.getInstance()
    const playbackState = usePlaybackState()

    const reading = useReading()
    const currentBookId = bookId || reading.currentBook
    const currentChapterNumber = chapterNumber || (reading.books[currentBookId] ?? 1)
    const bookInfoFromHook = useBookInfo(currentBookId)
    const bookInfo = passedBookInfo || bookInfoFromHook

    const snapPoints = useMemo(() => ['50%', '85%'], [])
    const isPlaying = useIsPlaying()

    const currentChapter = useMemo(() => {
      if (bookInfo && currentChapterNumber) {
        return bookInfo.references?.[currentChapterNumber - 1]
      }
    }, [bookInfo, currentChapterNumber])

    const chapterHtml = useMemo(() => {
      if (!chapterContent.current) return ''
      return getChapterHtml(chapterContent.current)
    }, [chapterContent.current])

    useImperativeHandle(ref, () => ({
      present: async () => {
        await trackPlayerService.setupPlayer()
        bottomSheetRef.current?.expand()
        loadChapterContent()
      },
      close: async () => {
        // Cancel TTS generation if in progress
        if (isTTSGenerating) {
          console.log('🎵 [Close] Cancelling TTS generation...')
          cancelTTSConversion()
          setIsTTSGenerating(false)
          setTtsProgress({ current: 0, total: 0 })
        }

        // Cleanup event subscriptions
        if (ttsEventSubscription.current) {
          ttsEventSubscription.current.remove()
          ttsEventSubscription.current = null
        }

        bottomSheetRef.current?.close()
        await trackPlayerService.reset()
      },
    }))

    const loadChapterContent = useCallback(async () => {
      if (currentBookId && currentChapterNumber) {
        setLoadingState('loadingChapter')
        chapterContent.current = ''
        summarizedContent.current = ''

        // Reset TTS states
        await trackPlayerService.reset()
        setAudioFilePaths([])
        setCurrentAudioIndex(null)

        // Check if we have cached summary before loading content
        console.log('📝 [Summary Cache] Checking cache during chapter load')
        const cachedSummary = getCachedSummary(currentBookId, currentChapterNumber)
        if (cachedSummary) {
          console.log(
            '📝 [Summary Cache] Found cached summary during load, will use it after content loads',
          )
        }

        getBookChapterContent(currentBookId, currentChapterNumber)
          .then((content: string) => {
            chapterContent.current = content
            setLoadingState('idle')

            // If we have cached summary, set it immediately without waiting for chapterHtml effect
            if (cachedSummary) {
              console.log('📝 [Summary Cache] Setting cached summary immediately')
              summarizedContent.current = cachedSummary
              // Generate TTS from cached summary
              generateTTSFromSummary(cachedSummary)
            }
          })
          .catch((error: any) => {
            showToastError(error)
            setLoadingState('idle')
          })
      }
    }, [currentBookId, currentChapterNumber, trackPlayerService])

    // Summarize chapter when content is loaded (only if no cached summary and no current summary)
    useEffect(() => {
      if (
        chapterHtml &&
        !summarizedContent.current &&
        loadingState === 'idle' &&
        currentBookId &&
        currentChapterNumber
      ) {
        // Check cache one more time before calling API
        const cachedSummary = getCachedSummary(currentBookId, currentChapterNumber)
        if (!cachedSummary) {
          console.log('📝 [Summary Cache] No cache in useEffect, calling handleSummarize')
          handleSummarize()
        } else {
          console.log('📝 [Summary Cache] Found cache in useEffect, skipping auto-summarize')
        }
      }
    }, [chapterHtml, summarizedContent.current, loadingState, currentBookId, currentChapterNumber])

    // TrackPlayer events for auto-play
    useTrackPlayerEvents([Event.PlaybackTrackChanged], async (event) => {
      console.log('🎵 [Event] PlaybackTrackChanged:', event)
      if (event.type === Event.PlaybackTrackChanged && event.nextTrack !== undefined) {
        console.log('🎵 [Event] Setting current audio index to:', event.nextTrack)
        setCurrentAudioIndex(event.nextTrack)
      }
    })

    useTrackPlayerEvents([Event.PlaybackQueueEnded], async () => {
      console.log('🎵 [Event] PlaybackQueueEnded - playlist mode disabled')
      // No auto-restart since playlist mode is disabled
    })

    useTrackPlayerEvents([Event.PlaybackState], async (event) => {
      console.log('🎵 [Event] PlaybackState changed:', event.state)
    })

    useTrackPlayerEvents([Event.PlaybackError], async (event) => {
      console.error('🎵 [Event] PlaybackError:', event)
    })

    useTrackPlayerEvents([Event.PlaybackMetadataReceived], async (event) => {
      console.log('🎵 [Event] MetadataReceived:', event)
    })

    const playAudioAtIndex = useCallback(
      async (index: number) => {
        if (index < 0 || index >= audioFilePaths.length) return
        try {
          await trackPlayerService.skipToTrack(index)
          await trackPlayerService.play()
        } catch (error) {
          console.error('Error playing audio:', error)
          showToastError('Không thể phát audio.')
        }
      },
      [audioFilePaths.length, trackPlayerService],
    )

    const handleSummarize = useCallback(async () => {
      if (!chapterHtml) {
        Alert.alert('Lỗi', 'Không có nội dung để tóm tắt')
        return
      }

      if (!validateGeminiApiKey()) {
        Alert.alert(
          'Thiếu API Key',
          'Vui lòng cấu hình EXPO_PUBLIC_GEMINI_API_KEY trong file .env để sử dụng tính năng tóm tắt',
        )
        return
      }

      console.log('📝 [Summary Cache] Checking cache for:', {
        bookId: currentBookId,
        chapter: currentChapterNumber,
      })

      // Check cache first
      if (currentBookId && currentChapterNumber) {
        const cachedSummary = getCachedSummary(currentBookId, currentChapterNumber)
        if (cachedSummary) {
          console.log('📝 [Summary Cache] Found cached summary, using cached version')
          summarizedContent.current = cachedSummary
          // Auto-generate TTS after setting cached summary
          await generateTTSFromSummary(cachedSummary)
          return
        } else {
          console.log('📝 [Summary Cache] No cached summary found, generating new one')
        }
      }

      setLoadingState('summarizing')
      try {
        console.log('📝 [Summary Cache] Calling Gemini API for new summary')
        const summary = await summarizeChapter({
          chapterHtml,
          bookTitle: bookInfo?.name,
        })

        console.log(
          '📝 [Summary Cache] Received summary from API:',
          summary.substring(0, 100) + '...',
        )
        summarizedContent.current = summary

        // Cache the new summary
        if (currentBookId && currentChapterNumber) {
          console.log('📝 [Summary Cache] Caching new summary')
          setCachedSummary(currentBookId, currentChapterNumber, summary)
        }

        // Auto-generate TTS after summarizing
        await generateTTSFromSummary(summary)
      } catch (error) {
        console.error('📝 [Summary Cache] Error summarizing:', error)
        Alert.alert(
          'Lỗi tóm tắt',
          error instanceof Error ? error.message : 'Có lỗi xảy ra khi tóm tắt chương truyện',
        )
      } finally {
        setLoadingState('idle')
      }
    }, [chapterHtml, bookInfo, currentBookId, currentChapterNumber])

    const generateTTSFromSummary = useCallback(
      async (content: string) => {
        if (!content || !currentBookId || !currentChapterNumber) return

        console.log('🎵 [TTS Debug] Starting TTS generation...')
        console.log('🎵 [TTS Debug] Content length:', content.length)

        setLoadingState('generatingTTS')
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

          // Set up event listener for TTS audio ready events
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
                  id: `tts-${currentBookId}-${currentChapterNumber}-${data.sentenceIndex}`,
                  url: normalizedPath,
                  title: `TTS Part ${data.sentenceIndex + 1}`,
                  artist: bookInfo?.name || 'Unknown',
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

                  // Always set repeat mode to Off
                  await trackPlayerService.setRepeatMode(RepeatMode.Off)

                  // Skip to first track to load it (but don't auto-play)
                  await trackPlayerService.skipToTrack(0)
                }

                console.log(`🎵 [TTS Event] Track ${data.sentenceIndex} added to player`)
              } catch (error) {
                console.error('🎵 [TTS Event] Error handling audio ready event:', error)
              }
            },
          )

          console.log('🎵 [TTS Debug] Starting conversion with options:', {
            linesCount: sentences.length,
            voice: 'BV421_vivn_streaming',
            bookId: currentBookId,
            chapterNumber: currentChapterNumber,
          })

          // Start TTS conversion - this will emit events as each audio file is ready
          const audioPaths = await convertTTSCapcut(sentences, {
            voice: 'BV421_vivn_streaming',
            bookId: currentBookId,
            chapterNumber: currentChapterNumber,
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
          setLoadingState('idle')
          setIsTTSGenerating(false)
          console.log('🎵 [TTS Debug] TTS generation process finished')
        }
      },
      [trackPlayerService, bookInfo, currentBookId, currentChapterNumber],
    )

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
              id: `tts-${currentBookId}-${currentChapterNumber}-${index}`,
              url: normalizedPath,
              title: `TTS Part ${index + 1}`,
              artist: bookInfo?.name || 'Unknown',
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
      currentBookId,
      currentChapterNumber,
      bookInfo,
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

    const handleClose = useCallback(() => {
      bottomSheetRef.current?.close()
    }, [])

    const handlePreviousChapter = useCallback(() => {
      onNavigateToChapter?.('prev')
      loadChapterContent()
    }, [onNavigateToChapter, loadChapterContent])

    const handleNextChapter = useCallback(() => {
      onNavigateToChapter?.('next')
      loadChapterContent()
    }, [onNavigateToChapter, loadChapterContent])

    // Cleanup on unmount
    useEffect(() => {
      return () => {
        if (ttsEventSubscription.current) {
          ttsEventSubscription.current.remove()
          ttsEventSubscription.current = null
        }
        if (isTTSGenerating) {
          cancelTTSConversion()
        }
      }
    }, [isTTSGenerating])

    return (
      <BottomSheet
        ref={bottomSheetRef}
        snapPoints={snapPoints}
        index={-1}
        enablePanDownToClose
        enableDynamicSizing={false}
        backgroundStyle={styles.bottomSheetBackground}
        handleIndicatorStyle={styles.handleIndicator}>
        <View style={styles.header}>
          <VectorIcon
            name="xmark"
            font="FontAwesome6"
            size={20}
            buttonStyle={styles.headerButton}
            color={AppPalette.gray400}
            onPress={handleClose}
          />
          <View style={styles.headerCenter}>
            <Text style={[AppTypo.body.semiBold, styles.headerSubtitle]} numberOfLines={1}>
              {currentChapter}
            </Text>
          </View>
          <View style={styles.navigationContainer}>
            <VectorIcon
              name="arrow-left"
              font="FontAwesome6"
              size={14}
              buttonStyle={styles.navButton}
              color={AppPalette.white}
              onPress={handlePreviousChapter}
            />
            <VectorIcon
              name="arrow-right"
              font="FontAwesome6"
              size={14}
              buttonStyle={styles.navButton}
              color={AppPalette.white}
              onPress={handleNextChapter}
            />
          </View>
        </View>
        <BottomSheetScrollView style={{ backgroundColor: '#F5F1E5' }}>
          {loadingState !== 'idle' && loadingState !== 'generatingTTS' ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={AppPalette.blue500} />
              <Text style={[AppTypo.body.regular, styles.loadingText]}>
                {loadingState === 'loadingChapter' && 'Đang tải nội dung chương...'}
                {loadingState === 'summarizing' && 'Đang tóm tắt nội dung...'}
              </Text>
              {loadingState === 'summarizing' && (
                <Text style={[AppTypo.mini.regular, styles.loadingSubtext]}>
                  Quá trình này có thể mất vài giây
                </Text>
              )}
            </View>
          ) : summarizedContent.current ? (
            <View style={styles.contentContainer}>
              <View style={styles.ttsContainer}>
                <Text style={[AppTypo.caption.medium, styles.progressText]}>
                  {currentAudioIndex !== null ? currentAudioIndex + 1 : '-'} /{' '}
                  {audioFilePaths.length}
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

              {/* Summary Content */}
              <View style={styles.summaryHeader}>
                <View style={styles.summaryTitleContainer}>
                  <VectorIcon
                    name="file-text"
                    font="FontAwesome6"
                    size={16}
                    color={AppPalette.gray700}
                  />
                  <Text style={[AppTypo.body.semiBold, styles.summaryTitle]}>Tóm tắt nội dung</Text>
                </View>
              </View>
              <Text
                style={{
                  fontFamily: font || 'Inter-Regular',
                  lineHeight: fontSize! * lineHeight! * 0.9,
                  fontSize: fontSize! * 0.8,
                  marginHorizontal: 16,
                  marginTop: 8,
                  color: AppPalette.gray900,
                }}>
                {summarizedContent.current}
              </Text>
            </View>
          ) : (
            <View style={styles.errorContainer}>
              <VectorIcon
                name="triangle-exclamation"
                font="FontAwesome6"
                size={32}
                color={AppPalette.red500}
              />
              <Text style={[AppTypo.body.regular, styles.errorText]}>
                Không thể tóm tắt nội dung chương
              </Text>
              <VectorIcon
                name="refresh"
                font="FontAwesome6"
                size={18}
                buttonStyle={styles.retryButton}
                color={AppPalette.blue500}
                onPress={handleSummarize}
              />
            </View>
          )}
        </BottomSheetScrollView>
      </BottomSheet>
    )
  },
)

ReviewBottomSheet.displayName = 'ReviewBottomSheet'

export default ReviewBottomSheet

const styles = StyleSheet.create({
  bottomSheetBackground: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  handleIndicator: {
    // backgroundColor: AppPalette.gray300,
    display: 'none',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: AppPalette.gray100,
  },
  headerButton: {
    width: 44,
    height: 44,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  headerSubtitle: {
    color: AppPalette.gray600,
    textAlign: 'center',
  },
  navigationContainer: {
    flexDirection: 'row',
    backgroundColor: AppPalette.gray400,
    borderRadius: 20,
    padding: 2,
  },
  navButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginHorizontal: 1,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F5F1E5',
  },
  contentContainer: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: '#F5F1E5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  loadingText: {
    marginTop: 16,
    color: AppPalette.gray700,
    textAlign: 'center',
  },
  loadingSubtext: {
    marginTop: 8,
    color: AppPalette.gray500,
    textAlign: 'center',
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: AppPalette.gray200,
  },
  summaryTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  summaryTitle: {
    marginLeft: 8,
    color: AppPalette.gray900,
    flex: 1,
  },
  generateTTSButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: AppPalette.blue50,
    borderWidth: 1,
    borderColor: AppPalette.blue200,
  },
  htmlContent: {
    flex: 1,
    marginHorizontal: 0,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  errorText: {
    marginTop: 16,
    marginBottom: 24,
    color: AppPalette.gray700,
    textAlign: 'center',
  },
  retryButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: AppPalette.blue500,
  },
  toggleButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: AppPalette.gray100,
  },
  // TTS Styles
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
  ttsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ttsTitle: {
    marginLeft: 8,
    color: AppPalette.gray800,
    flex: 1,
  },
  ttsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  ttsLoadingText: {
    marginLeft: 8,
    color: AppPalette.gray600,
  },
  ttsControls: {
    alignItems: 'center',
  },
  ttsProgress: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 12,
  },
  progressText: {
    color: AppPalette.white,
    marginRight: 8,
  },
  ttsButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  ttsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppPalette.gray100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ttsButtonDisabled: {
    backgroundColor: AppPalette.gray50,
  },
  ttsPlayButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: AppPalette.blue500,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
