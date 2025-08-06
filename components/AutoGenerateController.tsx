import useSummary from '@/hooks/use-summary'
import useTtsAudio from '@/hooks/use-tts-audio'
import { clearBookCache } from '@/utils/cache-manager'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useBookInfo } from '../controllers/context'
import { getBookChapterContent } from '../utils'
import { breakSummaryIntoLines } from '@/utils/string-helpers'

interface AutoGenerateControllerProps {
  bookId: string
  onClose?: () => void
}

const AutoGenerateController: React.FC<AutoGenerateControllerProps> = ({ bookId, onClose }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [loadingChapter, setLoadingChapter] = useState<number | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Lấy thông tin book từ bookId
  const bookInfo = useBookInfo(bookId)
  const bookTitle = bookInfo?.name || 'Chưa xác định'
  const totalChapters = bookInfo?.references?.length || 0
  const refStopProcess = useRef(false)
  const [state, setState] = useState({
    isRunning: false,
    currentChapter: 0,
  })

  const startSummary = useSummary()
  const { startGenerateAudio, stopGenerateAudio } = useTtsAudio(false)

  // Function để load content của 1 chapter
  const loadChapterContent = useCallback(
    async (chapterNumber: number): Promise<string | null> => {
      try {
        setLoadingChapter(chapterNumber)
        const content = await getBookChapterContent(bookId, chapterNumber)
        return content
      } catch (error) {
        console.error(`Error loading chapter ${chapterNumber}:`, error)
        throw error
      } finally {
        setLoadingChapter(null)
      }
    },
    [bookId],
  )

  const handleStart = async () => {
    if (!bookInfo) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin sách')
      return
    }

    if (totalChapters === 0) {
      Alert.alert('Lỗi', 'Không có thông tin về số chương của truyện')
      return
    }

    const message = `Sẽ tạo tóm tắt và audio cho tất cả ${totalChapters} chương của "${bookTitle}".\n\nQuá trình này sẽ xử lý từng chương một cách tuần tự và có thể mất khá lâu.`

    const title = 'Bắt đầu tự động tạo Summary & TTS'

    Alert.alert(title, message, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Bắt đầu',
        onPress: startGenerate,
      },
    ])
  }

  const startGenerate = async () => {
    try {
      refStopProcess.current = false
      setIsLoading(true)
      for (let chapter = 1; chapter <= totalChapters; chapter++) {
        setState((prev) => ({
          ...prev,
          isRunning: true,
          currentChapter: chapter,
        }))

        if (refStopProcess.current) {
          Alert.alert('Quá trình đã dừng', 'Bạn có thể tiếp tục lại sau.')
          setState({
            isRunning: false,
            currentChapter: 0,
          })
          break
        }
        const content = await loadChapterContent(chapter)
        if (!content) {
          setErrorMessage(`Không thể tải nội dung chương ${chapter}`)
          continue
        }

        // Tạo tóm tắt cho chương
        const summary = await startSummary(bookId, bookTitle, chapter, content)
        if (!summary) {
          setErrorMessage(`Không thể tạo tóm tắt cho chương ${chapter}`)
          continue
        }
        console.log('Đã rút gọn chương:', chapter, content.length, '->', summary.length)
        console.log(`Tóm tắt chương ${chapter}:`, summary)

        const ttsSummay = breakSummaryIntoLines(summary).slice(0, 5).join('\n')

        // Tạo audio từ tóm tắt
        const success = await startGenerateAudio(ttsSummay, bookId, chapter)
        if (!success) {
          setErrorMessage(`Không thể tạo audio cho chương ${chapter}`)
          continue
        }
      }
      Alert.alert('Hoàn thành', 'Đã tạo tóm tắt và audio cho tất cả các chương.')
    } catch (error) {
      console.error('Error starting auto-generate:', error)
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStop = () => {
    Alert.alert('Dừng quá trình', 'Bạn có thể tiếp tục lại sau.', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Dừng',
        style: 'destructive',
        onPress: () => {
          refStopProcess.current = true
          stopGenerateAudio()
        },
      },
    ])
  }

  const handleClearCache = () => {
    Alert.alert('Xóa cache', 'Sẽ xóa toàn bộ tiến trình đã lưu. Bạn sẽ phải bắt đầu lại từ đầu.', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: () => {
          clearBookCache(bookId)
          setErrorMessage(null)
        },
      },
    ])
  }

  // Clear error when component mounts or bookId changes
  useEffect(() => {
    setErrorMessage(null)
  }, [bookId])

  const getStatusText = (): string => {
    if (state.isRunning) {
      if (state.currentChapter) {
        return `Đang xử lý chương ${state.currentChapter}...`
      }
      return 'Đang khởi tạo...'
    }
    return 'Chưa bắt đầu'
  }

  const getStatusColor = (): string => {
    if (isLoading) return '#FF9500'
    if (errorMessage) return '#FF3B30'
    if (state.isRunning) return '#007AFF'
    return '#8E8E93'
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Tự động tạo Summary & TTS</Text>
        <Text style={styles.bookTitle}>{bookTitle}</Text>
        {!!onClose && (
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Status Section */}
      <View style={styles.statusSection}>
        <Text style={styles.sectionTitle}>Trạng thái</Text>
        <View style={styles.statusCard}>
          <Text style={[styles.statusText, { color: getStatusColor() }]}>{getStatusText()}</Text>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${Math.round((state.currentChapter / totalChapters) * 100)}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {`${Math.round((state.currentChapter / totalChapters) * 100)}%`}
            </Text>
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Hoàn thành</Text>
              <Text style={styles.statValue}>
                {state.currentChapter}/{totalChapters}
              </Text>
            </View>
            {!!state.currentChapter && (
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Chương hiện tại</Text>
                <Text style={styles.statValue}>{state.currentChapter}</Text>
              </View>
            )}
            {!!loadingChapter && (
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Đang load</Text>
                <Text style={styles.statValue}>Chương {loadingChapter}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <View>
        {!!errorMessage && (
          <Text style={{ color: '#FF3B30', padding: 20, textAlign: 'center' }}>{errorMessage}</Text>
        )}
      </View>

      {/* Controls Section */}
      <View style={styles.controlsSection}>
        <Text style={styles.sectionTitle}>Điều khiển</Text>

        {!state.isRunning && !isLoading && (
          <TouchableOpacity
            style={[styles.primaryButton, { opacity: isLoading ? 0.5 : 1 }]}
            onPress={handleStart}
            disabled={isLoading}>
            <Text style={styles.primaryButtonText}>{'Bắt đầu'}</Text>
          </TouchableOpacity>
        )}

        {!state.isRunning && !isLoading && (
          <TouchableOpacity
            style={[styles.primaryButton, { opacity: isLoading ? 0.5 : 1 }]}
            onPress={handleStart}
            disabled={isLoading}>
            <Text style={styles.primaryButtonText}>{'Tiếp tục'}</Text>
          </TouchableOpacity>
        )}

        {!!isLoading && (
          <TouchableOpacity style={styles.loadingButton} disabled>
            <Text style={styles.loadingButtonText}>Đang tải nội dung chương...</Text>
          </TouchableOpacity>
        )}

        {!!state.isRunning && (
          <TouchableOpacity style={styles.dangerButton} onPress={handleStop}>
            <Text style={styles.dangerButtonText}>Dừng</Text>
          </TouchableOpacity>
        )}

        <View style={styles.secondaryButtonsContainer}>
          <TouchableOpacity
            style={[styles.secondaryButton, { opacity: state.isRunning || isLoading ? 0.5 : 1 }]}
            onPress={handleClearCache}
            disabled={state.isRunning || isLoading}>
            <Text style={styles.secondaryButtonText}>{'Xóa cache'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Info Section */}
      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Thông tin</Text>
        <Text style={styles.infoText}>
          • Quá trình sẽ tự động tạo tóm tắt từ nội dung HTML của mỗi chương
        </Text>
        <Text style={styles.infoText}>• Sau khi có tóm tắt, sẽ tự động tạo file audio TTS</Text>
        <Text style={styles.infoText}>
          • Tất cả được lưu vào cache, nếu bị ngắt có thể tiếp tục
        </Text>
        <Text style={styles.infoText}>
          • Có thể mất vài phút cho mỗi chương tùy thuộc vào độ dài
        </Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    position: 'relative',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 5,
  },
  bookTitle: {
    fontSize: 16,
    color: '#8E8E93',
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E5E5EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  statusSection: {
    padding: 20,
  },
  controlsSection: {
    padding: 20,
  },
  infoSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 15,
  },
  statusCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 15,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  progressBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    marginRight: 10,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
    minWidth: 40,
    textAlign: 'right',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 15,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  dangerButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 15,
  },
  dangerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  secondaryButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 0.48,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  },
  loadingButton: {
    backgroundColor: '#FF9500',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 15,
    opacity: 0.8,
  },
  loadingButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
    marginBottom: 8,
  },
})

export default AutoGenerateController
