import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  forwardRef,
  useImperativeHandle,
} from 'react'
import { ActivityIndicator, StyleSheet, Text, View, Alert } from 'react-native'
import BottomSheet, { BottomSheetScrollView, BottomSheetView } from '@gorhom/bottom-sheet'
import { VectorIcon } from '@/components/Icon'
import { AppPalette } from '@/assets'
import { getBookChapterContent, getChapterHtml, showToastError } from '@/utils'
import { useBookInfo, useReading } from '@/controllers/context'
import RenderHTML from 'react-native-render-html'
import { AppConst, AppTypo } from '@/constants'
import { summarizeChapter, validateGeminiApiKey, extractKeyPoints } from '@/services/gemini-service'
import { ContentDisplay } from './ContentDisplay'

export interface ReviewBottomSheetRef {
  present: () => void
  close: () => void
}

interface ReviewBottomSheetProps {
  bookId?: string
  chapterNumber?: number
  onNavigateToChapter?: (direction: 'prev' | 'next') => void
  font?: string
  lineHeight?: number
  fontSize?: number
}

const ReviewBottomSheet = forwardRef<ReviewBottomSheetRef, ReviewBottomSheetProps>(
  ({ bookId, chapterNumber, onNavigateToChapter, font, lineHeight, fontSize }, ref) => {
    const bottomSheetRef = React.useRef<BottomSheet>(null)
    const [chapterContent, setChapterContent] = useState('')
    const [summarizedContent, setSummarizedContent] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isSummarizing, setIsSummarizing] = useState(false)

    const reading = useReading()
    const currentBookId = bookId || reading.currentBook
    const currentChapterNumber = chapterNumber || (reading.books[currentBookId] ?? 1)
    const bookInfo = useBookInfo(currentBookId)

    const snapPoints = useMemo(() => ['50%', '85%'], [])

    const currentChapter = useMemo(() => {
      if (bookInfo && currentChapterNumber) {
        return bookInfo.references?.[currentChapterNumber - 1]
      }
    }, [bookInfo, currentChapterNumber])

    const chapterHtml = useMemo(() => {
      if (!chapterContent) return ''
      return getChapterHtml(chapterContent)
    }, [chapterContent])

    useImperativeHandle(ref, () => ({
      present: () => {
        bottomSheetRef.current?.expand()
        loadChapterContent()
      },
      close: () => {
        bottomSheetRef.current?.close()
      },
    }))

    const loadChapterContent = useCallback(() => {
      if (currentBookId && currentChapterNumber) {
        setIsLoading(true)
        setChapterContent('')
        setSummarizedContent('')

        getBookChapterContent(currentBookId, currentChapterNumber)
          .then((content: string) => {
            setChapterContent(content)
            setIsLoading(false)
          })
          .catch((error: any) => {
            showToastError(error)
            setIsLoading(false)
          })
      }
    }, [currentBookId, currentChapterNumber])

    // Summarize chapter when content is loaded
    useEffect(() => {
      if (chapterHtml && !summarizedContent && !isSummarizing) {
        handleSummarize()
      }
    }, [chapterHtml])

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

      setIsSummarizing(true)
      try {
        const [summary, points] = await Promise.all([
          summarizeChapter({
            chapterHtml,
            bookTitle: bookInfo?.name,
          }),
          extractKeyPoints({
            chapterHtml,
            bookTitle: bookInfo?.name,
          }),
        ])

        setSummarizedContent(summary)
      } catch (error) {
        console.error('Error summarizing:', error)
        Alert.alert(
          'Lỗi tóm tắt',
          error instanceof Error ? error.message : 'Có lỗi xảy ra khi tóm tắt chương truyện',
        )
      } finally {
        setIsSummarizing(false)
      }
    }, [chapterHtml, bookInfo])

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
          {isLoading || isSummarizing ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={AppPalette.blue500} />
              <Text style={[AppTypo.body.regular, styles.loadingText]}>
                {isLoading ? 'Đang tải nội dung chương...' : 'Đang tóm tắt nội dung...'}
              </Text>
              {!isLoading && (
                <Text style={[AppTypo.mini.regular, styles.loadingSubtext]}>
                  Quá trình này có thể mất vài giây
                </Text>
              )}
            </View>
          ) : summarizedContent ? (
            <ContentDisplay
              chapterHtml={summarizedContent}
              font={font!}
              fontSize={fontSize!}
              lineHeight={lineHeight!}
              onLoaded={() => {}}
            />
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
  keyPointsContainer: {
    backgroundColor: AppPalette.gray50,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  keyPointsTitle: {
    color: AppPalette.gray800,
    marginBottom: 8,
  },
  keyPointItem: {
    marginVertical: 2,
  },
  keyPointText: {
    color: AppPalette.gray700,
    lineHeight: 18,
  },
})
