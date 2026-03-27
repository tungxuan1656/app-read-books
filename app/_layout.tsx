import '../global.css'

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { useFonts } from 'expo-font'
import { router, Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

import { ErrorBoundary } from '@/components/error-boundary'
import { GSpinnerComponent } from '@/components/g-spinner'
import { GToastComponent } from '@/components/g-toast'
import { NetworkLoggerBubble } from '@/components/network-logger'
import { APP_FONT_SOURCES } from '@/constants'
import { useReadingStore } from '@/controllers/stores'
import { stringifyParams } from '@/hooks/use-typed-local-search-params'

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const [fontsLoaded, fontLoadError] = useFonts(APP_FONT_SOURCES)

  useEffect(() => {
    if (!fontsLoaded && !fontLoadError) {
      return
    }

    const onScreenReading = useReadingStore.getState().reading.onScreen
    if (onScreenReading) {
      setTimeout(() => {
        router.push({
          pathname: '/reading',
          params: stringifyParams({
            bookId: useReadingStore.getState().reading.bookId,
          }),
        })
        SplashScreen.hideAsync()
      }, 100)
    } else {
      SplashScreen.hideAsync()
    }
  }, [fontsLoaded, fontLoadError])

  if (!fontsLoaded && !fontLoadError) {
    return null
  }

  return (
    <ErrorBoundary catchErrors='always'>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <BottomSheetModalProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen
              name='reading/index'
              options={{ gestureEnabled: false }}
            />
          </Stack>
          <GToastComponent />
          <GSpinnerComponent />
          <NetworkLoggerBubble />
        </BottomSheetModalProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  )
}
