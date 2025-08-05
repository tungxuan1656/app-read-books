import { AppColors, AppPalette } from '@/assets'
import useAppStore from '@/controllers/store'
import React from 'react'
import { StyleSheet, View } from 'react-native'
import { VectorIcon } from '../Icon'

export default function ReadingButtonTopNavigation({
  previousChapter,
  nextChapter,
}: {
  previousChapter: () => void
  nextChapter: () => void
}) {
  const isSummaryMode = useAppStore((s) => s.isSummaryMode)
  const setIsSummaryMode = useAppStore((s) => s.setIsSummaryMode)

  return (
    <View style={styles.viewContainer}>
      <VectorIcon
        name="wand-magic-sparkles"
        font="FontAwesome6"
        size={12}
        buttonStyle={{
          width: 28,
          height: 28,
          borderRadius: 40,
          backgroundColor: isSummaryMode ? AppPalette.green50 : 'white',
        }}
        color={isSummaryMode ? AppColors.textActivate : AppPalette.gray500}
        onPress={() => setIsSummaryMode(!isSummaryMode)}
      />
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
    backgroundColor: AppPalette.gray400,
    borderRadius: 40,
  },
})
