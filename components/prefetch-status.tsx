import React from 'react'
import { Text } from 'react-native'

import { usePrefetchStore } from '@/controllers/stores'

export const PrefetchStatus = () => {
  const prefetchState = usePrefetchStore.use.prefetchState()

  if (!prefetchState.isRunning) return null

  return (
    <Text className='text-xss font-normal text-gray-500'>
      {prefetchState.message}
    </Text>
  )
}
