import React from 'react'
import { Text } from 'react-native'

import useAppStore from '@/controllers/store'

export const PrefetchStatus = () => {
  const prefetchState = useAppStore((s) => s.prefetchState)

  if (!prefetchState.isRunning) return null

  return (
    <Text className='text-xss font-normal text-gray-500'>
      {prefetchState.message}
    </Text>
  )
}
