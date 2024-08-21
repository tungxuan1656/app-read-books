import { useFonts } from 'expo-font'
import { router, Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect, useState } from 'react'
import { defaultOptions, ReadingContext } from '../controllers/context'
import { DeviceEventEmitter } from 'react-native'
import { MMKVStorage } from '../controllers/mmkv'
import { GToastComponent } from '@/components/GToast'

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const [readingValue, setReadingValue] = useState<Options>(defaultOptions)

  const [loaded] = useFonts({})

  useEffect(() => {
    const t = DeviceEventEmitter.addListener('setReadingValue', (data) => {
      console.log(data)
      setReadingValue((prev) => ({...prev, ...data}))
      MMKVStorage.set('app-reading', data)
    })
    return () => t.remove()
  }, [])

  useEffect(() => {
    const output: Options = MMKVStorage.get('app-reading').value
    if (output?.font && output?.size) {
      setReadingValue(output)
      if (output.isReading) router.navigate('/reading')
    }
  }, [])

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync()
    }
  }, [loaded])

  if (!loaded) {
    return null
  }

  return (
    <ReadingContext.Provider value={readingValue}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
      </Stack>
      <GToastComponent />
    </ReadingContext.Provider>
  )
}
