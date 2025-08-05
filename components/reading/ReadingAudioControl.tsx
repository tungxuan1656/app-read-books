import React, { useEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import PlayAudioControl from '../PlayAudioControl'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import useTtsAudio from '@/hooks/use-tts-audio'

export default function ReadingAudioControl({
  chapter,
  bookId,
  content,
}: {
  chapter: number
  bookId: string
  content: string
}) {
  const insets = useSafeAreaInsets()

  const { startGenerateAudio, stopGenerateAudio } = useTtsAudio()

  useEffect(() => {
    startGenerateAudio(content, bookId, chapter)
    return () => {
      stopGenerateAudio()
    }
  }, [chapter, bookId, content, startGenerateAudio, stopGenerateAudio])

  return (
    <View style={[styles.viewContainer, { bottom: 12 + insets.bottom }]}>
      <PlayAudioControl />
    </View>
  )
}

const styles = StyleSheet.create({
  viewContainer: {
    flexDirection: 'row',
    paddingHorizontal: 2,
    position: 'absolute',
    left: 12,
    alignSelf: 'center',
    marginRight: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
})
