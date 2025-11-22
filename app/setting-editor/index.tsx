import { AppColors } from '@/assets'
import { Button } from '@/components/Button'
import { GToast } from '@/components/g-toast'
import { Divider, Screen } from '@/components/Screen'
import { AppTypo } from '@/constants'
import { SettingConfig } from '@/constants/setting-configs'
import { storeActions } from '@/controllers/store'
import useAppStore from '@/controllers/store'
import { router, useLocalSearchParams } from 'expo-router'
import React from 'react'
import { StyleSheet, Text, TextInput, View } from 'react-native'

export default function SettingEditor() {
  const params = useLocalSearchParams<{
    settingKey: string
    label: string
    placeholder: string
    description?: string
  }>()

  const settingKey = params.settingKey
  const label = params.label
  const placeholder = params.placeholder
  const description = params.description

  // Lấy giá trị hiện tại từ store
  const settings = useAppStore.getState().settings
  const currentValue = (settings[settingKey as keyof typeof settings] as string) || ''
  const refTextValue = React.useRef<string>(currentValue)

  const handleSave = () => {
    const value = refTextValue.current
    storeActions.updateSetting(settingKey as any, value)
    GToast.success({ message: `Đã lưu ${label}` })
    router.canGoBack() && router.back()
  }

  const handleClear = () => {
    refTextValue.current = ''
    storeActions.updateSetting(settingKey as any, '')
    GToast.success({ message: `Đã xóa ${label}` })
  }

  return (
    <Screen.Container>
      <Screen.Header title={label} />
      <Divider />
      <Screen.Content
        useKeyboard
        style={{ backgroundColor: AppColors.bgExtra, padding: 16, gap: 12, paddingVertical: 20 }}>
        {description ? (
          <Text style={[AppTypo.caption.regular, { color: AppColors.textBlur }]}>
            {description}
          </Text>
        ) : null}

        <TextInput
          placeholder={placeholder}
          onChangeText={(text) => (refTextValue.current = text)}
          style={[styles.input, AppTypo.body.regular]}
          multiline={true}
          defaultValue={currentValue}
          textAlignVertical="top"
          autoCapitalize="none"
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
    padding: 16,
    lineHeight: 20,
    flex: 1,
  },
})
