import React, { useCallback, useEffect, useMemo, useState, forwardRef, useImperativeHandle } from 'react'
import { ActivityIndicator, StyleSheet, Text, View, Alert } from 'react-native'
import BottomSheet, { BottomSheetScrollView, BottomSheetView } from '@gorhom/bottom-sheet'
import { VectorIcon } from '@/components/Icon'
import { AppPalette } from '@/assets'
import { getBookChapterContent, getChapterHtml, showToastError } from '@/utils'
import { useBookInfo, useReading } from '@/controllers/context'
import RenderHTML from 'react-native-render-html'
import { AppConst, AppTypo } from '@/constants'
import { summarizeChapter, validateGeminiApiKey, extractKeyPoints } from '@/services/gemini-service'

export interface ReviewBottomSheetRef {
  present: () => void
  close: () => void
}

interface ReviewBottomSheetProps {
  bookId?: string
  chapterNumber?: number
  onNavigateToChapter?: (direction: 'prev' | 'next') => void
}

const ReviewBottomSheet = forwardRef<ReviewBottomSheetRef, ReviewBottomSheetProps>(
  ({ bookId, chapterNumber, onNavigateToChapter }, ref) => {
    const bottomSheetRef = React.useRef<BottomSheet>(null)
    const [chapterContent, setChapterContent] = useState('')
    const [summarizedContent, setSummarizedContent] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isSummarizing, setIsSummarizing] = useState(false)
    const [keyPoints, setKeyPoints] = useState<string[]>([])
    const [showKeyPoints, setShowKeyPoints] = useState(false)
    
    const reading = useReading()
    const currentBookId = bookId || reading.currentBook
    const currentChapterNumber = chapterNumber || (reading.books[currentBookId] ?? 1)
    const bookInfo = useBookInfo(currentBookId)

    const snapPoints = useMemo(() => ['25%', '50%', '90%'], [])

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
        setKeyPoints([])
        
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
        setKeyPoints(points)
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

    const renderContent = () => {
      if (isLoading) {
        return (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={AppPalette.blue500} />
            <Text style={[AppTypo.body.regular, styles.loadingText]}>
              Đang tải nội dung chương...
            </Text>
          </View>
        )
      }

      if (isSummarizing) {
        return (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={AppPalette.blue500} />
            <Text style={[AppTypo.body.regular, styles.loadingText]}>Đang tóm tắt nội dung...</Text>
            <Text style={[AppTypo.mini.regular, styles.loadingSubtext]}>
              Quá trình này có thể mất vài giây
            </Text>
          </View>
        )
      }

      if (summarizedContent) {
        return (
          <View style={styles.summaryContainer}>
            <View style={styles.summaryHeader}>
              <VectorIcon
                name="wand-magic-sparkles"
                font="FontAwesome6"
                size={16}
                color={AppPalette.blue500}
              />
              <Text style={[AppTypo.body.semiBold, styles.summaryTitle]}>Tóm tắt nội dung</Text>
              {keyPoints.length > 0 && (
                <VectorIcon
                  name={showKeyPoints ? 'chevron-up' : 'chevron-down'}
                  font="FontAwesome6"
                  size={14}
                  color={AppPalette.gray600}
                  buttonStyle={styles.toggleButton}
                  onPress={() => setShowKeyPoints(!showKeyPoints)}
                />
              )}
            </View>

            {/* Key Points Section */}
            {showKeyPoints && keyPoints.length > 0 && (
              <View style={styles.keyPointsContainer}>
                <Text style={[AppTypo.body.medium, styles.keyPointsTitle]}>📌 Điểm chính</Text>
                {keyPoints.map((point, index) => (
                  <View key={index} style={styles.keyPointItem}>
                    <Text style={[AppTypo.mini.regular, styles.keyPointText]}>• {point}</Text>
                  </View>
                ))}
              </View>
            )}

            <RenderHTML
              source={{ html: summarizedContent }}
              baseStyle={styles.htmlContent}
              contentWidth={AppConst.windowWidth() - 64}
              systemFonts={['Inter-Regular', 'Inter-Medium', 'Inter-SemiBold']}
              tagsStyles={{
                body: {
                  fontFamily: 'Inter-Regular',
                  lineHeight: 24,
                  fontSize: 16,
                  color: AppPalette.gray800,
                },
                p: {
                  marginVertical: 8,
                  textAlign: 'justify',
                },
                strong: {
                  fontFamily: 'Inter-SemiBold',
                  color: AppPalette.gray900,
                },
                em: {
                  fontFamily: 'Inter-Medium',
                  fontStyle: 'italic',
                  color: AppPalette.blue500,
                },
              }}
            />
          </View>
        )
      }

      return (
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
      )
    }

    return (
      <BottomSheet
        ref={bottomSheetRef}
        snapPoints={snapPoints}
        index={-1}
        enablePanDownToClose
        backgroundStyle={styles.bottomSheetBackground}
        handleIndicatorStyle={styles.handleIndicator}>
        <BottomSheetView style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <VectorIcon
              name="xmark"
              font="FontAwesome6"
              size={18}
              buttonStyle={styles.headerButton}
              color={AppPalette.gray600}
              onPress={handleClose}
            />
            <View style={styles.headerCenter}>
              <Text style={[AppTypo.mini.regular, styles.headerSubtitle]} numberOfLines={1}>
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

          {/* Content */}
          <BottomSheetScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}>
            {renderContent()}
          </BottomSheetScrollView>
        </BottomSheetView>
      </BottomSheet>
    )
  },
)

ReviewBottomSheet.displayName = 'ReviewBottomSheet'

export default ReviewBottomSheet

const styles = StyleSheet.create({
  bottomSheetBackground: {
    backgroundColor: '#F9F7F4',
  },
  handleIndicator: {
    backgroundColor: AppPalette.gray300,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: AppPalette.gray200,
  },
  headerButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: AppPalette.gray100,
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
  },
  contentContainer: {
    flexGrow: 1,
    padding: 16,
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
  summaryContainer: {
    backgroundColor: AppPalette.white,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
