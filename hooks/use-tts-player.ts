import { audioPlayerService } from '@/services/audio-player.service'
import { convertTTSCapcut, stopConvertTTSCapcut } from '@/services/tts.service'
import { formatContentForTTS } from '@/utils/string.helpers'
import { useCallback, useEffect, useRef, useState } from 'react'
import { DeviceEventEmitter } from 'react-native'
import TrackPlayer, { Event, State, useTrackPlayerEvents } from 'react-native-track-player'
import useAppStore from '@/controllers/store'

export const useTTSPlayer = (content: string, bookId: string, chapterIndex: number) => {
  const readingAIMode = useAppStore((s) => s.readingAIMode)
  const [isConverting, setIsConverting] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0)
  const [totalSentences, setTotalSentences] = useState(0)
  const [isReady, setIsReady] = useState(false)

  const isMounted = useRef(true)

  // Reset state when content changes
  useEffect(() => {
    stopConvertTTSCapcut()
    audioPlayerService.reset()
    setIsConverting(false)
    setIsPlaying(false)
    setCurrentSentenceIndex(0)
    setTotalSentences(0)
    setIsReady(false)
  }, [content, bookId, chapterIndex, readingAIMode])

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
      stopConvertTTSCapcut()
      audioPlayerService.reset()
    }
  }, [])

  useTrackPlayerEvents([Event.PlaybackState, Event.PlaybackActiveTrackChanged], async (event) => {
    if (event.type === Event.PlaybackState) {
      setIsPlaying(event.state === State.Playing)
    }
    if (event.type === Event.PlaybackActiveTrackChanged && event.index !== undefined) {
      setCurrentSentenceIndex(event.index)
    }
  })

  const startTTS = useCallback(async () => {
    if (!content) return

    try {
      setIsConverting(true)
      setIsReady(true)
      
      // 1. Preprocess content
      // Remove HTML tags first
      const textContent = content.replace(/<[^>]*>/g, '')
      const formattedContent = formatContentForTTS(textContent)
      
      // Split into sentences (using a simple split by newline for now as per requirement, 
      // but ideally should be smarter)
      const sentences = formattedContent
        .split(/[.!?\n]/)
        .map(s => s.trim())
        .filter(s => s.length > 0)

      setTotalSentences(sentences.length)
      
      // 2. Reset player
      await audioPlayerService.reset()

      // 3. Start conversion stream
      await convertTTSCapcut(
        sentences,
        `${bookId}_${chapterIndex}_${readingAIMode}`,
        undefined,
        undefined,
        async (filePath, index) => {
          if (!isMounted.current) return

          const track = {
            id: `${bookId}_${chapterIndex}_${readingAIMode}_${index}`,
            url: filePath,
            title: `Câu ${index + 1}`,
            artist: 'AI Reading',
          }

          await audioPlayerService.addTrackToQueue(track)
          
          // Auto play if it's the first track
          if (index === 0) {
            await audioPlayerService.play()
          }
        }
      )
    } catch (error) {
      console.error('Error starting TTS:', error)
      setIsReady(false)
    } finally {
      if (isMounted.current) {
        setIsConverting(false)
      }
    }
  }, [content, bookId, chapterIndex, readingAIMode])

  const stopTTS = useCallback(async () => {
    stopConvertTTSCapcut()
    await audioPlayerService.reset()
    setIsReady(false)
    setIsConverting(false)
  }, [])

  const togglePlayPause = useCallback(async () => {
    if (isPlaying) {
      await audioPlayerService.pause()
    } else {
      await audioPlayerService.play()
    }
  }, [isPlaying])

  const nextSentence = useCallback(async () => {
    await audioPlayerService.skipToNext()
  }, [])

  const previousSentence = useCallback(async () => {
    await audioPlayerService.skipToPrevious()
  }, [])

  return {
    isConverting,
    isPlaying,
    currentSentenceIndex,
    totalSentences,
    isReady,
    startTTS,
    stopTTS,
    togglePlayPause,
    nextSentence,
    previousSentence,
  }
}
