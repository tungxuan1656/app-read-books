import React, { type ErrorInfo } from 'react'
import { ScrollView, Text, View } from 'react-native'

import { Screen } from './screen'

export interface ErrorComponentProps {
  error: Error
  errorInfo?: ErrorInfo | null
  onReset(): void
}

export const ErrorComponent = (props?: ErrorComponentProps) => {
  return (
    <Screen.Container safe='all'>
      <Screen.Content>
        <View className='flex-1 items-center justify-center gap-6 px-8 py-14'>
          {/* Title */}
          <Text className='text-center text-5xl font-bold'>
            {'Đã xảy ra lỗi không mong muốn'}
          </Text>

          {/* Spacer */}
          <ScrollView className='flex-1'>
            <View className='mt-4 w-full gap-5 rounded-lg bg-gray-300 p-3'>
              <Text className='text-xs text-gray-700' selectable>
                {JSON.stringify(props?.error, null, 2)}
              </Text>
              <Text className='text-xs text-gray-700' selectable>
                {JSON.stringify(props?.errorInfo, null, 2)}
              </Text>
            </View>
          </ScrollView>
        </View>
      </Screen.Content>
    </Screen.Container>
  )
}
