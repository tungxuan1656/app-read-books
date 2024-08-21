import React from 'react'
import { View, ViewStyle } from 'react-native'
import { AppColors } from '@/assets'

type Props = {
  style?: ViewStyle
  color?: string
  width?: number
  direction?: 'vertical' | 'horizontal'
}

export const Divider: React.FC<Props> = React.memo(
  ({ color = AppColors.strokeMain, width = 1, style, direction = 'vertical' }) => {
    return (
      <View
        style={[
          { backgroundColor: color },
          direction === 'vertical' ? { height: width } : { width: width },
          style,
        ]}
      />
    )
  },
)
