import { useCallback, useEffect, useState } from 'react'
import { DeviceEventEmitter } from 'react-native'
import {
  autoGenerateService,
  ChapterData,
  getAutoGenerateStats,
  isAutoGenerateRunning,
  startAutoGenerate,
  stopAutoGenerate,
} from '../services/auto-generate-service'

export interface AutoGenerateState {
  isRunning: boolean
  progress: number // 0-100
  currentChapter: number | null
  completedChapters: number
  totalChapters: number
  canResume: boolean
  lastError: string | null
}

export interface AutoGenerateHookReturn {
  state: AutoGenerateState
  startGenerate: (
    chapters: ChapterData[],
    options?: {
      voice?: string
      startFromChapter?: number
      resumeFromProgress?: boolean
      totalChapters?: number
    },
  ) => Promise<void>
  stopGenerate: () => void
  clearCache: () => void
  refreshState: () => void
}

export default function useAutoGenerate(bookId: string): AutoGenerateHookReturn {
  const [state, setState] = useState<AutoGenerateState>({
    isRunning: false,
    progress: 0,
    currentChapter: null,
    completedChapters: 0,
    totalChapters: 0,
    canResume: false,
    lastError: null,
  })

  // Update state từ service stats
  const refreshState = useCallback(() => {
    const stats = getAutoGenerateStats(bookId)
    const running = isAutoGenerateRunning(bookId)

    setState({
      isRunning: running,
      progress: stats?.progressPercentage || 0,
      currentChapter: stats?.currentChapter || null,
      completedChapters: stats?.completedChapters || 0,
      totalChapters: stats?.totalChapters || 0,
      canResume: stats?.canResume || false,
      lastError: stats?.lastError || null,
    })
  }, [bookId])

  // Initialize state khi component mount
  useEffect(() => {
    refreshState()
  }, [refreshState])

  // Listen to events
  useEffect(() => {
    const listeners = [
      DeviceEventEmitter.addListener('auto_generate_started', (data) => {
        if (data.bookId === bookId) {
          setState((prev) => ({
            ...prev,
            isRunning: true,
            lastError: null,
          }))
        }
      }),

      DeviceEventEmitter.addListener('auto_generate_progress', (data) => {
        if (data.bookId === bookId) {
          setState((prev) => ({
            ...prev,
            progress: Math.round(data.progress * 100),
            currentChapter: data.chapterNumber,
            completedChapters: data.completedChapters,
            totalChapters: data.totalChapters,
          }))
        }
      }),

      DeviceEventEmitter.addListener('auto_generate_chapter_completed', (data) => {
        if (data.bookId === bookId) {
          setState((prev) => ({
            ...prev,
            completedChapters: data.completedChapters,
            progress: Math.round((data.completedChapters / data.totalChapters) * 100),
          }))
        }
      }),

      DeviceEventEmitter.addListener('auto_generate_completed', (data) => {
        if (data.bookId === bookId) {
          setState((prev) => ({
            ...prev,
            isRunning: false,
            progress: 100,
            canResume: false,
            lastError: null,
          }))
        }
      }),

      DeviceEventEmitter.addListener('auto_generate_cancelled', (data) => {
        if (data.bookId === bookId) {
          setState((prev) => ({
            ...prev,
            isRunning: false,
            canResume: prev.completedChapters < prev.totalChapters,
          }))
        }
      }),

      DeviceEventEmitter.addListener('auto_generate_paused', (data) => {
        if (data.bookId === bookId) {
          setState((prev) => ({
            ...prev,
            isRunning: false,
            canResume: data.canResume,
          }))
        }
      }),

      DeviceEventEmitter.addListener('auto_generate_error', (data) => {
        if (data.bookId === bookId) {
          setState((prev) => ({
            ...prev,
            lastError: data.error,
            isRunning: false,
          }))
        }
      }),
    ]

    return () => {
      listeners.forEach((listener) => listener.remove())
    }
  }, [bookId])

  // Start generate function
  const startGenerate = useCallback(
    async (
      chapters: ChapterData[],
      options: {
        voice?: string
        startFromChapter?: number
        resumeFromProgress?: boolean
        totalChapters?: number
      } = {},
    ) => {
      try {
        await startAutoGenerate(bookId, chapters, {
          voice: options.voice || 'BV421_vivn_streaming',
          startFromChapter: options.startFromChapter || 1,
          resumeFromProgress: options.resumeFromProgress !== false, // default true
          totalChapters: options.totalChapters,
        })
      } catch (error) {
        console.error('Error starting auto generate:', error)
        setState((prev) => ({
          ...prev,
          lastError: error instanceof Error ? error.message : 'Unknown error',
          isRunning: false,
        }))
      }
    },
    [bookId],
  )

  // Resume generate function
  const resumeGenerate = useCallback(
    async (
      chapters: ChapterData[],
      options: {
        voice?: string
        totalChapters?: number
      } = {},
    ) => {
      try {
        await startAutoGenerate(bookId, chapters, {
          voice: options.voice || 'BV421_vivn_streaming',
          resumeFromProgress: true,
          totalChapters: options.totalChapters,
        })
      } catch (error) {
        console.error('Error resuming auto generate:', error)
        setState((prev) => ({
          ...prev,
          lastError: error instanceof Error ? error.message : 'Unknown error',
          isRunning: false,
        }))
      }
    },
    [bookId],
  )

  // Stop generate function
  const stopGenerate = useCallback(() => {
    stopAutoGenerate(bookId)
  }, [bookId])

  // Clear cache function
  const clearCache = useCallback(() => {
    autoGenerateService.clearAutoGenerateCache(bookId)
    refreshState()
  }, [bookId, refreshState])

  return {
    state,
    startGenerate,
    stopGenerate,
    clearCache,
    refreshState,
  }
}
