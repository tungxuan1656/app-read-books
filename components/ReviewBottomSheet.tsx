import { AppPalette } from '@/assets'
import { VectorIcon } from '@/components/Icon'
import { AppTypo } from '@/constants'
import { useBookInfo } from '@/controllers/context'
import { summarizeChapter } from '@/services/gemini-service'
import { getCachedSummary, setCachedSummary } from '@/utils/summary-cache'
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet'
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react'
import { ActivityIndicator, Alert, DeviceEventEmitter, StyleSheet, Text, View } from 'react-native'
import PlayAudioControl from './PlayAudioControl'

export interface ReviewBottomSheetRef {
  present: ({
    content,
    bookId,
    chapterNumber,
  }: {
    content: string
    bookId: string
    chapterNumber: number
  }) => void
  close: () => void
}

interface ReviewBottomSheetProps {
  onNavigateToChapter?: (direction: 'prev' | 'next') => void
  font?: string
  lineHeight?: number
  fontSize?: number
}

type LoadingState = 'idle' | 'loadingChapter' | 'summarizing'

const ReviewBottomSheet = forwardRef<ReviewBottomSheetRef, ReviewBottomSheetProps>(
  ({ font, lineHeight, fontSize }, ref) => {
    const bottomSheetRef = React.useRef<BottomSheet>(null)
    const snapPoints = useMemo(() => ['50%', '85%'], [])
    const [loadingState, setLoadingState] = useState<LoadingState>('idle')
    const [chapterContent, setChapterContent] = useState('')
    const [summaryContent, setSummaryContent] = useState<string | null>(null)
    const [bookId, setBookId] = useState<string | null>(null)
    const [chapterNumber, setChapterNumber] = useState<number | null>(null)
    const bookInfo = useBookInfo(bookId ?? '')

    useImperativeHandle(ref, () => ({
      present: async ({ content, bookId, chapterNumber }) => {
        setChapterContent(content)
        setBookId(bookId)
        setChapterNumber(chapterNumber)
        bottomSheetRef.current?.expand()
      },
      close: async () => {
        DeviceEventEmitter.emit(`cancel_audio_${bookId}`)
        bottomSheetRef.current?.close()
      },
    }))

    useEffect(() => {
      handleSummarize()
    }, [chapterContent, bookId, chapterNumber])

    const handleSummarize = async () => {
      if (!bookId || !chapterNumber || !chapterContent) {
        return
      }

      const cachedSummary = getCachedSummary(bookId, chapterNumber)
      if (cachedSummary) {
        setSummaryContent(cachedSummary)
        sendSummaryToTTS(cachedSummary)
        return
      }

      setLoadingState('summarizing')

      try {
        const summary = await summarizeChapter({
          chapterHtml: chapterContent,
          bookTitle: bookInfo?.name,
        })

        setSummaryContent(summary)
        sendSummaryToTTS(summary)
        setCachedSummary(bookId, chapterNumber, summary)
      } catch (error) {
        console.error('📝 [Summary Cache] Error summarizing:', error)
        Alert.alert(
          'Lỗi tóm tắt',
          error instanceof Error ? error.message : 'Có lỗi xảy ra khi tóm tắt chương truyện',
        )
      } finally {
        setLoadingState('idle')
      }
    }

    const sendSummaryToTTS = (content: string) => {
      setTimeout(() => {
        DeviceEventEmitter.emit(`summary_ready_${bookId}_${chapterNumber}`, {
          content,
        })
      }, 1000)
    }

    const handleClose = useCallback(() => {
      bottomSheetRef.current?.close()
    }, [])

    return (
      <BottomSheet
        ref={bottomSheetRef}
        snapPoints={snapPoints}
        index={-1}
        enablePanDownToClose
        enableDynamicSizing={false}
        backgroundStyle={styles.bottomSheetBackground}
        handleIndicatorStyle={styles.handleIndicator}>
        <BottomSheetScrollView style={{ backgroundColor: '#FFF' }}>
          <VectorIcon
            name="xmark"
            font="FontAwesome6"
            size={20}
            buttonStyle={styles.headerButton}
            color={AppPalette.gray400}
            onPress={handleClose}
          />
          {!summaryContent ? (
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
          ) : (
            <View style={styles.contentContainer}>
              <PlayAudioControl
                bookId={bookId ?? ''}
                chapterNumber={chapterNumber ?? 0}
                bookName={bookInfo?.name}
              />
              <Text
                style={{
                  fontFamily: font || 'Inter-Regular',
                  lineHeight: fontSize! * lineHeight! * 0.9,
                  fontSize: fontSize! * 0.8,
                  marginHorizontal: 16,
                  marginTop: 8,
                  color: AppPalette.gray900,
                }}>
                {summaryContent}
              </Text>
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
  headerButton: {
    width: 44,
    height: 36,
    position: 'absolute',
    top: 0,
    left: 4,
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
  navButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginHorizontal: 1,
  },
  contentContainer: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: '#FFF',
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
