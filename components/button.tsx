import {
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Text,
  StyleProp,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from 'react-native'
import React from 'react'
import { AppColors } from '@/assets'
import { AppTypo } from '@/constants'
import { Image, ImageSource, ImageStyle } from 'expo-image'

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
  titleStyle?: StyleProp<TextStyle>
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
  titleStyle,
  ...props
}: ButtonProps) => {
  return (
    <TouchableOpacity
      disabled={disabled || isLoading}
      style={[styles.button, theme?.button, style]}
      {...props}>
      {isLoading ? (
        <ActivityIndicator color={colorLoading ? colorLoading : AppColors.bgMain} />
      ) : (
        <>
          {iconLeft ? (
            <Image
              style={[styles.iconLeft, theme?.iconLeft]}
              // @ts-ignore
              tintColor={theme?.iconLeft?.tintColor ?? styles.iconLeft.tintColor}
              source={iconLeft}
            />
          ) : null}
          <Text style={[styles.title, theme?.title, titleStyle]}>{title}</Text>
          {iconRight ? (
            <Image
              style={[styles.iconRight, theme?.iconRight]}
              // @ts-ignore
              tintColor={theme?.iconRight?.tintColor ?? styles.iconRight.tintColor}
              source={iconRight}
            />
          ) : null}
        </>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    height: 44,
    alignItems: 'center',
    borderRadius: 18,
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: AppColors.buttonFocus,
  },
  title: { ...AppTypo.headline.semiBold, color: AppColors.white },
  iconRight: {
    resizeMode: 'contain',
    width: 24,
    height: 24,
    tintColor: undefined,
  },
  iconLeft: {
    resizeMode: 'contain',
    width: 24,
    height: 24,
    tintColor: undefined,
  },
})
