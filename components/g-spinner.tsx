import { AppTypo } from '@/constants'
import React, { useLayoutEffect, useState } from 'react'
import { ActivityIndicator, StyleSheet, Text, TextStyle, View } from 'react-native'

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
    <View style={styles.container}>
      <ActivityIndicator color={'#222'} />
      {label ? (
        <Text
          style={[AppTypo.body.medium, { color: '#444', marginHorizontal: 36 }, theme?.label]}
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

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
})
