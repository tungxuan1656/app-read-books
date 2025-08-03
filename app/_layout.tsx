import { useFonts } from 'expo-font'
import { router, Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect, useState } from 'react'
import { defaultOptions, ReadingContext, BooksContext } from '../controllers/context'
import { DeviceEventEmitter } from 'react-native'
import { MMKVStorage } from '../controllers/mmkv'
import { GToastComponent } from '@/components/GToast'
import { EventKeys, MMKVKeys } from '@/constants'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { initializeTTSCache } from '../controllers/tts-cache'
import TrackPlayerService from '../services/track-player-service'
import TrackPlayer from 'react-native-track-player'

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const [readingValue, setReadingValue] = useState<Options>(defaultOptions)
  const [books, setBooks] = useState<Book[]>([])

  const [loaded] = useFonts({})

  useEffect(() => {
    const t = DeviceEventEmitter.addListener(EventKeys.SET_READING_CONTEXT, (data) => {
      setReadingValue((prev) => ({ ...prev, ...data }))
      MMKVStorage.set(MMKVKeys.READING_OPTION, data)
    })
    return () => t.remove()
  }, [])

  useEffect(() => {
    const t = DeviceEventEmitter.addListener(EventKeys.SET_BOOKS_CONTEXT, (data) => {
      setBooks(data)
    })
    return () => t.remove()
  }, [])

  useEffect(() => {
    const output: Options = MMKVStorage.get(MMKVKeys.READING_OPTION)
    if (output?.currentBook && output?.books) {
      setReadingValue(output)
    }

    // Initialize TTS cache on app start
    initializeTTSCache()

    // Initialize TrackPlayer and register service on app start
    const initTrackPlayer = async () => {
      try {
        // Register playback service
        TrackPlayer.registerPlaybackService(() => require('../services/playback-service'))
        console.log('🎵 [App] TrackPlayer service registered')
        
        const trackPlayerService = TrackPlayerService.getInstance()
        await trackPlayerService.setupPlayer()
        console.log('🎵 [App] TrackPlayer initialized successfully')
      } catch (error) {
        console.error('🎵 [App] Failed to initialize TrackPlayer:', error)
      }
    }
    initTrackPlayer()
  }, [])

  // Separate effect for navigation that runs after fonts are loaded
  useEffect(() => {
    if (loaded) {
      const IS_READING = MMKVStorage.get(MMKVKeys.IS_READING)
      if (IS_READING) {
        // Use setTimeout to ensure navigation happens after the Stack is mounted
        setTimeout(() => {
          router.navigate('/reading')
        }, 100)
      }
    }
  }, [loaded])

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync()
    }
  }, [loaded])

  if (!loaded) {
    return null
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BooksContext.Provider value={books}>
        <ReadingContext.Provider value={readingValue}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
          </Stack>
          <GToastComponent />
        </ReadingContext.Provider>
      </BooksContext.Provider>
    </GestureHandlerRootView>
  )
}
