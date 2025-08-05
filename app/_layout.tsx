import { GToastComponent } from '@/components/GToast'
import { MMKVKeys } from '@/constants'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { router, Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import TrackPlayer from 'react-native-track-player'
import { MMKVStorage } from '../controllers/mmkv'
import { initializeTTSCache } from '../controllers/tts-cache'
import trackPlayerService from '../services/track-player-service'

SplashScreen.preventAutoHideAsync()

try {
  initializeTTSCache()
  TrackPlayer.registerPlaybackService(() => require('../services/playback-service'))
  trackPlayerService.setupPlayer()
} catch (error) {
  console.error('Error during splash screen initialization:', error)
}

export default function RootLayout() {
  useEffect(() => {
    if (true) {
      const IS_READING = MMKVStorage.get(MMKVKeys.IS_READING)
      if (IS_READING) {
        setTimeout(() => {
          router.push('/reading')
        }, 100)
      }
    }
  }, [])

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="reading/index" options={{ gestureEnabled: false }} />
        </Stack>
        <GToastComponent />
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  )
}
