import React, { useLayoutEffect, useState } from 'react'
import { ActivityIndicator, Text, type TextStyle, View } from 'react-native'

export type GSpinnerTheme = {
  label?: TextStyle
}

type GSpinnerShowProps = {
  label?: string
  timeout?: number
}

type GSpinnerProps = {
  show: (props?: GSpinnerShowProps) => void
  hide: () => void
}

const GSpinnerRef = React.createRef<GSpinnerProps | null>()

export const GSpinnerComponent = ({ theme }: { theme?: GSpinnerTheme }) => {
  const [visible, setVisible] = useState(false)
  const [label, setLabel] = useState('')
  const refTimeout = React.useRef<number | undefined>(undefined)

  useLayoutEffect(() => {
    // @ts-ignore
    GSpinnerRef.current = {
      show: ({ label, timeout = 20 }: GSpinnerShowProps = {}) => {
        clearTimeout(refTimeout.current)
        setVisible(true)
        setLabel(label ?? '')
        refTimeout.current = setTimeout(() => {
          setVisible(false)
        }, timeout * 1000)
      },
      hide: () => setVisible(false),
    }
  }, [])

  return visible ? (
    <View
      className='absolute inset-0 items-center justify-center bg-transparent'
      style={{ gap: 16 }}>
      <ActivityIndicator color={'#222'} />
      {label ? (
        <Text
          className='mx-9 text-sm font-medium text-gray-700'
          style={[theme?.label]}
          numberOfLines={2}>
          {label}
        </Text>
      ) : null}
    </View>
  ) : null
}

export const GSpinner = {
  show: (props?: GSpinnerShowProps) => GSpinnerRef.current?.show?.(props),
  hide: () => GSpinnerRef.current?.hide?.(),
}
