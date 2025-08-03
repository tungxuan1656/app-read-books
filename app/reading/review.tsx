
import { Screen } from '@/components/Screen'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, Text, View, Alert } from 'react-native'
import { VectorIcon } from '@/components/Icon'
import { AppPalette } from '../../assets'
import { router, useLocalSearchParams } from 'expo-router'
import { getBookChapterContent, getChapterHtml, showToastError } from '../../utils'
import { useBookInfo, useReading } from '../../controllers/context'
import RenderHTML from 'react-native-render-html'
import { AppConst, AppStyles, AppTypo } from '@/constants'
import { summarizeChapter, validateGeminiApiKey, extractKeyPoints } from '@/services/gemini-service'

const ReadingReview = () => {
  const params = useLocalSearchParams<{ bookId?: string; chapter?: string }>()
  const [chapterContent, setChapterContent] = useState('')
  const [summarizedContent, setSummarizedContent] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [keyPoints, setKeyPoints] = useState<string[]>([])
  const [showKeyPoints, setShowKeyPoints] = useState(false)
  const reading = useReading()

  // Lấy bookId và chapter từ params hoặc từ reading context
  const bookId = params.bookId || reading.currentBook
  const chapterNumber = params.chapter ? parseInt(params.chapter) : reading.books[bookId] ?? 1

  const bookInfo = useBookInfo(bookId)

  const currentChapter = useMemo(() => {
    if (bookInfo && chapterNumber) {
      return bookInfo.references?.[chapterNumber - 1]
    }
  }, [bookInfo, chapterNumber])

  const chapterHtml = useMemo(() => {
    if (!chapterContent) return ''
    return getChapterHtml(chapterContent)
  }, [chapterContent])

  // Load chapter content
  useEffect(() => {
    if (bookId && chapterNumber) {
      setIsLoading(true)
      getBookChapterContent(bookId, chapterNumber)
        .then((content) => {
          setChapterContent(content)
          setIsLoading(false)
        })
        .catch((error) => {
          showToastError(error)
          setIsLoading(false)
        })
    }
  }, [bookId, chapterNumber])

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
      // Chạy song song cả tóm tắt và trích xuất key points
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

  const handleExtractKeyPoints = useCallback(async () => {
    if (!chapterHtml) {
      Alert.alert('Lỗi', 'Không có nội dung để trích xuất key points')
      return
    }

    if (!validateGeminiApiKey()) {
      Alert.alert(
        'Thiếu API Key',
        'Vui lòng cấu hình EXPO_PUBLIC_GEMINI_API_KEY trong file .env để sử dụng tính năng trích xuất key points',
      )
      return
    }

    setIsSummarizing(true)
    try {
      const points = await extractKeyPoints({
        chapterHtml,
        bookTitle: bookInfo?.name,
      })
      setKeyPoints(points)
    } catch (error) {
      console.error('Error extracting key points:', error)
      Alert.alert(
        'Lỗi trích xuất',
        error instanceof Error ? error.message : 'Có lỗi xảy ra khi trích xuất key points',
      )
    } finally {
      setIsSummarizing(false)
    }
  }, [chapterHtml, bookInfo])

  const goBackToReading = () => {
    router.back()
  }

  const goToOriginalChapter = () => {
    router.push(`/reading?bookId=${bookId}`)
  }

  return (
    <Screen.Container safe={'all'} style={{ backgroundColor: '#F9F7F4' }}>
      {/* Header */}
      <View style={styles.header}>
        <VectorIcon
          name="arrow-left"
          font="FontAwesome6"
          size={18}
          buttonStyle={styles.headerButton}
          color={AppPalette.gray600}
          onPress={goBackToReading}
        />
        <View style={styles.headerCenter}>
          <Text style={[AppTypo.mini.regular, styles.headerSubtitle]} numberOfLines={1}>
            {currentChapter}
          </Text>
        </View>
        <VectorIcon
          name="book"
          font="FontAwesome6"
          size={18}
          buttonStyle={styles.headerButton}
          color={AppPalette.gray600}
          onPress={goToOriginalChapter}
        />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={AppPalette.blue500} />
            <Text style={[AppTypo.body.regular, styles.loadingText]}>
              Đang tải nội dung chương...
            </Text>
          </View>
        ) : isSummarizing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={AppPalette.blue500} />
            <Text style={[AppTypo.body.regular, styles.loadingText]}>Đang tóm tắt nội dung...</Text>
            <Text style={[AppTypo.mini.regular, styles.loadingSubtext]}>
              Quá trình này có thể mất vài giây
            </Text>
          </View>
        ) : summarizedContent ? (
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
              contentWidth={AppConst.windowWidth() - 32}
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
      </ScrollView>

      <View style={styles.viewNavigate}>
        <VectorIcon
          name="arrow-left"
          font="FontAwesome6"
          size={14}
          buttonStyle={{ width: 28, height: 28 }}
          color={AppPalette.white}
          onPress={previousChapter}
        />
        <VectorIcon
          name="arrow-right"
          font="FontAwesome6"
          size={14}
          buttonStyle={{ width: 28, height: 28 }}
          color={AppPalette.white}
          onPress={nextChapter}
        />
      </View>
    </Screen.Container>
  )
}

export default ReadingReview

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppPalette.gray100,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  headerTitle: {
    color: AppPalette.gray900,
    textAlign: 'center',
  },
  headerSubtitle: {
    color: AppPalette.gray600,
    textAlign: 'center',
    marginTop: 2,
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
    minHeight: 300,
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
  },
  htmlContent: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
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
  bottomActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: AppPalette.white,
    borderTopWidth: 1,
    borderTopColor: AppPalette.gray200,
  },
  retryButtonBottom: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AppPalette.blue500,
  },
  actionText: {
    marginLeft: 8,
    color: AppPalette.gray600,
  },
  toggleButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: AppPalette.gray100,
    marginLeft: 'auto',
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
  keyPointsContent: {
    marginTop: 8,
  },
  keyPointItem: {
    marginVertical: 2,
  },
  keyPointText: {
    color: AppPalette.gray700,
    lineHeight: 18,
  },
  buttonInfo: {
    width: 40,
    height: 40,
    borderRadius: 40,
    backgroundColor: AppPalette.gray100,
    position: 'absolute',
    right: 12,
    bottom: 12,
  },
  buttonBack: {
    width: 44,
    height: 44,
    borderRadius: 40,
    position: 'absolute',
    left: 10,
    top: 12,
  },
  viewNavigate: {
    flexDirection: 'row',
    height: 28,
    paddingHorizontal: 2,
    position: 'absolute',
    right: 10,
    top: 16,
    backgroundColor: AppPalette.gray400,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewLoading: {
    height: AppConst.windowHeight(),
    backgroundColor: '#F5F1E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
})
