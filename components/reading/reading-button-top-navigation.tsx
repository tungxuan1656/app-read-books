import { AppPalette } from '@/assets'
import React, { useCallback } from 'react'
import { StyleSheet, View } from 'react-native'
import { VectorIcon } from '../Icon'
import { router } from 'expo-router'

export default function ReadingButtonTopNavigation({
  previousChapter,
  nextChapter,
}: {
  previousChapter: () => void
  nextChapter: () => void
}) {
  const handleViewReferences = useCallback(() => {
    router.navigate({ pathname: '/references' })
  }, [])

  return (
    <View style={styles.viewContainer}>
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
