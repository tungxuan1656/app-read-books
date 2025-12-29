import { AppColors, AppPalette } from '@/assets'
import { VectorIcon } from '@/components/Icon'
import { AppTypo } from '@/constants'
import { SettingConfig } from '@/constants/setting-configs'
import useAppStore, { storeActions } from '@/controllers/store'
import { router } from 'expo-router'
import React from 'react'
import { ActionSheetIOS, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

interface SettingItemProps {
  config: SettingConfig
}

export const SettingItem: React.FC<SettingItemProps> = ({ config }) => {
  const settings = useAppStore().settings
  const currentValue = (settings[config.key as keyof typeof settings] as string) || ''

  const hasValue =
    !!currentValue && typeof currentValue === 'string' && currentValue.trim().length > 0

  const handlePress = () => {
    // Nếu là picker, hiển thị ActionSheet
    if (config.inputType === 'picker' && config.options) {
      showPickerOptions()
      return
    }

    // Mặc định navigate đến editor
    router.push({
      pathname: '/setting-editor',
      params: {
        settingKey: config.key,
        label: config.label,
        placeholder: config.placeholder,
        description: config.description,
      },
    })
  }

  const showPickerOptions = () => {
    if (!config.options) return

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [...config.options.map((opt) => opt.label), 'Hủy'],
          cancelButtonIndex: config.options.length,
          title: config.label,
          message: config.description,
        },
        (buttonIndex) => {
          if (buttonIndex < config.options!.length) {
            const selectedOption = config.options![buttonIndex]
            storeActions.updateSetting(config.key as keyof typeof settings, selectedOption.value)
          }
        },
      )
    } else {
      // Android: Sử dụng Alert với buttons
      const { Alert } = require('react-native')
      Alert.alert(
        config.label,
        config.description,
        [
          ...config.options.map((opt) => ({
            text: opt.label,
            onPress: () =>
              storeActions.updateSetting(config.key as keyof typeof settings, opt.value),
          })),
          { text: 'Hủy', style: 'cancel' },
        ],
        { cancelable: true },
      )
    }
  }

  // Hiển thị giá trị rút gọn
  const displayValue = React.useMemo(() => {
    if (!hasValue) return 'Chưa thiết lập'

    // Nếu là picker, tìm label tương ứng
    if (config.inputType === 'picker' && config.options) {
      const option = config.options.find((opt) => opt.value === currentValue)
      return option?.label || currentValue
    }

    return currentValue
  }, [currentValue, hasValue, config])

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress} activeOpacity={0.7}>
      <View style={styles.leftContent}>
        <Text style={[AppTypo.body.medium, styles.label]}>{config.label}</Text>
        <Text
          style={[
            AppTypo.caption.regular,
            styles.value,
            !hasValue && { color: AppColors.textDisabled },
          ]}
          numberOfLines={1}>
          {displayValue}
        </Text>
      </View>
      <VectorIcon name="chevron-right" font="FontAwesome5" size={12} color={AppPalette.gray400} />
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: AppColors.white,
    gap: 12,
  },
  leftContent: {
    flex: 1,
    gap: 4,
  },
  label: {
    color: AppColors.textMain,
  },
  value: {
    color: AppColors.textBlur,
  },
})
