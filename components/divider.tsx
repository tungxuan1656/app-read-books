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
  ({ color, width = 1, style, className, direction = 'vertical' }) => {
    return (
      <View
        className={`${direction === 'vertical' ? 'h-px bg-slate-200' : 'w-px bg-slate-200'} ${className ?? ''}`}
        style={[
          direction === 'vertical' ? { height: width } : { width: width },
          color ? { backgroundColor: color } : undefined,
          style,
        ]}
      />
    )
  },
)
