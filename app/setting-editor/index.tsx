import { router, useLocalSearchParams } from 'expo-router'
import React, { useMemo } from 'react'
import { Text, TextInput } from 'react-native'

import { AppColors } from '@/assets'
import { Button } from '@/components/button'
import { Divider } from '@/components/divider'
import { GToast } from '@/components/g-toast'
import { Screen } from '@/components/screen'
import useAppStore, { storeActions } from '@/controllers/store'

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
  const settings = useMemo(() => useAppStore.getState().settings, [])
  const currentValue =
    (settings[settingKey as keyof typeof settings] as string) || ''
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
      <Screen.Content useKeyboard className='gap-3 bg-slate-50 px-4 py-5'>
        {description ? (
          <Text className='text-xs font-normal text-gray-500'>
            {description}
          </Text>
        ) : null}

        <TextInput
          placeholder={placeholder}
          onChangeText={(text) => (refTextValue.current = text)}
          className='rounded-2xl border border-neutral-200 bg-white p-4'
          multiline={true}
          defaultValue={currentValue}
          textAlignVertical='top'
          autoCapitalize='none'
        />
      </Screen.Content>
      <Screen.Footer>
        <Button
          title='Xóa'
          onPress={handleClear}
          className='flex-1'
          theme={{
            button: { backgroundColor: AppColors.gray300 },
            title: { color: AppColors.gray900 },
          }}
        />
        <Button title='Lưu' onPress={handleSave} className='flex-[2]' />
      </Screen.Footer>
    </Screen.Container>
  )
}
