import React from 'react'
import { AppPalette } from '@/assets'
import { router } from 'expo-router'
import { StyleSheet } from 'react-native'
import { VectorIcon } from '../vector-icon'

function ReadingButtonBack() {
  return (
    <VectorIcon
      name="circle-chevron-left"
      font="FontAwesome6"
      size={22}
      buttonStyle={{ ...styles.buttonBack }}
      color={AppPalette.gray300}
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
    left: 4,
    top: 12,
  },
})
