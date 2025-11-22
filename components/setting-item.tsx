import { AppColors, AppPalette } from '@/assets'
import { VectorIcon } from '@/components/Icon'
import { AppTypo } from '@/constants'
import { SettingConfig } from '@/constants/setting-configs'
import useAppStore from '@/controllers/store'
import { router } from 'expo-router'
import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

interface SettingItemProps {
  config: SettingConfig
}

export const SettingItem: React.FC<SettingItemProps> = ({ config }) => {
  const settings = useAppStore().settings
  const currentValue = (settings[config.key as keyof typeof settings] as string) || ''

  const hasValue =
    !!currentValue && typeof currentValue === 'string' && currentValue.trim().length > 0

  const handlePress = () => {
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

  // Hiển thị giá trị rút gọn
  const displayValue = React.useMemo(() => {
    if (!hasValue) return 'Chưa thiết lập'
    return currentValue
  }, [currentValue, hasValue])

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
