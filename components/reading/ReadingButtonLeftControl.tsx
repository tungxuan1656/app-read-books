import React from 'react'
import { VectorIcon } from '../Icon'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { StyleSheet } from 'react-native'
import { AppPalette } from '@/assets'

function ReadingButtonLeftControl({ openBook }: { openBook: () => void }) {
  const insets = useSafeAreaInsets()
  return (
    <>
      <VectorIcon
        name="book"
        font="FontAwesome6"
        size={18}
        buttonStyle={{ ...styles.buttonInfo, bottom: 12 + insets.bottom }}
        color={AppPalette.gray600}
        onPress={openBook}
      />
      <VectorIcon
        name="wand-magic-sparkles"
        font="FontAwesome6"
        size={18}
        buttonStyle={{ ...styles.buttonInfo, bottom: 12 + 40 + 8 + insets.bottom }}
        color={AppPalette.red500}
        onPress={() => {}}
      />
    </>
  )
}

export default React.memo(ReadingButtonLeftControl)

const styles = StyleSheet.create({
  buttonInfo: {
    width: 40,
    height: 40,
    borderRadius: 40,
    backgroundColor: AppPalette.gray100,
    position: 'absolute',
    right: 12,
    bottom: 12,
  },
})
