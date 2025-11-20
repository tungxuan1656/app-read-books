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
  const defaultGeminiKey = (MMKVStorage.get(MMKVKeys.GEMINI_API_KEY) as string) || ''
  const defaultSummaryPrompt = (MMKVStorage.get(MMKVKeys.GEMINI_SUMMARY_PROMPT) as string) || ''
  const defaultTranslatePrompt =
    (MMKVStorage.get(MMKVKeys.GEMINI_TRANSLATE_PROMPT) as string) || ''
  const defaultCapcutToken = (MMKVStorage.get(MMKVKeys.CAPCUT_TOKEN) as string) || ''

  const refTextApiKey = React.useRef<string>(defaultGeminiKey)
  const refTextSummaryPrompt = React.useRef<string>(defaultSummaryPrompt)
  const refTextTranslatePrompt = React.useRef<string>(defaultTranslatePrompt)
  const refTextCapcutToken = React.useRef<string>(defaultCapcutToken)

  const handleSaveSettings = () => {
    const apiKey = refTextApiKey.current
    const summaryPrompt = refTextSummaryPrompt.current
    const translatePrompt = refTextTranslatePrompt.current
    const capcutToken = refTextCapcutToken.current

    MMKVStorage.set(MMKVKeys.GEMINI_API_KEY, apiKey)
    MMKVStorage.set(MMKVKeys.GEMINI_SUMMARY_PROMPT, summaryPrompt)
    MMKVStorage.set(MMKVKeys.GEMINI_TRANSLATE_PROMPT, translatePrompt)
    MMKVStorage.set(MMKVKeys.CAPCUT_TOKEN, capcutToken)
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
          defaultValue={defaultGeminiKey}
        />
        <TextInput
          numberOfLines={8}
          style={[styles.input, { height: 280 }, AppTypo.body.regular]}
          placeholder="Prompt tóm tắt truyện, nội dung chapter là {{content}}"
          onChangeText={(text) => (refTextSummaryPrompt.current = text)}
          defaultValue={defaultSummaryPrompt}
          multiline
        />
        <TextInput
          numberOfLines={8}
          style={[styles.input, { height: 280 }, AppTypo.body.regular]}
          placeholder="Prompt dịch truyện convert sang văn phong tiếng Việt"
          onChangeText={(text) => (refTextTranslatePrompt.current = text)}
          defaultValue={defaultTranslatePrompt}
          multiline
        />
        <TextInput
          placeholder="Capcut TTS Token"
          onChangeText={(text) => (refTextCapcutToken.current = text)}
          style={[styles.input, { height: 60 }, AppTypo.body.medium]}
          multiline
          numberOfLines={2}
          defaultValue={defaultCapcutToken}
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
    lineHeight: 20,
  },
})
