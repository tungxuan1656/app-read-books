import { AppColors } from '@/assets'
import { Button } from '@/components/Button'
import { GToast } from '@/components/g-toast'
import { Screen } from '@/components/Screen'
import { AppTypo, MMKVKeys } from '@/constants'
import { MMKVStorage } from '@/controllers/mmkv'
import { router } from 'expo-router'
import React from 'react'
import { StyleSheet, TextInput } from 'react-native'

export default function Settings() {
  const refTextApiKey = React.useRef<string>('')
  const refTextSummaryPrompt = React.useRef<string>('')

  const handleSaveSettings = () => {
    const apiKey = refTextApiKey.current
    const summaryPrompt = refTextSummaryPrompt.current

    MMKVStorage.set(MMKVKeys.GEMINI_API_KEY, apiKey)
    MMKVStorage.set(MMKVKeys.GEMINI_SUMMARY_PROMPT, summaryPrompt)
    GToast.success({ message: 'Cài đặt đã được lưu' })
    router.canGoBack() && router.back()
  }

  return (
    <Screen.Container>
      <Screen.Header title="Cài đặt" />
      <Screen.Content
        useScroll
        useKeyboard
        contentContainerStyle={{ padding: 20, gap: 20 }}
        style={{ backgroundColor: AppColors.bgExtra }}>
        <TextInput
          placeholder="Gemini API Key"
          onChangeText={(text) => (refTextApiKey.current = text)}
          style={[styles.input, { height: 60 }, AppTypo.body.medium]}
          multiline
          numberOfLines={2}
          defaultValue={MMKVStorage.get(MMKVKeys.GEMINI_API_KEY) || ''}
        />
        <TextInput
          numberOfLines={10}
          style={[styles.input, { height: 400 }, AppTypo.body.regular]}
          placeholder="Prompt tóm tắt truyện, nội dung chapter là {{content}}"
          onChangeText={(text) => (refTextSummaryPrompt.current = text)}
          defaultValue={MMKVStorage.get(MMKVKeys.GEMINI_SUMMARY_PROMPT) || ''}
          multiline
        />
      </Screen.Content>
      <Button
        title={'Lưu cài đặt'}
        onPress={handleSaveSettings}
        style={{ marginHorizontal: 20, marginTop: 12 }}
      />
    </Screen.Container>
  )
}

const styles = StyleSheet.create({
  input: {
    height: 40,
    borderColor: AppColors.bgDisabled,
    backgroundColor: AppColors.white,
    borderWidth: 1,
    borderRadius: 20,
    padding: 12,
    lineHeight: 20
  },
})
