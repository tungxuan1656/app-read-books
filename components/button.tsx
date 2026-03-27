import React from 'react'
import {
  ActivityIndicator,
  type StyleProp,
  Text,
  type TextStyle,
  TouchableOpacity,
  type TouchableOpacityProps,
  type ViewStyle,
} from 'react-native'

import { cn } from '@/utils'

import { Image, type ImageSource, type ImageStyle } from './image'

export type ButtonTheme = {
  button?: StyleProp<ViewStyle>
  title?: StyleProp<TextStyle>
  iconLeft?: ImageStyle
  iconRight?: ImageStyle
}

type ButtonProps = {
  title?: string | null
  theme?: ButtonTheme
  style?: StyleProp<ViewStyle>
  className?: string
  titleStyle?: StyleProp<TextStyle>
  titleClassName?: string
  isLoading?: boolean
  disabled?: boolean
  iconLeft?: ImageSource | undefined
  iconRight?: ImageSource | undefined
  colorLoading?: string
} & TouchableOpacityProps

export const Button = ({
  title,
  theme,
  isLoading,
  disabled,
  iconLeft,
  iconRight,
  colorLoading,
  style,
  className,
  titleStyle,
  titleClassName,
  ...props
}: ButtonProps) => {
  return (
    <TouchableOpacity
      disabled={disabled || isLoading}
      className={cn(
        'h-10 flex-row items-center justify-around rounded-2xl bg-blue-500',
        className,
      )}
      style={[theme?.button, style]}
      {...props}>
      {isLoading ? (
        <ActivityIndicator color={colorLoading ? colorLoading : '#ffffff'} />
      ) : (
        <>
          {iconLeft ? (
            <Image
              className='size-6'
              style={[theme?.iconLeft]}
              // @ts-ignore
              tintColor={theme?.iconLeft?.tintColor}
              source={iconLeft}
            />
          ) : null}
          <Text
            className={cn('text-base font-semibold text-white', titleClassName)}
            style={[theme?.title, titleStyle]}>
            {title}
          </Text>
          {iconRight ? (
            <Image
              className='size-6'
              style={[theme?.iconRight]}
              // @ts-ignore
              tintColor={theme?.iconRight?.tintColor}
              source={iconRight}
            />
          ) : null}
        </>
      )}
    </TouchableOpacity>
  )
}
