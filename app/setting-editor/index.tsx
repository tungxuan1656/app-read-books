import { AppColors } from '@/assets'
import { Button } from '@/components/Button'
import { GToast } from '@/components/g-toast'
import { Divider, Screen } from '@/components/Screen'
import { AppTypo, MMKVKeys } from '@/constants'
import { SettingConfig } from '@/constants/SettingConfigs'
import { MMKVStorage } from '@/controllers/mmkv'
import { router, useLocalSearchParams } from 'expo-router'
import React from 'react'
import { StyleSheet, Text, TextInput, View } from 'react-native'

export default function SettingEditor() {
  const params = useLocalSearchParams<{
    settingKey: string
    label: string
    inputType: string
    placeholder: string
    description?: string
    lines?: string
  }>()

  const settingKey = params.settingKey
  const label = params.label
  const inputType = params.inputType as 'single' | 'multiline'
  const placeholder = params.placeholder
  const description = params.description
  const lines = params.lines ? parseInt(params.lines) : inputType === 'multiline' ? 8 : 2

  // Lấy giá trị hiện tại từ MMKV
  const currentValue = (MMKVStorage.get(settingKey) as string) || ''
  const refTextValue = React.useRef<string>(currentValue)

  const handleSave = () => {
    const value = refTextValue.current
    MMKVStorage.set(settingKey, value)
    GToast.success({ message: `Đã lưu ${label}` })
    router.canGoBack() && router.back()
  }

  const handleClear = () => {
    refTextValue.current = ''
    MMKVStorage.set(settingKey, '')
    GToast.success({ message: `Đã xóa ${label}` })
  }

  return (
    <Screen.Container>
      <Screen.Header title={label} />
      <Divider />
      <Screen.Content
        useScroll
        useKeyboard
        contentContainerStyle={{ padding: 16, gap: 12, paddingVertical: 20 }}
        style={{ backgroundColor: AppColors.bgExtra }}>
        {description ? (
          <Text style={[AppTypo.caption.regular, { color: AppColors.textBlur }]}>
            {description}
          </Text>
        ) : null}

        <TextInput
          placeholder={placeholder}
          onChangeText={(text) => (refTextValue.current = text)}
          style={[
            styles.input,
            { height: lines * 20 + 40 },
            inputType === 'multiline' ? AppTypo.body.regular : AppTypo.body.medium,
          ]}
          multiline={inputType === 'multiline'}
          numberOfLines={lines}
          defaultValue={currentValue}
          textAlignVertical="top"
        />
      </Screen.Content>
      <Screen.Footer>
        <Button
          title="Xóa"
          onPress={handleClear}
          style={{ flex: 1 }}
          theme={{
            button: { backgroundColor: AppColors.bgDisabled },
            title: { color: AppColors.textMain },
          }}
        />
        <Button title="Lưu" onPress={handleSave} style={{ flex: 2 }} />
      </Screen.Footer>
    </Screen.Container>
  )
}

const styles = StyleSheet.create({
  input: {
    borderColor: AppColors.bgDisabled,
    backgroundColor: AppColors.white,
    borderWidth: 1,
    borderRadius: 20,
    padding: 12,
    lineHeight: 20,
  },
})
