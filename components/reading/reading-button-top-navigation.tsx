import { router } from 'expo-router'
import React, { useCallback } from 'react'
import { View } from 'react-native'

import { AppColors } from '@/assets'

import { VectorIcon } from '../vector-icon'

export default function ReadingButtonTopNavigation({
  previousChapter,
  nextChapter,
}: {
  previousChapter: () => void
  nextChapter: () => void
}) {
  const handleViewReferences = useCallback(() => {
    router.navigate({ pathname: '/references' })
  }, [])

  return (
    <View className='absolute right-2.5 top-4 h-7 flex-row items-center justify-center gap-2.5 px-0.5'>
      {/* Navigation */}
      <View className='flex-row items-center rounded-full bg-gray-300'>
        <VectorIcon
          name='arrow-left'
          font='FontAwesome6'
          size={14}
          buttonClassName='size-7'
          color={AppColors.white}
          onPress={previousChapter}
        />
        <VectorIcon
          name='arrow-right'
          font='FontAwesome6'
          size={14}
          buttonClassName='size-7'
          color={AppColors.white}
          onPress={nextChapter}
        />
      </View>

      {/* Menu Button */}
      <VectorIcon
        name='bars'
        font='FontAwesome6'
        size={14}
        buttonClassName='size-7 rounded-full bg-white'
        color={AppColors.gray600}
        onPress={handleViewReferences}
      />
    </View>
  )
}
