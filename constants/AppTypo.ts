import { AppColors, AppFont, AppFontSize } from '@/assets'
import { StyleSheet } from 'react-native'

const textBase = StyleSheet.create({
  title: {
    fontFamily: AppFont.bold,
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
    bold: { ...textBase.h1, fontFamily: AppFont.bold },
    semiBold: { ...textBase.h1, fontFamily: AppFont.semiBold },
    medium: { ...textBase.h1, fontFamily: AppFont.medium },
    regular: { ...textBase.h1, fontFamily: AppFont.regular },
  },
  h2: {
    bold: { ...textBase.h2, fontFamily: AppFont.bold },
    semiBold: { ...textBase.h2, fontFamily: AppFont.semiBold },
    medium: { ...textBase.h2, fontFamily: AppFont.medium },
    regular: { ...textBase.h2, fontFamily: AppFont.regular },
  },
  h3: {
    bold: { ...textBase.h3, fontFamily: AppFont.bold },
    semiBold: { ...textBase.h3, fontFamily: AppFont.semiBold },
    medium: { ...textBase.h3, fontFamily: AppFont.medium },
    regular: { ...textBase.h3, fontFamily: AppFont.regular },
  },
  h4: {
    bold: { ...textBase.h4, fontFamily: AppFont.bold },
    semiBold: { ...textBase.h4, fontFamily: AppFont.semiBold },
    medium: { ...textBase.h4, fontFamily: AppFont.medium },
    regular: { ...textBase.h4, fontFamily: AppFont.regular },
  },
  headline: {
    bold: { ...textBase.headline, fontFamily: AppFont.bold },
    semiBold: { ...textBase.headline, fontFamily: AppFont.semiBold },
    medium: { ...textBase.headline, fontFamily: AppFont.medium },
    regular: { ...textBase.headline, fontFamily: AppFont.regular },
  },
  body: {
    bold: { ...textBase.body, fontFamily: AppFont.bold },
    semiBold: { ...textBase.body, fontFamily: AppFont.semiBold },
    medium: { ...textBase.body, fontFamily: AppFont.medium },
    regular: { ...textBase.body, fontFamily: AppFont.regular },
  },
  footnote: {
    bold: { ...textBase.footnote, fontFamily: AppFont.bold },
    semiBold: { ...textBase.footnote, fontFamily: AppFont.semiBold },
    medium: { ...textBase.footnote, fontFamily: AppFont.medium },
    regular: { ...textBase.footnote, fontFamily: AppFont.regular },
  },
  caption: {
    bold: { ...textBase.caption, fontFamily: AppFont.bold },
    semiBold: { ...textBase.caption, fontFamily: AppFont.semiBold },
    medium: { ...textBase.caption, fontFamily: AppFont.medium },
    regular: { ...textBase.caption, fontFamily: AppFont.regular },
  },
  mini: {
    bold: { ...textBase.mini, fontFamily: AppFont.bold },
    semiBold: { ...textBase.mini, fontFamily: AppFont.semiBold },
    medium: { ...textBase.mini, fontFamily: AppFont.medium },
    regular: { ...textBase.mini, fontFamily: AppFont.regular },
  },
}
