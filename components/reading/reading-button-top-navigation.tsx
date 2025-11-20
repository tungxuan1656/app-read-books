import { AppColors, AppPalette } from '@/assets'
import useAppStore from '@/controllers/store'
import React, { useCallback, useMemo, useState } from 'react'
import { StyleSheet, View, Alert } from 'react-native'
import { VectorIcon } from '../Icon'
import { getCurrentBookId } from '@/utils'
import { router } from 'expo-router'
import { ttsService } from '@/services/tts-service'

export default function ReadingButtonTopNavigation({
  previousChapter,
  nextChapter,
  bookId,
  chapter,
  content,
}: {
  previousChapter: () => void
  nextChapter: () => void
  bookId: string
  chapter: number
  content: string
}) {
  const currentBookId = useMemo(() => getCurrentBookId(), [])
  const readingMode = useAppStore((s) => s.readingMode)
  const cycleReadingMode = useAppStore((s) => s.cycleReadingMode)
  const [isTTSGenerating, setIsTTSGenerating] = useState(false)

  const handleGenerateTTS = useCallback(async () => {
    if (!content || !bookId || readingMode === 'normal') return

    try {
      setIsTTSGenerating(true)
      await ttsService.generateTTS(bookId, chapter, readingMode, content)
      Alert.alert('Thành công', 'Đã tạo audio TTS')
    } catch (error) {
      console.error('Error generating TTS:', error)
      const errorMessage = error instanceof Error ? error.message : 'Không thể tạo audio TTS'
      Alert.alert('Lỗi TTS', errorMessage)
    } finally {
      setIsTTSGenerating(false)
    }
  }, [bookId, chapter, content, readingMode])

  const handleViewReferences = useCallback(() => {
    if (!currentBookId) return

    router.navigate({ pathname: '/references', params: { bookId: currentBookId } })
  }, [currentBookId])

  const getModeButtonStyle = (mode: string) => ({
    width: 28,
    height: 28,
    borderRadius: 40,
    backgroundColor: readingMode === mode ? AppPalette.blue50 : 'white',
  })

  const getModeButtonColor = (mode: string) =>
    readingMode === mode ? AppColors.textActivate : AppPalette.gray500

  return (
    <View style={styles.viewContainer}>
      {/* TTS Button */}
      {readingMode !== 'normal' && !isTTSGenerating && (
        <VectorIcon
          name="volume-high"
          font="FontAwesome6"
          size={12}
          buttonStyle={{
            width: 28,
            height: 28,
            borderRadius: 40,
            backgroundColor: 'white',
          }}
          color={AppPalette.gray600}
          onPress={handleGenerateTTS}
        />
      )}
      {readingMode !== 'normal' && isTTSGenerating && (
        <VectorIcon
          name="spinner"
          font="FontAwesome6"
          size={12}
          buttonStyle={{
            width: 28,
            height: 28,
            borderRadius: 40,
            backgroundColor: 'white',
            opacity: 0.6,
          }}
          color={AppPalette.gray600}
        />
      )}

      {/* Translate Button */}
      <VectorIcon
        name="language"
        font="FontAwesome6"
        size={12}
        buttonStyle={getModeButtonStyle('translate')}
        color={getModeButtonColor('translate')}
        onPress={() => cycleReadingMode()}
      />

      {/* Summary Button */}
      <VectorIcon
        name="wand-magic-sparkles"
        font="FontAwesome6"
        size={12}
        buttonStyle={getModeButtonStyle('summary')}
        color={getModeButtonColor('summary')}
        onPress={() => cycleReadingMode()}
      />

      {/* Navigation */}
      <View style={styles.viewNavigate}>
        <VectorIcon
          name="arrow-left"
          font="FontAwesome6"
          size={14}
          buttonStyle={{ width: 28, height: 28 }}
          color={AppPalette.white}
          onPress={previousChapter}
        />
        <VectorIcon
          name="arrow-right"
          font="FontAwesome6"
          size={14}
          buttonStyle={{ width: 28, height: 28 }}
          color={AppPalette.white}
          onPress={nextChapter}
        />
      </View>

      {/* Menu Button */}
      <VectorIcon
        name="bars"
        font="FontAwesome6"
        size={14}
        buttonStyle={styles.menuButton}
        color={AppPalette.gray600}
        onPress={handleViewReferences}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  viewContainer: {
    flexDirection: 'row',
    height: 28,
    paddingHorizontal: 2,
    position: 'absolute',
    right: 10,
    top: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  viewNavigate: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppPalette.gray300,
    borderRadius: 40,
  },
  menuButton: {
    width: 28,
    height: 28,
    borderRadius: 40,
    backgroundColor: 'white',
  },
})
