import React from 'react'
import { Dimensions, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Toast, {
  BaseToast,
  type ToastConfig,
  type ToastConfigParams,
} from 'react-native-toast-message'

import { AppColors } from '@/assets'

import { VectorIcon } from './vector-icon'

const renderLeadingIcon = (name: string, font: string) => {
  return (
    <VectorIcon
      name={name}
      // @ts-ignore
      font={font}
      className='ml-1 h-6'
      size={24}
      color={AppColors.white}
    />
  )
}

const renderTrailingAction = (action: string) => {
  if (!action) return null
  return (
    <View className='mx-3 max-w-[30%] items-center justify-center'>
      <Text
        className='max-w-[60px] text-right text-sm font-normal text-white'
        numberOfLines={4}>
        {action}
      </Text>
    </View>
  )
}

const toastConfig: ToastConfig = {
  default: (props: ToastConfigParams<any>) => (
    <BaseToast
      {...props}
      text1NumberOfLines={2}
      text2NumberOfLines={4}
      renderTrailingIcon={() => renderTrailingAction(props.props?.action)}
      style={DEFAULT_TOAST_STYLE}
      contentContainerStyle={CONTENT_CONTAINER_STYLE}
      text1Style={TEXT1_STYLE}
      text2Style={TEXT2_STYLE}
    />
  ),
  success: (props: ToastConfigParams<any>) => (
    <BaseToast
      {...props}
      text1NumberOfLines={2}
      text2NumberOfLines={4}
      renderLeadingIcon={() =>
        renderLeadingIcon('check-circle-fill', 'Octicons')
      }
      renderTrailingIcon={() => renderTrailingAction(props.props?.action)}
      style={[DEFAULT_TOAST_STYLE, SUCCESS_TOAST_STYLE]}
      contentContainerStyle={CONTENT_CONTAINER_STYLE}
      text1Style={TEXT1_STYLE}
      text2Style={TEXT2_STYLE}
    />
  ),
  info: (props: ToastConfigParams<any>) => (
    <BaseToast
      {...props}
      text1NumberOfLines={2}
      text2NumberOfLines={4}
      renderLeadingIcon={() => renderLeadingIcon('info', 'Foundation')}
      renderTrailingIcon={() => renderTrailingAction(props.props?.action)}
      style={[DEFAULT_TOAST_STYLE, INFO_TOAST_STYLE]}
      contentContainerStyle={CONTENT_CONTAINER_STYLE}
      text1Style={TEXT1_STYLE}
      text2Style={TEXT2_STYLE}
    />
  ),
  warning: (props: ToastConfigParams<any>) => (
    <BaseToast
      {...props}
      text1NumberOfLines={2}
      text2NumberOfLines={4}
      renderLeadingIcon={() => renderLeadingIcon('warning', 'Ionicons')}
      renderTrailingIcon={() => renderTrailingAction(props.props?.action)}
      style={[DEFAULT_TOAST_STYLE, WARNING_TOAST_STYLE]}
      contentContainerStyle={CONTENT_CONTAINER_STYLE}
      text1Style={TEXT1_STYLE}
      text2Style={TEXT2_STYLE}
    />
  ),
  error: (props: ToastConfigParams<any>) => (
    <BaseToast
      {...props}
      text1NumberOfLines={2}
      text2NumberOfLines={4}
      renderLeadingIcon={() => renderLeadingIcon('warning', 'Ionicons')}
      renderTrailingIcon={() => renderTrailingAction(props.props?.action)}
      style={[DEFAULT_TOAST_STYLE, ERROR_TOAST_STYLE]}
      contentContainerStyle={CONTENT_CONTAINER_STYLE}
      text1Style={TEXT1_STYLE}
      text2Style={TEXT2_STYLE}
    />
  ),
}

export const GToastComponent = () => {
  const insets = useSafeAreaInsets()
  return <Toast config={toastConfig} topOffset={insets.top} />
}

type GToastProps = {
  type?: string
  title?: string
  message?: string
  action?: string
  onPress?: () => void
}
const show = ({
  type = 'default',
  title,
  message,
  action,
  onPress,
}: GToastProps) => {
  Toast.show({
    type: type,
    visibilityTime: wordsToDuration((title ?? '') + (message ?? '')),
    text1: title,
    text2: message,
    onPress: () => {
      hide()
      onPress?.()
    },
    props: { action },
  })
}

const success = ({ title, message, action, onPress }: GToastProps) => {
  show({ type: 'success', title, message, action, onPress })
}

const info = ({ title, message, action, onPress }: GToastProps) => {
  show({ type: 'info', title, message, action, onPress })
}

const warning = ({ title, message, action, onPress }: GToastProps) => {
  show({ type: 'warning', title, message, action, onPress })
}

const error = ({ title, message, action, onPress }: GToastProps) => {
  show({ type: 'error', title, message, action, onPress })
}

const hide = () => {
  Toast.hide()
}

export const GToast = {
  hide,
  show,
  success,
  info,
  warning,
  error,
}

const wordsToDuration = (msg: string) => {
  if (msg.length < 60) return 3000
  else if (msg.length < 150) return 4000
  else return 5000
}

const CONTENT_CONTAINER_STYLE = {
  paddingHorizontal: 8,
}

const TEXT1_STYLE = {
  fontSize: 14,
  fontWeight: '500' as const,
  color: AppColors.white,
}

const TEXT2_STYLE = {
  fontSize: 14,
  fontWeight: '400' as const,
  color: AppColors.white,
}

const DEFAULT_TOAST_STYLE = {
  borderLeftColor: AppColors.gray600,
  backgroundColor: AppColors.gray600,
  height: 'auto' as const,
  borderRadius: 24,
  width: Dimensions.get('window').width - 40,
  paddingVertical: 12,
  borderLeftWidth: 0,
  paddingHorizontal: 12,
}

const INFO_TOAST_STYLE = {
  borderLeftColor: AppColors.blue500,
  backgroundColor: AppColors.blue500,
}

const SUCCESS_TOAST_STYLE = {
  borderLeftColor: AppColors.green600,
  backgroundColor: AppColors.green600,
}

const WARNING_TOAST_STYLE = {
  borderLeftColor: AppColors.orange500,
  backgroundColor: AppColors.orange500,
}

const ERROR_TOAST_STYLE = {
  borderLeftColor: AppColors.red500,
  backgroundColor: AppColors.red500,
}
