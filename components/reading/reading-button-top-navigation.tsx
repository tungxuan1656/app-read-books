import { AppColors, AppPalette } from '@/assets'
import useAppStore from '@/controllers/store'
import React, { useCallback, useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import { VectorIcon } from '../Icon'
import { getCurrentBookId } from '@/utils'
import { router } from 'expo-router'

export default function ReadingButtonTopNavigation({
  previousChapter,
  nextChapter,
}: {
  previousChapter: () => void
  nextChapter: () => void
}) {
  const currentBookId = useMemo(() => getCurrentBookId(), [])
  const readingMode = useAppStore((s) => s.readingMode)
  const cycleReadingMode = useAppStore((s) => s.cycleReadingMode)

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
