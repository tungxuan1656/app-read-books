import React from 'react'
import {
  StatusBar,
  StyleSheet,
  View,
  ViewStyle,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  TextStyle,
  Image,
  StyleProp,
  ActivityIndicator,
  Platform,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AppColors, AppIcons } from '@/assets'
import { AppTypo } from '@/constants'
import { router } from 'expo-router'
import { VectorIcon } from '../icon'

type ContainerProps = {
  safe?: 'all' | 'bottom' | 'top' | 'none'
  style?: StyleProp<ViewStyle>
  children?: React.ReactNode
}

const Container: React.FC<ContainerProps> = ({ children, safe = 'bottom', style = {} }) => {
  const insets = useSafeAreaInsets()

  return (
    <View style={[styles.container, style]}>
      <StatusBar barStyle={'dark-content'} backgroundColor={AppColors.bgMain} />
      <View
        style={{
          flex: 1,
          marginTop: safe === 'all' || safe === 'top' ? insets.top : 0,
          marginBottom: safe === 'all' || safe === 'bottom' ? insets.bottom : 0,
        }}>
        {children}
      </View>
    </View>
  )
}

type HeaderProps = {
  safeTop?: boolean
  style?: StyleProp<ViewStyle>
  ItemLeft?: React.ReactNode
  ItemRight?: React.ReactNode
  title?: string
  hasBack?: boolean
  hasClose?: boolean
  titleStyle?: StyleProp<TextStyle>
  onClose?: () => void
  tintColor?: string
}

const Header: React.FC<HeaderProps> = ({
  safeTop = true,
  ItemLeft,
  ItemRight,
  title,
  hasBack = true,
  hasClose = false,
  titleStyle,
  style,
  onClose,
  tintColor,
}) => {
  const insets = useSafeAreaInsets()

  return (
    <View style={[{ backgroundColor: AppColors.bgMain }, style]}>
      <View style={[styles.headerContainer, safeTop && { marginTop: insets.top }]}>
        <View style={styles.left}>
          {hasBack ? (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <VectorIcon
                font="FontAwesome6"
                name="angle-left"
                color={tintColor ?? AppColors.buttonBlur}
              />
            </TouchableOpacity>
          ) : null}
          {hasClose ? (
            <TouchableOpacity onPress={() => onClose?.()} style={styles.backButton}>
              <VectorIcon font="Ionicons" name="close" color={tintColor ?? AppColors.buttonBlur} />
            </TouchableOpacity>
          ) : null}
          {ItemLeft}
        </View>
        <Text
          style={[styles.title, { color: tintColor ?? AppColors.textMain }, titleStyle]}
          numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.right}>{ItemRight}</View>
      </View>
    </View>
  )
}

type ContentProps = {
  children?: React.ReactNode
  style?: StyleProp<ViewStyle>
  contentContainerStyle?: StyleProp<ViewStyle>
  refreshControl?: JSX.Element
  useKeyboard?: boolean
  useScroll?: boolean
  showLoading?: boolean
}

const Content: React.FC<ContentProps> = ({
  children,
  style,
  contentContainerStyle,
  useKeyboard = false,
  useScroll = false,
  refreshControl = undefined,
  showLoading = false,
}) => {
  if (showLoading) {
    return <ActivityIndicator style={[{ flex: 1 }, style]} size={'small'} />
  }

  if (useKeyboard) {
    return (
      <KeyboardAvoidingView
        style={[{ flex: 1, overflow: 'hidden' }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {useScroll ? (
          <ScrollView
            style={[{ flex: 1 }, style]}
            keyboardShouldPersistTaps={'handled'}
            contentContainerStyle={contentContainerStyle}
            refreshControl={refreshControl}>
            {children}
          </ScrollView>
        ) : (
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={[{ flex: 1 }, style]}>{children}</View>
          </TouchableWithoutFeedback>
        )}
      </KeyboardAvoidingView>
    )
  }

  if (useScroll) {
    return (
      <ScrollView
        style={[{ flex: 1 }, style]}
        refreshControl={refreshControl}
        contentContainerStyle={contentContainerStyle}>
        {children}
      </ScrollView>
    )
  }

  return <View style={[{ flex: 1 }, style]}>{children}</View>
}

type FooterProps = {
  children?: React.ReactNode | JSX.Element | JSX.Element[]
  style?: StyleProp<ViewStyle>
}

const Footer: React.FC<FooterProps> = ({ children, style }) => {
  const insets = useSafeAreaInsets()
  return (
    <View style={[{ paddingBottom: insets.bottom !== 0 ? 0 : 16 }, styles.containerFooter, style]}>
      {children}
    </View>
  )
}

export const Screen = {
  Container,
  Header,
  Content,
  Footer,
}

const headerHeight = 44

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.bgMain,
  },
  headerContainer: {
    backgroundColor: AppColors.bgMain,
    height: headerHeight,
    // justifyContent: 'center',
    alignItems: 'center',
    top: -4,
    flexDirection: 'row',
  },
  left: { height: headerHeight, flexDirection: 'row', alignItems: 'center', minWidth: 16 },
  right: { height: headerHeight, flexDirection: 'row', alignItems: 'center' },
  title: {
    ...AppTypo.headline.semiBold,
    // marginHorizontal: 70,
    color: AppColors.textMain,
    flex: 1,
  },
  backButton: {
    height: '100%',
    width: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  containerFooter: {
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    gap: 16,
    borderTopColor: AppColors.strokeMain,
    flexDirection: 'row',
  },
})
