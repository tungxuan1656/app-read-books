import { AppColors, AppFontSize } from '@/assets'
import { StyleSheet } from 'react-native'

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
    bold: { ...textBase.h1, fontWeight: '700' },
    semiBold: { ...textBase.h1, fontWeight: '600' },
    medium: { ...textBase.h1, fontWeight: '500' },
    regular: { ...textBase.h1, fontWeight: '400' },
  },
  h2: {
    bold: { ...textBase.h2, fontWeight: '700' },
    semiBold: { ...textBase.h2, fontWeight: '600' },
    medium: { ...textBase.h2, fontWeight: '500' },
    regular: { ...textBase.h2, fontWeight: '400' },
  },
  h3: {
    bold: { ...textBase.h3, fontWeight: '700' },
    semiBold: { ...textBase.h3, fontWeight: '600' },
    medium: { ...textBase.h3, fontWeight: '500' },
    regular: { ...textBase.h3, fontWeight: '400' },
  },
  h4: {
    bold: { ...textBase.h4, fontWeight: '700' },
    semiBold: { ...textBase.h4, fontWeight: '600' },
    medium: { ...textBase.h4, fontWeight: '500' },
    regular: { ...textBase.h4, fontWeight: '400' },
  },
  headline: {
    bold: { ...textBase.headline, fontWeight: '700' },
    semiBold: { ...textBase.headline, fontWeight: '600' },
    medium: { ...textBase.headline, fontWeight: '500' },
    regular: { ...textBase.headline, fontWeight: '400' },
  },
  body: {
    bold: { ...textBase.body, fontWeight: '700' },
    semiBold: { ...textBase.body, fontWeight: '600' },
    medium: { ...textBase.body, fontWeight: '500' },
    regular: { ...textBase.body, fontWeight: '400' },
  },
  footnote: {
    bold: { ...textBase.footnote, fontWeight: '700' },
    semiBold: { ...textBase.footnote, fontWeight: '600' },
    medium: { ...textBase.footnote, fontWeight: '500' },
    regular: { ...textBase.footnote, fontWeight: '400' },
  },
  caption: {
    bold: { ...textBase.caption, fontWeight: '700' },
    semiBold: { ...textBase.caption, fontWeight: '600' },
    medium: { ...textBase.caption, fontWeight: '500' },
    regular: { ...textBase.caption, fontWeight: '400' },
  },
  mini: {
    bold: { ...textBase.mini, fontWeight: '700' },
    semiBold: { ...textBase.mini, fontWeight: '600' },
    medium: { ...textBase.mini, fontWeight: '500' },
    regular: { ...textBase.mini, fontWeight: '400' },
  },
}
