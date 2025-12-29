import { AppColors, AppFontSize } from '@/assets'
import { StyleSheet, TextStyle } from 'react-native'

type FontWeightType = TextStyle['fontWeight']

const textBase = StyleSheet.create({
  title: {
    fontWeight: '700',
    fontSize: 48,
    // lineHeight: 56,
    color: AppColors.textMain,
  },
  h1: {
    fontSize: AppFontSize.xxxx_large,
    // lineHeight: 40,
    color: AppColors.textMain,
  },
  h2: {
    fontSize: AppFontSize.xxx_large,
    // lineHeight: 32,
    color: AppColors.textMain,
  },
  h3: {
    fontSize: AppFontSize.xx_large,
    // lineHeight: 28,
    color: AppColors.textMain,
  },
  h4: {
    fontSize: AppFontSize.x_large,
    // lineHeight: 26,
    color: AppColors.textMain,
  },
  headline: {
    fontSize: AppFontSize.large,
    // lineHeight: 24,
    color: AppColors.textMain,
  },
  body: {
    fontSize: AppFontSize.medium,
    // lineHeight: 20,
    color: AppColors.textMain,
  },
  footnote: {
    fontSize: AppFontSize.x_medium,
    // lineHeight: 18,
    color: AppColors.textMain,
  },
  caption: {
    fontSize: AppFontSize.small,
    // lineHeight: 18,
    color: AppColors.textMain,
  },
  mini: {
    fontSize: AppFontSize.x_small,
    // lineHeight: 16,
    color: AppColors.textMain,
  },
})

export const AppTypo = {
  title: textBase.title,
  h1: {
    bold: { ...textBase.h1, fontWeight: '700' as FontWeightType },
    semiBold: { ...textBase.h1, fontWeight: '600' as FontWeightType },
    medium: { ...textBase.h1, fontWeight: '500' as FontWeightType },
    regular: { ...textBase.h1, fontWeight: '400' as FontWeightType },
  },
  h2: {
    bold: { ...textBase.h2, fontWeight: '700' as FontWeightType },
    semiBold: { ...textBase.h2, fontWeight: '600' as FontWeightType },
    medium: { ...textBase.h2, fontWeight: '500' as FontWeightType },
    regular: { ...textBase.h2, fontWeight: '400' as FontWeightType },
  },
  h3: {
    bold: { ...textBase.h3, fontWeight: '700' as FontWeightType },
    semiBold: { ...textBase.h3, fontWeight: '600' as FontWeightType },
    medium: { ...textBase.h3, fontWeight: '500' as FontWeightType },
    regular: { ...textBase.h3, fontWeight: '400' as FontWeightType },
  },
  h4: {
    bold: { ...textBase.h4, fontWeight: '700' as FontWeightType },
    semiBold: { ...textBase.h4, fontWeight: '600' as FontWeightType },
    medium: { ...textBase.h4, fontWeight: '500' as FontWeightType },
    regular: { ...textBase.h4, fontWeight: '400' as FontWeightType },
  },
  headline: {
    bold: { ...textBase.headline, fontWeight: '700' as FontWeightType },
    semiBold: { ...textBase.headline, fontWeight: '600' as FontWeightType },
    medium: { ...textBase.headline, fontWeight: '500' as FontWeightType },
    regular: { ...textBase.headline, fontWeight: '400' as FontWeightType },
  },
  body: {
    bold: { ...textBase.body, fontWeight: '700' as FontWeightType },
    semiBold: { ...textBase.body, fontWeight: '600' as FontWeightType },
    medium: { ...textBase.body, fontWeight: '500' as FontWeightType },
    regular: { ...textBase.body, fontWeight: '400' as FontWeightType },
  },
  footnote: {
    bold: { ...textBase.footnote, fontWeight: '700' as FontWeightType },
    semiBold: { ...textBase.footnote, fontWeight: '600' as FontWeightType },
    medium: { ...textBase.footnote, fontWeight: '500' as FontWeightType },
    regular: { ...textBase.footnote, fontWeight: '400' as FontWeightType },
  },
  caption: {
    bold: { ...textBase.caption, fontWeight: '700' as FontWeightType },
    semiBold: { ...textBase.caption, fontWeight: '600' as FontWeightType },
    medium: { ...textBase.caption, fontWeight: '500' as FontWeightType },
    regular: { ...textBase.caption, fontWeight: '400' as FontWeightType },
  },
  mini: {
    bold: { ...textBase.mini, fontWeight: '700' as FontWeightType },
    semiBold: { ...textBase.mini, fontWeight: '600' as FontWeightType },
    medium: { ...textBase.mini, fontWeight: '500' as FontWeightType },
    regular: { ...textBase.mini, fontWeight: '400' as FontWeightType },
  },
}
