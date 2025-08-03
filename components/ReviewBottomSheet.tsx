import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  forwardRef,
  useImperativeHandle,
} from 'react'
import { ActivityIndicator, StyleSheet, Text, View, Alert, TouchableOpacity } from 'react-native'
import BottomSheet, { BottomSheetScrollView, BottomSheetView } from '@gorhom/bottom-sheet'
import { VectorIcon } from '@/components/Icon'
import { AppPalette } from '@/assets'
import { getBookChapterContent, getChapterHtml, showToastError } from '@/utils'
import { useBookInfo, useReading } from '@/controllers/context'
import RenderHTML from 'react-native-render-html'
import { AppConst, AppTypo } from '@/constants'
import { summarizeChapter, validateGeminiApiKey, extractKeyPoints } from '@/services/gemini-service'
import { ContentDisplay } from './ContentDisplay'
import { convertTTSCapcut, splitContentToParagraph } from '@/services/convert-tts'
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio'
import * as FileSystem from 'expo-file-system'

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
    
    // TTS states
    const [isGeneratingTTS, setIsGeneratingTTS] = useState(false)
    const [audioFilePaths, setAudioFilePaths] = useState<string[]>([])
    const [currentAudioIndex, setCurrentAudioIndex] = useState(0)
    const [isPlaylistMode, setIsPlaylistMode] = useState(false)

    // Audio player setup
    const currentAudioPath = audioFilePaths[currentAudioIndex] || null
    const player = useAudioPlayer(currentAudioPath)
    const status = useAudioPlayerStatus(player)

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
        
        // Reset TTS states
        setAudioFilePaths([])
        setCurrentAudioIndex(0)
        setIsPlaylistMode(false)

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

    // Auto-play next audio when current finishes
    useEffect(() => {
      if (status && status.didJustFinish && isPlaylistMode && currentAudioIndex < audioFilePaths.length - 1) {
        setCurrentAudioIndex(prev => prev + 1)
      }
    }, [status?.didJustFinish, isPlaylistMode, currentAudioIndex, audioFilePaths.length])

    // Auto-play when audio source changes in playlist mode
    useEffect(() => {
      if (currentAudioPath && isPlaylistMode && player) {
        player.seekTo(0)
        player.play()
      }
    }, [currentAudioPath, isPlaylistMode])

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
        const summary = await summarizeChapter({
          chapterHtml,
          bookTitle: bookInfo?.name,
        })

        setSummarizedContent(summary)
        
        // Auto-generate TTS after summarizing
        await generateTTSFromSummary(summary)
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

    const generateTTSFromSummary = useCallback(async (content: string) => {
      if (!content) return

      setIsGeneratingTTS(true)
      try {
        // Split content into sentences
        const sentences = splitContentToParagraph(content)
        if (sentences.length === 0) return

        // Create temporary folder for this summary
        const tempFolder = `${FileSystem.cacheDirectory}tts_summary_${Date.now()}/`
        await FileSystem.makeDirectoryAsync(tempFolder, { intermediates: true })

        // Generate TTS for all sentences
        const success = await convertTTSCapcut(sentences, tempFolder, { voice: 'BV421_vivn_streaming' })
        
        if (success) {
          // Get all generated audio file paths
          const files = await FileSystem.readDirectoryAsync(tempFolder)
          const audioPaths = files
            .filter(file => file.endsWith('.mp3'))
            .sort()
            .map(file => `${tempFolder}${file}`)
          
          setAudioFilePaths(audioPaths)
          setCurrentAudioIndex(0)
        }
      } catch (error) {
        console.error('Error generating TTS:', error)
        Alert.alert('Lỗi TTS', 'Không thể tạo audio từ nội dung tóm tắt')
      } finally {
        setIsGeneratingTTS(false)
      }
    }, [])

    const handlePlayPause = useCallback(() => {
      if (!currentAudioPath) return
      
      if (status?.playing) {
        player.pause()
      } else {
        player.play()
      }
    }, [currentAudioPath, status?.playing, player])

    const handlePrevious = useCallback(() => {
      if (currentAudioIndex > 0) {
        setCurrentAudioIndex(prev => prev - 1)
      }
    }, [currentAudioIndex])

    const handleNext = useCallback(() => {
      if (currentAudioIndex < audioFilePaths.length - 1) {
        setCurrentAudioIndex(prev => prev + 1)
      }
    }, [currentAudioIndex, audioFilePaths.length])

    const togglePlaylistMode = useCallback(() => {
      setIsPlaylistMode(prev => !prev)
    }, [])

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
            <View style={styles.contentContainer}>
              {/* TTS Controls */}
              {(audioFilePaths.length > 0 || isGeneratingTTS) && (
                <View style={styles.ttsContainer}>
                  <View style={styles.ttsHeader}>
                    <VectorIcon
                      name="volume-high"
                      font="FontAwesome6"
                      size={16}
                      color={AppPalette.blue500}
                    />
                    <Text style={[AppTypo.caption.semiBold, styles.ttsTitle]}>
                      Audio Tóm Tắt
                    </Text>
                    {audioFilePaths.length > 1 && (
                      <TouchableOpacity onPress={togglePlaylistMode} style={styles.playlistButton}>
                        <VectorIcon
                          name={isPlaylistMode ? "list-check" : "list"}
                          font="FontAwesome6"
                          size={12}
                          color={isPlaylistMode ? AppPalette.blue500 : AppPalette.gray500}
                        />
                        <Text style={[AppTypo.mini.regular, { 
                          color: isPlaylistMode ? AppPalette.blue500 : AppPalette.gray500,
                          marginLeft: 4 
                        }]}>
                          Auto
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {isGeneratingTTS ? (
                    <View style={styles.ttsLoading}>
                      <ActivityIndicator size="small" color={AppPalette.blue500} />
                      <Text style={[AppTypo.mini.regular, styles.ttsLoadingText]}>
                        Đang tạo audio...
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.ttsControls}>
                      <View style={styles.ttsProgress}>
                        <Text style={[AppTypo.mini.regular, styles.progressText]}>
                          {currentAudioIndex + 1} / {audioFilePaths.length}
                        </Text>
                        {status && (
                          <Text style={[AppTypo.mini.regular, styles.progressText]}>
                            {Math.floor(status.currentTime || 0)}s / {Math.floor(status.duration || 0)}s
                          </Text>
                        )}
                      </View>
                      
                      <View style={styles.ttsButtons}>
                        <TouchableOpacity 
                          onPress={handlePrevious} 
                          disabled={currentAudioIndex === 0}
                          style={[styles.ttsButton, currentAudioIndex === 0 && styles.ttsButtonDisabled]}
                        >
                          <VectorIcon
                            name="backward-step"
                            font="FontAwesome6"
                            size={14}
                            color={currentAudioIndex === 0 ? AppPalette.gray300 : AppPalette.gray700}
                          />
                        </TouchableOpacity>

                        <TouchableOpacity onPress={handlePlayPause} style={styles.ttsPlayButton}>
                          <VectorIcon
                            name={status?.playing ? "pause" : "play"}
                            font="FontAwesome6"
                            size={16}
                            color={AppPalette.white}
                          />
                        </TouchableOpacity>

                        <TouchableOpacity 
                          onPress={handleNext} 
                          disabled={currentAudioIndex === audioFilePaths.length - 1}
                          style={[styles.ttsButton, currentAudioIndex === audioFilePaths.length - 1 && styles.ttsButtonDisabled]}
                        >
                          <VectorIcon
                            name="forward-step"
                            font="FontAwesome6"
                            size={14}
                            color={currentAudioIndex === audioFilePaths.length - 1 ? AppPalette.gray300 : AppPalette.gray700}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
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
                {summarizedContent}
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
