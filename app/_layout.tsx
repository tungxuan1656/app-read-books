import { GToastComponent } from '@/components/g-toast'
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
import { stringifyParams } from '@/hooks/use-typed-local-search-params'
import { getCurrentBookId } from '@/utils'
import { GSpinnerComponent } from '@/components/g-spinner'
import { migrateToNewSystem } from '@/utils/migration-helper'

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
    // Run migration once
    const runMigration = async () => {
      const migrated = MMKVStorage.get('MIGRATION_V2_DONE')
      if (!migrated) {
        console.log('🔄 Running one-time migration...')
        await migrateToNewSystem()
        MMKVStorage.set('MIGRATION_V2_DONE', true)
      }
    }
    runMigration()

    const IS_READING = MMKVStorage.get(MMKVKeys.IS_READING)
    if (IS_READING) {
      setTimeout(() => {
        router.push({
          pathname: '/reading',
          params: stringifyParams({ bookId: getCurrentBookId() }),
        })
        SplashScreen.hideAsync()
      }, 100)
    } else {
      SplashScreen.hideAsync()
    }
  }, [])

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="reading/index" options={{ gestureEnabled: false }} />
        </Stack>
        <GToastComponent />
        <GSpinnerComponent />
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  )
}
