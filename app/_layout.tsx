import { GToastComponent } from '@/components/g-toast'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { router, Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import useAppStore from '@/controllers/store'
import { audioPlayerService } from '../services/audio-player.service'
import { stringifyParams } from '@/hooks/use-typed-local-search-params'
import { GSpinnerComponent } from '@/components/g-spinner'
import { cleanupTTSOnAppStart } from '@/hooks/use-tts'
import { ErrorBoundary } from '@/components/error-boundary'
import { clearTTSFolder } from '@/services/tts.service'

SplashScreen.preventAutoHideAsync()

try {
  // Cleanup TTS temp folder on app start
  cleanupTTSOnAppStart()
  clearTTSFolder()
  audioPlayerService.setupPlayer()
} catch (error) {
  console.error('Error during splash screen initialization:', error)
}

export default function RootLayout() {
  useEffect(() => {
    const onScreenReading = useAppStore.getState().reading.onScreen
    if (onScreenReading) {
      setTimeout(() => {
        router.push({
          pathname: '/reading',
          params: stringifyParams({ bookId: useAppStore.getState().reading.bookId }),
        })
        SplashScreen.hideAsync()
      }, 100)
    } else {
      SplashScreen.hideAsync()
    }
  }, [])

  return (
    <ErrorBoundary catchErrors="always">
      <GestureHandlerRootView style={{ flex: 1 }}>
        <BottomSheetModalProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="reading/index" options={{ gestureEnabled: false }} />
          </Stack>
          <GToastComponent />
          <GSpinnerComponent />
        </BottomSheetModalProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  )
}
