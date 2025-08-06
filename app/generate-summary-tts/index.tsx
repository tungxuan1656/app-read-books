import AutoGenerateController from '@/components/auto-generate-controller'
import { Screen } from '@/components/Screen'
import { router, useLocalSearchParams } from 'expo-router'
import React from 'react'

export default function GenerateSummaryTTS() {
  const { bookId } = useLocalSearchParams<{ bookId: string }>()

  return (
    <Screen.Container safe="top">
      <AutoGenerateController bookId={bookId} onClose={router.back} />
    </Screen.Container>
  )
}
