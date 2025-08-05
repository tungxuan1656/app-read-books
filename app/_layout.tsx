import { useFonts } from 'expo-font'
import { router, Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect } from 'react'
import { MMKVStorage } from '../controllers/mmkv'
import { GToastComponent } from '@/components/GToast'
import { MMKVKeys } from '@/constants'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { initializeTTSCache } from '../controllers/tts-cache'
import trackPlayerService from '../services/track-player-service'
import TrackPlayer from 'react-native-track-player'

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync()
try {
  initializeTTSCache()
  TrackPlayer.registerPlaybackService(() => require('../services/playback-service'))
  trackPlayerService.setupPlayer()
} catch (error) {
  console.error('Error during splash screen initialization:', error)
}

export default function RootLayout() {
  const [loaded] = useFonts({})

  // Zustand persistence automatically loads the state, no manual loading needed

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
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
      </Stack>
      <GToastComponent />
    </GestureHandlerRootView>
  )
}
