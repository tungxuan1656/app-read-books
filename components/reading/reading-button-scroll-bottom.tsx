import React from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { AppColors } from '@/assets'

import { VectorIcon } from '../vector-icon'

function ReadingButtonScrollBottom({
  onScrollToBottom,
}: {
  onScrollToBottom: () => void
}) {
  const insets = useSafeAreaInsets()
  return (
    <VectorIcon
      name='circle-arrow-down'
      font='FontAwesome6'
      size={18}
      buttonStyle={{
        bottom: Math.max(10, insets.bottom) - 16,
        position: 'absolute',
      }}
      buttonClassName='absolute size-12 self-center rounded-full bg-transparent'
      color={AppColors.gray300}
      onPress={onScrollToBottom}
    />
  )
}

export default React.memo(ReadingButtonScrollBottom)
