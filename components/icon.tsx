import { Image, type ImageProps, type ImageSource } from 'expo-image'
import React from 'react'
import {
  type ImageRequireSource,
  type ImageStyle,
  type StyleProp,
  TouchableOpacity,
  type ViewStyle,
} from 'react-native'

export type IconSource = ImageRequireSource | ImageSource

type IconProps = {
  source?: IconSource
  size?: number
  color?: string
  style?: ImageStyle
  onPress?: () => void
  buttonStyle?: StyleProp<ViewStyle>
} & ImageProps

export const Icon = ({
  source,
  size = 24,
  color,
  style,
  onPress,
  buttonStyle,
  ...props
}: IconProps) => {
  return onPress ? (
    <TouchableOpacity
      onPress={onPress}
      style={[{ justifyContent: 'center', alignItems: 'center' }, buttonStyle]}>
      <Image
        style={[{ width: size, height: size }, style]}
        source={source}
        tintColor={color}
        contentFit={'contain'}
        {...props}
      />
    </TouchableOpacity>
  ) : (
    <Image
      style={[{ width: size, height: size }, style]}
      source={source}
      tintColor={color}
      contentFit={'contain'}
      {...props}
    />
  )
}
