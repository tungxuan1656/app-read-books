import React from 'react'
import {
  type ImageRequireSource,
  type ImageStyle,
  type StyleProp,
  TouchableOpacity,
  type ViewStyle,
} from 'react-native'

import { Image, type ImageProps, type ImageSource } from './image'

export type IconSource = ImageRequireSource | ImageSource

type IconProps = {
  source?: IconSource
  size?: number
  color?: string
  style?: ImageStyle
  className?: string
  onPress?: () => void
  buttonStyle?: StyleProp<ViewStyle>
  buttonClassName?: string
} & ImageProps

export const Icon = ({
  source,
  size = 24,
  color,
  style,
  className,
  onPress,
  buttonStyle,
  buttonClassName,
  ...props
}: IconProps) => {
  return onPress ? (
    <TouchableOpacity
      onPress={onPress}
      className={`items-center justify-center ${buttonClassName ?? ''}`}
      style={[buttonStyle]}>
      <Image
        className={className}
        style={[{ width: size, height: size }, style]}
        source={source}
        tintColor={color}
        contentFit={'contain'}
        {...props}
      />
    </TouchableOpacity>
  ) : (
    <Image
      className={className}
      style={[{ width: size, height: size }, style]}
      source={source}
      tintColor={color}
      contentFit={'contain'}
      {...props}
    />
  )
}
