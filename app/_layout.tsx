import { useFonts } from 'expo-font'
import { router, Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect, useState } from 'react'
import { defaultOptions, ReadingContext } from '../controllers/context'
import { DeviceEventEmitter } from 'react-native'
import { MMKVStorage } from '../controllers/mmkv'
import { GToastComponent } from '@/components/GToast'
import { MMKVKeys } from '@/constants'

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const [readingValue, setReadingValue] = useState<Options>(defaultOptions)

  const [loaded] = useFonts({})

  useEffect(() => {
    const t = DeviceEventEmitter.addListener('setReadingValue', (data) => {
      setReadingValue((prev) => ({ ...prev, ...data }))
      MMKVStorage.set(MMKVKeys.READING_OPTION, data)
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
