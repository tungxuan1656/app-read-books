import { router } from 'expo-router'
import React from 'react'
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  type StyleProp,
  Text,
  type TextStyle,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  type ViewStyle,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { cn } from '@/utils'

import { VectorIcon } from './vector-icon'

type ContainerProps = {
  safe?: 'all' | 'bottom' | 'top' | 'none'
  style?: StyleProp<ViewStyle>
  className?: string
  children?: React.ReactNode
}

const Container: React.FC<ContainerProps> = ({
  children,
  safe = 'bottom',
  style = {},
  className,
}) => {
  const insets = useSafeAreaInsets()

  return (
    <View className={cn('flex-1 bg-white', className)} style={style}>
      <StatusBar barStyle='dark-content' backgroundColor='#ffffff' />
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
  className?: string
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
  className,
  onClose,
  tintColor,
}) => {
  const insets = useSafeAreaInsets()

  return (
    <View className={cn('bg-white', className)} style={style}>
      <View
        className='-top-1 h-11 flex-row items-center bg-white'
        style={[safeTop && { marginTop: insets.top }]}>
        <View className='h-11 min-w-4 flex-row items-center'>
          {hasBack ? (
            <TouchableOpacity
              onPress={() => router.back()}
              className='h-full w-12 items-center justify-center'>
              <VectorIcon
                font='FontAwesome6'
                name='angle-left'
                color={tintColor ?? '#6b7280'}
              />
            </TouchableOpacity>
          ) : null}
          {hasClose ? (
            <TouchableOpacity
              onPress={() => onClose?.()}
              className='h-full w-12 items-center justify-center'>
              <VectorIcon
                font='Ionicons'
                name='close'
                color={tintColor ?? '#6b7280'}
              />
            </TouchableOpacity>
          ) : null}
          {ItemLeft}
        </View>
        <Text
          style={[tintColor ? { color: tintColor } : undefined, titleStyle]}
          className='flex-1 text-base font-semibold'
          numberOfLines={1}>
          {title}
        </Text>
        <View className='h-11 flex-row items-center'>{ItemRight}</View>
      </View>
    </View>
  )
}

type ContentProps = {
  children?: React.ReactNode
  style?: StyleProp<ViewStyle>
  className?: string
  contentContainerStyle?: StyleProp<ViewStyle>
  refreshControl?: JSX.Element
  useKeyboard?: boolean
  useScroll?: boolean
  showLoading?: boolean
}

const Content: React.FC<ContentProps> = ({
  children,
  style,
  className,
  contentContainerStyle,
  useKeyboard = false,
  useScroll = false,
  refreshControl = undefined,
  showLoading = false,
}) => {
  if (showLoading) {
    return (
      <View className='flex-1 items-center justify-center' style={style}>
        <ActivityIndicator size='small' />
      </View>
    )
  }

  if (useKeyboard) {
    return (
      <KeyboardAvoidingView
        className='flex-1 overflow-hidden'
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {useScroll ? (
          <ScrollView
            className={cn('flex-1', className)}
            style={style}
            keyboardShouldPersistTaps={'handled'}
            contentContainerStyle={contentContainerStyle}
            refreshControl={refreshControl}>
            {children}
          </ScrollView>
        ) : (
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View className={cn('flex-1', className)} style={style}>
              {children}
            </View>
          </TouchableWithoutFeedback>
        )}
      </KeyboardAvoidingView>
    )
  }

  if (useScroll) {
    return (
      <ScrollView
        className={cn('flex-1', className)}
        style={style}
        refreshControl={refreshControl}
        contentContainerStyle={contentContainerStyle}>
        {children}
      </ScrollView>
    )
  }

  return (
    <View className={cn('flex-1', className)} style={style}>
      {children}
    </View>
  )
}

type FooterProps = {
  children?: React.ReactNode | JSX.Element | JSX.Element[]
  style?: StyleProp<ViewStyle>
}

const Footer: React.FC<FooterProps> = ({ children, style }) => {
  const insets = useSafeAreaInsets()
  return (
    <View
      className='flex-row gap-4 border-t border-slate-200 px-4 pt-4'
      style={[{ paddingBottom: insets.bottom !== 0 ? 0 : 16 }, style]}>
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
