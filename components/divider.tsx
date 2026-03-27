import React from 'react'
import { View, type ViewStyle } from 'react-native'

type Props = {
  style?: ViewStyle
  className?: string
  color?: string
  width?: number
  direction?: 'vertical' | 'horizontal'
}

export const Divider: React.FC<Props> = React.memo(
  ({
    color = '#e2e8f0',
    width = 1,
    style,
    className,
    direction = 'vertical',
  }) => {
    return (
      <View
        className={className}
        style={[
          { backgroundColor: color },
          direction === 'vertical' ? { height: width } : { width: width },
          style,
        ]}
      />
    )
  },
)
