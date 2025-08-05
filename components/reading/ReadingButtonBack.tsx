import React from 'react'
import { VectorIcon } from '../Icon'
import { AppPalette } from '@/assets'
import { router } from 'expo-router'
import { StyleSheet } from 'react-native'

function ReadingButtonBack() {
  return (
    <VectorIcon
      name="circle-chevron-left"
      font="FontAwesome6"
      size={22}
      buttonStyle={{ ...styles.buttonBack }}
      color={AppPalette.gray400}
      onPress={router.back}
    />
  )
}

export default React.memo(ReadingButtonBack)

const styles = StyleSheet.create({
  buttonBack: {
    width: 44,
    height: 44,
    borderRadius: 40,
    position: 'absolute',
    left: 10,
    top: 12,
  },
})
