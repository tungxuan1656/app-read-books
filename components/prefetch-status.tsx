import { AppTypo } from '@/constants'
import useAppStore from '@/controllers/store'
import React from 'react'
import { Text } from 'react-native'

export const PrefetchStatus = () => {
  const prefetchState = useAppStore((s) => s.prefetchState)

  if (!prefetchState.isRunning) return null

  return <Text style={[AppTypo.mini.regular, { color: '#888' }]}>{prefetchState.message}</Text>
}
