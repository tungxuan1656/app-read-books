import { useFonts } from 'expo-font'
import { router, Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect, useState } from 'react'
import { defaultOptions, ReadingContext, BooksContext } from '../controllers/context'
import { DeviceEventEmitter } from 'react-native'
import { MMKVStorage } from '../controllers/mmkv'
import { GToastComponent } from '@/components/GToast'
import { EventKeys, MMKVKeys } from '@/constants'
import TrackPlayer from 'react-native-track-player'
import { PlaybackService } from '@/services/track-player-playback-service'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

TrackPlayer.registerPlaybackService(() => PlaybackService)

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
    const IS_READING = MMKVStorage.get(MMKVKeys.IS_READING)
    if (IS_READING) router.navigate('/reading')
  }, [])

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync()
    }
    TrackPlayer.setupPlayer({
      maxCacheSize: 1024 * 100,
    })
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
