import React, { useEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import PlayAudioControl from '../play-audio-control'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import useTtsAudio from '@/hooks/use-tts-audio'
import useAppStore from '@/controllers/store'
import type { ReadingMode } from '@/controllers/store'

export default function ReadingAudioControl({
  chapter,
  bookId,
  content,
  mode,
}: {
  chapter: number
  bookId: string
  content: string
  mode?: ReadingMode
}) {
  const insets = useSafeAreaInsets()
  const readingMode = useAppStore((s) => s.readingMode)
  const currentMode = mode || readingMode

  const { startGenerateAudio, stopGenerateAudio } = useTtsAudio()

  useEffect(() => {
    startGenerateAudio(content, bookId, chapter, currentMode)
    return () => {
      stopGenerateAudio()
    }
  }, [chapter, bookId, content, currentMode, startGenerateAudio, stopGenerateAudio])

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
