import React, { type ErrorInfo, useState } from 'react'
import { ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { Screen } from './Screen'
import { AppTypo } from '@/constants'
import { AppColors } from '@/assets'

export interface ErrorComponentProps {
  error: Error
  errorInfo?: ErrorInfo | null
  onReset(): void
}

export const ErrorComponent = (props?: ErrorComponentProps) => {
  return (
    <Screen.Container safe="all">
      <Screen.Content>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            gap: 24,
            paddingHorizontal: 32,
            paddingVertical: 56,
          }}>
          {/* Title */}
          <Text style={[AppTypo.title, { textAlign: 'center' }]}>
            {'Đã xảy ra lỗi không mong muốn'}
          </Text>

          {/* Spacer */}
          <ScrollView style={{ flex: 1 }}>
            <View
              style={{
                marginTop: 16,
                width: '100%',
                gap: 20,
                borderRadius: 8,
                backgroundColor: '#E0E0E0',
                padding: 12,
              }}>
              <Text style={{ color: AppColors.textExtra, fontSize: 12 }} selectable>
                {JSON.stringify(props?.error, null, 2)}
              </Text>
              <Text style={{ color: AppColors.textExtra, fontSize: 12 }} selectable>
                {JSON.stringify(props?.errorInfo, null, 2)}
              </Text>
            </View>
          </ScrollView>
        </View>
      </Screen.Content>
    </Screen.Container>
  )
}
