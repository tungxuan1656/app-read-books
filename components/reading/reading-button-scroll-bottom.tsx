import React from 'react'
import { VectorIcon } from '../Icon'
import { StyleSheet } from 'react-native'
import { AppPalette } from '@/assets'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

function ReadingButtonScrollBottom({ onScrollToBottom }: { onScrollToBottom: () => void }) {
  const insets = useSafeAreaInsets()
  return (
    <VectorIcon
      name="circle-arrow-down"
      font="FontAwesome6"
      size={18}
      buttonStyle={{
        ...styles.buttonScrollToBottom,
        bottom: Math.max(10, insets.bottom) - 16,
      }}
      color={AppPalette.gray300}
      onPress={onScrollToBottom}
    />
  )
}

export default React.memo(ReadingButtonScrollBottom)

const styles = StyleSheet.create({
  buttonScrollToBottom: {
    alignSelf: 'center',
    borderRadius: 100,
    backgroundColor: 'transparent',
    right: 'auto',
    left: 'auto',
    width: 48,
    height: 48,
    position: 'absolute',
  },
})
