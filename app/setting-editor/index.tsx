import { router, useLocalSearchParams } from 'expo-router'
import React, { useMemo } from 'react'
import { Text, TextInput } from 'react-native'

import { type AIAction, type AppSettings } from '@/@types/settings'
import { AppColors } from '@/assets'
import { Button } from '@/components/button'
import { Divider } from '@/components/divider'
import { GToast } from '@/components/g-toast'
import { Screen } from '@/components/screen'
import { settingsActions, useSettingsStore } from '@/controllers/stores'
import { cn } from '@/utils'

export default function SettingEditor() {
  const params = useLocalSearchParams<{
    settingKey: string
    label: string
    placeholder: string
    description?: string
    multiple?: string
  }>()

  const settingKey = params.settingKey
  const label = params.label
  const placeholder = params.placeholder
  const description = params.description
  const multiple = params.multiple === 'true'

  const isAIProcessActionsKey = settingKey === 'AI_PROCESS_ACTIONS'

  const isValidAIAction = (value: unknown): value is AIAction => {
    if (!value || typeof value !== 'object') return false
    const target = value as Record<string, unknown>
    return (
      typeof target.key === 'string' &&
      typeof target.name === 'string' &&
      typeof target.prompt === 'string'
    )
  }

  const settings = useMemo(() => useSettingsStore.getState().settings, [])
  const currentSettingValue = settings[settingKey as keyof AppSettings]
  const currentValue =
    typeof currentSettingValue === 'string'
      ? currentSettingValue
      : JSON.stringify(currentSettingValue, null, 2)
  const refTextValue = React.useRef<string>(currentValue)

  const handleSave = () => {
    const value = refTextValue.current.trim()

    if (isAIProcessActionsKey) {
      try {
        const parsed = JSON.parse(value)

        if (!Array.isArray(parsed) || !parsed.every(isValidAIAction)) {
          GToast.error({
            message:
              'Định dạng AI Actions không hợp lệ. Mỗi phần tử cần có key, name, prompt.',
          })
          return
        }

        settingsActions.updateSetting('AI_PROCESS_ACTIONS', parsed)
      } catch {
        GToast.error({ message: 'AI Actions phải là JSON hợp lệ.' })
        return
      }
    } else {
      settingsActions.updateSetting(
        settingKey as keyof AppSettings,
        value as never,
      )
    }

    GToast.success({ message: `Đã lưu ${label}` })
    router.canGoBack() && router.back()
  }

  const handleClear = () => {
    refTextValue.current = isAIProcessActionsKey ? '[]' : ''

    if (isAIProcessActionsKey) {
      settingsActions.updateSetting('AI_PROCESS_ACTIONS', [])
    } else {
      settingsActions.updateSetting(
        settingKey as keyof AppSettings,
        '' as never,
      )
    }

    GToast.success({ message: `Đã xóa ${label}` })
  }

  return (
    <Screen.Container>
      <Screen.Header title={label} />
      <Divider />
      <Screen.Content useKeyboard className='gap-3 bg-slate-50 px-4 py-5'>
        {description ? (
          <Text className='text-ssm font-normal text-gray-500'>
            {description}
          </Text>
        ) : null}

        <TextInput
          placeholder={placeholder}
          onChangeText={(text) => (refTextValue.current = text)}
          className={cn(
            'rounded-2xl border border-neutral-200 bg-white p-4',
            multiple && 'flex-1',
          )}
          multiline={multiple}
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
