import React, { useState, useEffect, useCallback } from 'react'
import { View, Text, TouchableOpacity, Alert, StyleSheet, ScrollView } from 'react-native'
import useAutoGenerate, { AutoGenerateState } from '../hooks/use-auto-generate'
import { ChapterData } from '../services/auto-generate-service'
import { useBookInfo } from '../controllers/context'
import { getBookChapterContent } from '../utils'

interface AutoGenerateControllerProps {
  bookId: string
  onClose?: () => void
}

const AutoGenerateController: React.FC<AutoGenerateControllerProps> = ({
  bookId,
  onClose,
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [loadingChapter, setLoadingChapter] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Lấy thông tin book từ bookId
  const bookInfo = useBookInfo(bookId)
  const bookTitle = bookInfo?.name || 'Chưa xác định'
  const totalChapters = bookInfo?.references?.length || 0

  const {
    state,
    startGenerate,
    stopGenerate,
    resumeGenerate,
    clearCache,
    refreshState,
  } = useAutoGenerate(bookId)

  // Function để load content của 1 chapter
  const loadChapterContent = useCallback(async (chapterNumber: number): Promise<string | null> => {
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
  }, [bookId])

  // Function để tạo ChapterData cho 1 chapter cụ thể (dùng cho luồng tuần tự)
  const createChapterData = useCallback(async (chapterNumber: number): Promise<ChapterData> => {
    const content = await loadChapterContent(chapterNumber)
    if (!content) {
      throw new Error(`Cannot load content for chapter ${chapterNumber}`)
    }
    
    return {
      chapterNumber,
      chapterHtml: content,
      bookTitle: bookTitle,
    }
  }, [loadChapterContent, bookTitle])

  // Function để tạo tất cả ChapterData (dùng khi cần thiết)
  const generateAllChaptersData = useCallback(async (
    startChapter: number = 1,
    endChapter?: number
  ): Promise<ChapterData[]> => {
    const end = endChapter || totalChapters
    const chapters: ChapterData[] = []
    
    setIsLoading(true)
    setError(null)

    try {
      // Load content cho từng chapter
      for (let i = startChapter; i <= end; i++) {
        const chapterData = await createChapterData(i)
        chapters.push(chapterData)
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      setError(errorMsg)
      throw new Error(`Failed to load chapters: ${errorMsg}`)
    } finally {
      setIsLoading(false)
    }

    return chapters
  }, [totalChapters, createChapterData])

  const handleStart = async () => {
    if (!bookInfo) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin sách')
      return
    }

    if (totalChapters === 0) {
      Alert.alert('Lỗi', 'Không có thông tin về số chương của truyện')
      return
    }

    Alert.alert(
      'Bắt đầu tự động tạo Summary & TTS',
      `Sẽ tạo tóm tắt và audio cho tất cả ${totalChapters} chương của "${bookTitle}".\n\nQuá trình này sẽ xử lý từng chương một cách tuần tự và có thể mất khá lâu.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Bắt đầu',
          onPress: async () => {
            try {
              // Với luồng mới, ta chỉ cần truyền chapter đầu tiên và totalChapters
              // Service sẽ tự động load từng chapter một cách tuần tự
              const firstChapter = await createChapterData(1)
              await startGenerate([firstChapter], {
                voice: 'BV421_vivn_streaming',
                resumeFromProgress: true,
                totalChapters: totalChapters, // Truyền tổng số chapters
              })
            } catch (error) {
              Alert.alert('Lỗi', error instanceof Error ? error.message : 'Không thể bắt đầu')
            }
          },
        },
      ]
    )
  }

  const handleResume = async () => {
    if (!bookInfo) {
      Alert.alert('Lỗi', 'Không tìm thấy thông tin sách')
      return
    }

    Alert.alert(
      'Tiếp tục tự động tạo',
      'Sẽ tiếp tục từ chương đã bị ngắt.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Tiếp tục',
          onPress: async () => {
            try {
              // Lấy chapter hiện tại từ state để tiếp tục
              const currentChapter = state.currentChapter || 1
              const chapterData = await createChapterData(currentChapter)
              await resumeGenerate([chapterData], {
                voice: 'BV421_vivn_streaming',
                totalChapters: totalChapters, // Truyền tổng số chapters
              })
            } catch (error) {
              Alert.alert('Lỗi', error instanceof Error ? error.message : 'Không thể tiếp tục')
            }
          },
        },
      ]
    )
  }

  const handleStop = () => {
    Alert.alert(
      'Dừng quá trình',
      'Bạn có thể tiếp tục lại sau.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Dừng',
          style: 'destructive',
          onPress: stopGenerate,
        },
      ]
    )
  }

  const handleClearCache = () => {
    Alert.alert(
      'Xóa cache',
      'Sẽ xóa toàn bộ tiến trình đã lưu. Bạn sẽ phải bắt đầu lại từ đầu.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => {
            clearCache()
            setError(null) // Clear local error
          },
        },
      ]
    )
  }

  // Clear error when component mounts or bookId changes
  useEffect(() => {
    setError(null)
  }, [bookId])

  const getStatusText = (state: AutoGenerateState): string => {
    if (isLoading) {
      if (loadingChapter) {
        return `Đang tải nội dung chương ${loadingChapter}...`
      }
      return 'Đang tải nội dung các chương...'
    }

    if (error) {
      return `Lỗi: ${error}`
    }

    if (state.isRunning) {
      if (state.currentChapter) {
        return `Đang xử lý chương ${state.currentChapter}...`
      }
      return 'Đang khởi tạo...'
    }

    if (state.lastError) {
      return `Lỗi: ${state.lastError}`
    }

    if (state.progress === 100) {
      return 'Hoàn thành!'
    }

    if (state.canResume) {
      return 'Tạm dừng - có thể tiếp tục'
    }

    if (state.completedChapters > 0) {
      return `Đã hoàn thành ${state.completedChapters}/${state.totalChapters} chương`
    }

    return 'Chưa bắt đầu'
  }

  const getStatusColor = (state: AutoGenerateState): string => {
    if (isLoading) return '#FF9500'
    if (error) return '#FF3B30'
    if (state.isRunning) return '#007AFF'
    if (state.lastError) return '#FF3B30'
    if (state.progress === 100) return '#34C759'
    if (state.canResume) return '#FF9500'
    return '#8E8E93'
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Tự động tạo Summary & TTS</Text>
        <Text style={styles.bookTitle}>{bookTitle}</Text>
        {onClose && (
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Status Section */}
      <View style={styles.statusSection}>
        <Text style={styles.sectionTitle}>Trạng thái</Text>
        <View style={styles.statusCard}>
          <Text style={[styles.statusText, { color: getStatusColor(state) }]}>
            {getStatusText(state)}
          </Text>
          
          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <View 
                style={[
                  styles.progressBarFill, 
                  { width: `${state.progress}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>{state.progress}%</Text>
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Hoàn thành</Text>
              <Text style={styles.statValue}>
                {state.completedChapters}/{state.totalChapters || totalChapters}
              </Text>
            </View>
            {state.currentChapter && (
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Chương hiện tại</Text>
                <Text style={styles.statValue}>{state.currentChapter}</Text>
              </View>
            )}
            {loadingChapter && (
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Đang load</Text>
                <Text style={styles.statValue}>Chương {loadingChapter}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Controls Section */}
      <View style={styles.controlsSection}>
        <Text style={styles.sectionTitle}>Điều khiển</Text>
        
        {!state.isRunning && !state.canResume && !isLoading && (
          <TouchableOpacity 
            style={[styles.primaryButton, { opacity: isLoading ? 0.5 : 1 }]} 
            onPress={handleStart}
            disabled={isLoading}
          >
            <Text style={styles.primaryButtonText}>
              {state.completedChapters > 0 ? 'Bắt đầu lại' : 'Bắt đầu'}
            </Text>
          </TouchableOpacity>
        )}

        {!state.isRunning && state.canResume && !isLoading && (
          <TouchableOpacity 
            style={[styles.primaryButton, { opacity: isLoading ? 0.5 : 1 }]} 
            onPress={handleResume}
            disabled={isLoading}
          >
            <Text style={styles.primaryButtonText}>Tiếp tục</Text>
          </TouchableOpacity>
        )}

        {isLoading && (
          <TouchableOpacity style={styles.loadingButton} disabled>
            <Text style={styles.loadingButtonText}>
              Đang tải nội dung chương...
            </Text>
          </TouchableOpacity>
        )}

        {state.isRunning && (
          <TouchableOpacity style={styles.dangerButton} onPress={handleStop}>
            <Text style={styles.dangerButtonText}>Dừng</Text>
          </TouchableOpacity>
        )}

        <View style={styles.secondaryButtonsContainer}>
          <TouchableOpacity 
            style={[styles.secondaryButton, { opacity: (state.isRunning || isLoading) ? 0.5 : 1 }]} 
            onPress={refreshState}
            disabled={state.isRunning || isLoading}
          >
            <Text style={styles.secondaryButtonText}>Làm mới</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.secondaryButton, { opacity: (state.isRunning || isLoading) ? 0.5 : 1 }]} 
            onPress={handleClearCache}
            disabled={state.isRunning || isLoading}
          >
            <Text style={styles.secondaryButtonText}>Xóa cache</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Info Section */}
      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Thông tin</Text>
        <Text style={styles.infoText}>
          • Quá trình sẽ tự động tạo tóm tắt từ nội dung HTML của mỗi chương
        </Text>
        <Text style={styles.infoText}>
          • Sau khi có tóm tắt, sẽ tự động tạo file audio TTS
        </Text>
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
