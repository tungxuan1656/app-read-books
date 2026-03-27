import '../global.css'

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { router, Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

import { ErrorBoundary } from '@/components/error-boundary'
import { GSpinnerComponent } from '@/components/g-spinner'
import { GToastComponent } from '@/components/g-toast'
import useAppStore from '@/controllers/store'
import { stringifyParams } from '@/hooks/use-typed-local-search-params'

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  useEffect(() => {
    const onScreenReading = useAppStore.getState().reading.onScreen
    if (onScreenReading) {
      setTimeout(() => {
        router.push({
          pathname: '/reading',
          params: stringifyParams({
            bookId: useAppStore.getState().reading.bookId,
          }),
        })
        SplashScreen.hideAsync()
      }, 100)
    } else {
      SplashScreen.hideAsync()
    }
  }, [])

  return (
    <ErrorBoundary catchErrors='always'>
      <GestureHandlerRootView className='flex-1'>
        <BottomSheetModalProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen
              name='reading/index'
              options={{ gestureEnabled: false }}
            />
          </Stack>
          <GToastComponent />
          <GSpinnerComponent />
        </BottomSheetModalProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  )
}
