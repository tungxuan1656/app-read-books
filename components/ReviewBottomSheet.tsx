import { AppPalette } from '@/assets'
import { VectorIcon } from '@/components/Icon'
import { AppTypo } from '@/constants'
import { useBookInfo, useReading } from '@/controllers/context'
import { convertTTSCapcut } from '@/services/convert-tts'
import { summarizeChapter, validateGeminiApiKey } from '@/services/gemini-service'
import { getBookChapterContent, getChapterHtml, showToastError } from '@/utils'
import { getCachedSummary, setCachedSummary } from '@/utils/summary-cache'
import { breakSummaryIntoLines } from '@/utils/string-helpers'
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet'
import TrackPlayer, { 
  Event, 
  State, 
  useTrackPlayerEvents, 
  usePlaybackState, 
  useProgress,
  RepeatMode 
} from 'react-native-track-player'
import TrackPlayerService from '@/services/track-player-service'
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

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
    const isSwitchingAudio = useRef(false) // Ref to prevent race conditions

    // TTS states
    const [audioFilePaths, setAudioFilePaths] = useState<string[]>([])
    const [currentAudioIndex, setCurrentAudioIndex] = useState<number | null>(null)
    const [isPlaylistMode, setIsPlaylistMode] = useState(false)

    // Track Player setup
    const trackPlayerService = TrackPlayerService.getInstance()
    const playbackState = usePlaybackState()
    const progress = useProgress()

    const reading = useReading()
    const currentBookId = bookId || reading.currentBook
    const currentChapterNumber = chapterNumber || (reading.books[currentBookId] ?? 1)
    const bookInfoFromHook = useBookInfo(currentBookId)
    const bookInfo = passedBookInfo || bookInfoFromHook

    const snapPoints = useMemo(() => ['50%', '85%'], [])

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
        setIsPlaylistMode(false)

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
      if (event.type === Event.PlaybackTrackChanged && event.nextTrack !== undefined) {
        setCurrentAudioIndex(event.nextTrack)
      }
    })

    useTrackPlayerEvents([Event.PlaybackQueueEnded], async () => {
      if (isPlaylistMode) {
        // Restart from beginning if playlist mode is enabled
        await trackPlayerService.skipToTrack(0)
        await trackPlayerService.play()
      }
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
        if (!content) return

        console.log('🎵 [TTS Debug] Starting TTS generation...')
        console.log('🎵 [TTS Debug] Content length:', content.length)

        setLoadingState('generatingTTS')
        try {
          // Break summary into shorter lines for better TTS
          const sentences = breakSummaryIntoLines(content).slice(0, 5) // Limit to 5 lines for TTS
          console.log('🎵 [TTS Debug] Broke into lines:', sentences.length)
          sentences.forEach((sentence: string, index: number) => {
            console.log(
              `🎵 [TTS Debug] Line ${index + 1} (${sentence.length} chars): ${sentence.substring(
                0,
                100,
              )}...`,
            )
          })

          if (sentences.length === 0) {
            console.log('🎵 [TTS Debug] No lines found, returning')
            return
          }

          console.log('🎵 [TTS Debug] Calling convertTTSCapcut with:', {
            linesCount: sentences.length,
            voice: 'BV421_vivn_streaming',
          })

          // Generate TTS for all lines using the updated function
          const audioPaths = await convertTTSCapcut(sentences, { voice: 'BV421_vivn_streaming' })

          console.log('🎵 [TTS Debug] convertTTSCapcut returned:', {
            audioPathsCount: audioPaths.length,
            audioPaths: audioPaths,
          })

          if (audioPaths.length > 0) {
            // Prepare tracks for TrackPlayer
            const tracks = audioPaths.map((path, index) => ({
              id: `tts-${index}`,
              url: path,
              title: `TTS Part ${index + 1}`,
              artist: bookInfo?.name || 'Unknown',
            }))

            await trackPlayerService.addTracks(tracks)
            setAudioFilePaths(audioPaths)
            setCurrentAudioIndex(0)
            
            // Set repeat mode based on playlist mode
            if (isPlaylistMode) {
              await trackPlayerService.setRepeatMode(RepeatMode.Queue)
            }
            
            console.log('🎵 [TTS Debug] TTS generation completed successfully')
          } else {
            console.log('🎵 [TTS Debug] No audio paths returned')
          }
        } catch (error) {
          console.error('🎵 [TTS Debug] Error generating TTS:', error)
          Alert.alert('Lỗi TTS', 'Không thể tạo audio từ nội dung tóm tắt')
        } finally {
          setLoadingState('idle')
          console.log('🎵 [TTS Debug] TTS generation process finished')
        }
      },
      [trackPlayerService, bookInfo, isPlaylistMode],
    )

    const handlePlayPause = useCallback(async () => {
      if (currentAudioIndex === null || audioFilePaths.length === 0) return

      try {
        if (playbackState.state === State.Playing) {
          await trackPlayerService.pause()
        } else {
          await trackPlayerService.play()
        }
      } catch (error) {
        console.error('Error during play/pause:', error)
        showToastError('Lỗi khi phát/dừng audio.')
      }
    }, [
      currentAudioIndex,
      playbackState.state,
      trackPlayerService,
      audioFilePaths.length,
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

    const togglePlaylistMode = useCallback(async () => {
      const newPlaylistMode = !isPlaylistMode
      setIsPlaylistMode(newPlaylistMode)
      
      // Update repeat mode based on playlist mode
      if (newPlaylistMode) {
        await trackPlayerService.setRepeatMode(RepeatMode.Queue)
      } else {
        await trackPlayerService.setRepeatMode(RepeatMode.Off)
      }
    }, [isPlaylistMode, trackPlayerService])

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
          {loadingState !== 'idle' ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={AppPalette.blue500} />
              <Text style={[AppTypo.body.regular, styles.loadingText]}>
                {loadingState === 'loadingChapter' && 'Đang tải nội dung chương...'}
                {loadingState === 'summarizing' && 'Đang tóm tắt nội dung...'}
                {loadingState === 'generatingTTS' && 'Đang tạo audio...'}
              </Text>
              {loadingState === 'summarizing' && (
                <Text style={[AppTypo.mini.regular, styles.loadingSubtext]}>
                  Quá trình này có thể mất vài giây
                </Text>
              )}
            </View>
          ) : summarizedContent.current ? (
            <View style={styles.contentContainer}>
              {/* TTS Controls */}
              {audioFilePaths.length > 0 && (
                <View style={styles.ttsContainer}>
                  <View style={styles.ttsHeader}>
                    <VectorIcon
                      name="volume-high"
                      font="FontAwesome6"
                      size={16}
                      color={AppPalette.blue500}
                    />
                    <Text style={[AppTypo.caption.semiBold, styles.ttsTitle]}>Audio Tóm Tắt</Text>
                    {audioFilePaths.length > 1 && (
                      <TouchableOpacity onPress={togglePlaylistMode} style={styles.playlistButton}>
                        <VectorIcon
                          name={isPlaylistMode ? 'list-check' : 'list'}
                          font="FontAwesome6"
                          size={12}
                          color={isPlaylistMode ? AppPalette.blue500 : AppPalette.gray500}
                        />
                        <Text
                          style={[
                            AppTypo.mini.regular,
                            {
                              color: isPlaylistMode ? AppPalette.blue500 : AppPalette.gray500,
                              marginLeft: 4,
                            },
                          ]}>
                          Auto
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <View style={styles.ttsControls}>
                    <View style={styles.ttsProgress}>
                      <Text style={[AppTypo.mini.regular, styles.progressText]}>
                        {currentAudioIndex !== null ? currentAudioIndex + 1 : '-'} /{' '}
                        {audioFilePaths.length}
                      </Text>
                      {progress.duration > 0 && (
                        <Text style={[AppTypo.mini.regular, styles.progressText]}>
                          {Math.floor(progress.position || 0)}s /{' '}
                          {Math.floor(progress.duration || 0)}s
                        </Text>
                      )}
                    </View>

                    <View style={styles.ttsButtons}>
                      <TouchableOpacity
                        onPress={handlePrevious}
                        disabled={currentAudioIndex === 0 || currentAudioIndex === null}
                        style={[
                          styles.ttsButton,
                          (currentAudioIndex === 0 || currentAudioIndex === null) &&
                            styles.ttsButtonDisabled,
                        ]}>
                        <VectorIcon
                          name="backward-step"
                          font="FontAwesome6"
                          size={14}
                          color={
                            currentAudioIndex === 0 || currentAudioIndex === null
                              ? AppPalette.gray300
                              : AppPalette.gray700
                          }
                        />
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={handlePlayPause}
                        style={styles.ttsPlayButton}
                        disabled={currentAudioIndex === null}>
                        <VectorIcon
                          name={playbackState.state === State.Playing ? 'pause' : 'play'}
                          font="FontAwesome6"
                          size={16}
                          color={AppPalette.white}
                        />
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={handleNext}
                        disabled={
                          currentAudioIndex === null ||
                          currentAudioIndex === audioFilePaths.length - 1
                        }
                        style={[
                          styles.ttsButton,
                          (currentAudioIndex === null ||
                            currentAudioIndex === audioFilePaths.length - 1) &&
                            styles.ttsButtonDisabled,
                        ]}>
                        <VectorIcon
                          name="forward-step"
                          font="FontAwesome6"
                          size={14}
                          color={
                            currentAudioIndex === null ||
                            currentAudioIndex === audioFilePaths.length - 1
                              ? AppPalette.gray300
                              : AppPalette.gray700
                          }
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}

              {/* Summary Content */}
              <Text
                style={{
                  fontFamily: font || 'Inter-Regular',
                  lineHeight: fontSize! * lineHeight! * 0.9,
                  fontSize: fontSize! * 0.8,
                  marginHorizontal: 16,
                  marginTop: audioFilePaths.length > 0 ? 16 : 0,
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
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: AppPalette.gray200,
  },
  summaryTitle: {
    marginLeft: 8,
    color: AppPalette.gray900,
    flex: 1,
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
    backgroundColor: AppPalette.white,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  playlistButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: AppPalette.gray50,
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
    color: AppPalette.gray500,
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
