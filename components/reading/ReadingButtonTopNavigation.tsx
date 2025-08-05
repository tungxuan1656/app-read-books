import { AppPalette } from '@/assets'
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
  return (
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
  )
}

const styles = StyleSheet.create({
  viewNavigate: {
    flexDirection: 'row',
    height: 28,
    paddingHorizontal: 2,
    position: 'absolute',
    right: 10,
    top: 16,
    backgroundColor: AppPalette.gray400,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
