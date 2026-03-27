import { router } from 'expo-router'
import React, { useEffect } from 'react'
import { TouchableOpacity } from 'react-native'
import {
  startNetworkLogging,
  stopNetworkLogging,
} from 'react-native-network-logger'

import { AppColors } from '@/assets'
import { useSettingsStore } from '@/controllers/stores'

import { VectorIcon } from '../vector-icon'

export const NetworkLoggerBubble = () => {
  const networkLoggerEnabled = useSettingsStore.use.networkLoggerEnabled()

  useEffect(() => {
    if (networkLoggerEnabled) {
      startNetworkLogging({ forceEnable: true })
      return
    }

    stopNetworkLogging()
  }, [networkLoggerEnabled])

  if (!networkLoggerEnabled) {
    return null
  }

  return (
    <TouchableOpacity
      className='absolute bottom-28 right-3 z-50 size-10 items-center justify-center rounded-full bg-red-500 shadow-md'
      activeOpacity={0.8}
      onPress={() => router.push('/settings/network-logger')}>
      <VectorIcon
        name='bug'
        font='MaterialCommunityIcons'
        size={22}
        color={AppColors.white}
      />
    </TouchableOpacity>
  )
}
