import AutoGenerateController from '@/components/AutoGenerateController'
import { router, useLocalSearchParams } from 'expo-router'
import React from 'react'

export default function GenerateSummaryTTS() {
  const { bookId } = useLocalSearchParams<{ bookId: string }>()

  return <AutoGenerateController bookId={bookId} onClose={router.back} />
}
