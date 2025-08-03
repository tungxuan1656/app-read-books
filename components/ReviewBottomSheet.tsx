import { AppPalette } from '@/assets'
import { VectorIcon } from '@/components/Icon'
import { AppTypo } from '@/constants'
import { useBookInfo, useReading } from '@/controllers/context'
import { summarizeChapter, validateGeminiApiKey } from '@/services/gemini-service'
import { getBookChapterContent, getChapterHtml, showToastError } from '@/utils'
import { getCachedSummary, setCachedSummary } from '@/utils/summary-cache'
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet'
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
import { ActivityIndicator, Alert, StyleSheet, Text, View, DeviceEventEmitter } from 'react-native'
import PlayAudioControl from './PlayAudioControl'

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

type LoadingState = 'idle' | 'loadingChapter' | 'summarizing'

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

    // Track Player setup
    const trackPlayerService = TrackPlayerService.getInstance()

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
        // Send cancel event to PlayAudioControl
        DeviceEventEmitter.emit(`cancel_audio_${currentBookId}`)

        bottomSheetRef.current?.close()
        await trackPlayerService.reset()
      },
    }))

    const loadChapterContent = useCallback(async () => {
      if (currentBookId && currentChapterNumber) {
        setLoadingState('loadingChapter')
        chapterContent.current = ''
        summarizedContent.current = ''

        // Reset TrackPlayer
        await trackPlayerService.reset()

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

            // If we have cached summary, set it immediately and send to PlayAudioControl
            if (cachedSummary) {
              console.log('📝 [Summary Cache] Setting cached summary immediately')
              summarizedContent.current = cachedSummary
              // Send summary to PlayAudioControl
              DeviceEventEmitter.emit(`summary_ready_${currentBookId}_${currentChapterNumber}`, {
                content: cachedSummary,
              })
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
          // Send summary to PlayAudioControl
          DeviceEventEmitter.emit(`summary_ready_${currentBookId}_${currentChapterNumber}`, {
            content: cachedSummary,
          })
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

        // Send summary to PlayAudioControl for TTS generation
        DeviceEventEmitter.emit(`summary_ready_${currentBookId}_${currentChapterNumber}`, {
          content: summary,
        })
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

    const handleClose = useCallback(() => {
      bottomSheetRef.current?.close()
    }, [])

    const handlePreviousChapter = useCallback(() => {
      // Send cancel event to PlayAudioControl before navigating
      DeviceEventEmitter.emit(`cancel_audio_${currentBookId}`)
      onNavigateToChapter?.('prev')
      loadChapterContent()
    }, [onNavigateToChapter, loadChapterContent, currentBookId])

    const handleNextChapter = useCallback(() => {
      // Send cancel event to PlayAudioControl before navigating
      DeviceEventEmitter.emit(`cancel_audio_${currentBookId}`)
      onNavigateToChapter?.('next')
      loadChapterContent()
    }, [onNavigateToChapter, loadChapterContent, currentBookId])

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
              </Text>
              {loadingState === 'summarizing' && (
                <Text style={[AppTypo.mini.regular, styles.loadingSubtext]}>
                  Quá trình này có thể mất vài giây
                </Text>
              )}
            </View>
          ) : summarizedContent.current ? (
            <View style={styles.contentContainer}>
              <PlayAudioControl
                bookId={currentBookId}
                chapterNumber={currentChapterNumber}
                bookName={bookInfo?.name}
              />

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
    display: 'none',
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
})
