import { router } from 'expo-router'
import React from 'react'

import { AppColors } from '@/assets'

import { VectorIcon } from '../vector-icon'

function ReadingButtonBack() {
  return (
    <VectorIcon
      name='circle-chevron-left'
      font='FontAwesome6'
      size={22}
      buttonClassName='absolute left-1 top-3 size-11 rounded-full'
      color={AppColors.gray300}
      onPress={router.back}
    />
  )
}

export default React.memo(ReadingButtonBack)
