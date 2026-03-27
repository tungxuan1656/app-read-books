import React from 'react'
import { Dimensions, StyleSheet, Text, View } from 'react-native'
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
      style={{ height: 24, marginLeft: 4 }}
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
        style={[styles.text2, { maxWidth: 60, textAlign: 'right' }]}
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
      style={styles.defaultToast}
      contentContainerStyle={styles.contentContainerStyle}
      text1Style={styles.text1}
      text2Style={styles.text2}
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
      style={[styles.defaultToast, styles.successToast]}
      contentContainerStyle={styles.contentContainerStyle}
      text1Style={styles.text1}
      text2Style={styles.text2}
    />
  ),
  info: (props: ToastConfigParams<any>) => (
    <BaseToast
      {...props}
      text1NumberOfLines={2}
      text2NumberOfLines={4}
      renderLeadingIcon={() => renderLeadingIcon('info', 'Foundation')}
      renderTrailingIcon={() => renderTrailingAction(props.props?.action)}
      style={[styles.defaultToast, styles.infoToast]}
      contentContainerStyle={styles.contentContainerStyle}
      text1Style={styles.text1}
      text2Style={styles.text2}
    />
  ),
  warning: (props: ToastConfigParams<any>) => (
    <BaseToast
      {...props}
      text1NumberOfLines={2}
      text2NumberOfLines={4}
      renderLeadingIcon={() => renderLeadingIcon('warning', 'Ionicons')}
      renderTrailingIcon={() => renderTrailingAction(props.props?.action)}
      style={[styles.defaultToast, styles.warningToast]}
      contentContainerStyle={styles.contentContainerStyle}
      text1Style={styles.text1}
      text2Style={styles.text2}
    />
  ),
  error: (props: ToastConfigParams<any>) => (
    <BaseToast
      {...props}
      text1NumberOfLines={2}
      text2NumberOfLines={4}
      renderLeadingIcon={() => renderLeadingIcon('warning', 'Ionicons')}
      renderTrailingIcon={() => renderTrailingAction(props.props?.action)}
      style={[styles.defaultToast, styles.errorToast]}
      contentContainerStyle={styles.contentContainerStyle}
      text1Style={styles.text1}
      text2Style={styles.text2}
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

const styles = StyleSheet.create({
  contentContainerStyle: {
    paddingHorizontal: 8,
  },
  text1: {
    fontSize: 14,
    fontWeight: '500',
    color: AppColors.white,
  },
  text2: {
    fontSize: 14,
    fontWeight: '400',
    color: AppColors.white,
  },
  defaultToast: {
    borderLeftColor: AppColors.gray600,
    backgroundColor: AppColors.gray600,
    height: 'auto',
    borderRadius: 24,
    width: Dimensions.get('window').width - 40,
    paddingVertical: 12,
    borderLeftWidth: 0,
    paddingHorizontal: 12,
  },
  infoToast: {
    borderLeftColor: AppColors.blue500,
    backgroundColor: AppColors.blue500,
  },
  successToast: {
    borderLeftColor: AppColors.green600,
    backgroundColor: AppColors.green600,
  },
  warningToast: {
    borderLeftColor: AppColors.orange500,
    backgroundColor: AppColors.orange500,
  },
  errorToast: {
    borderLeftColor: AppColors.red500,
    backgroundColor: AppColors.red500,
  },
})
