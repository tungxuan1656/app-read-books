import React from 'react'
import { Switch, Text, View } from 'react-native'
import NetworkLogger from 'react-native-network-logger'

import { AppColors } from '@/assets'
import { Divider } from '@/components/divider'
import { Screen } from '@/components/screen'
import { settingsActions, useSettingsStore } from '@/controllers/stores'

export default function NetworkLoggerScreen() {
  const networkLoggerEnabled = useSettingsStore.use.networkLoggerEnabled()

  return (
    <Screen.Container>
      <Screen.Header title='Network Logger' />
      <Divider />
      <Screen.Content>
        <View className='flex-row items-center justify-between border-b border-gray-200 px-4 py-3'>
          <View className='flex-1 pr-4'>
            <Text className='text-base font-semibold text-gray-900'>
              Bật theo dõi network
            </Text>
            <Text className='mt-1 text-sm text-gray-500'>
              Ghi lại request/response để debug trong app
            </Text>
          </View>
          <Switch
            value={networkLoggerEnabled}
            onValueChange={settingsActions.setNetworkLoggerEnabled}
            trackColor={{
              false: AppColors.gray300,
              true: AppColors.green500,
            }}
            thumbColor={AppColors.white}
          />
        </View>
        <View className='flex-1 bg-white'>
          <NetworkLogger />
        </View>
      </Screen.Content>
    </Screen.Container>
  )
}
