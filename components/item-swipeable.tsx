import React, { useRef } from 'react'
import { Text, TouchableOpacity, View, type ViewStyle } from 'react-native'
import Swipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable'
import Reanimated, {
  type SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated'

import { VectorIcon } from './vector-icon'

type IconFont =
  | 'MaterialCommunityIcons'
  | 'MaterialIcons'
  | 'AntDesign'
  | 'Entypo'
  | 'EvilIcons'
  | 'Feather'
  | 'FontAwesome'
  | 'Fontisto'
  | 'Foundation'
  | 'Ionicons'
  | 'Octicons'
  | 'SimpleLineIcons'
  | 'Zocial'
  | 'FontAwesome5'
  | 'FontAwesome6'

type ItemSwipeableProps = {
  item: any
  renderActions?: (item: any, cb?: () => void) => React.ReactNode
  children?: React.ReactNode | JSX.Element | JSX.Element[]
  style?: ViewStyle
  className?: string
}

export const ItemSwipeable = React.memo(
  ({ item, renderActions, children, style, className }: ItemSwipeableProps) => {
    const refSwipeable = useRef<SwipeableMethods | null>(null)
    return (
      <Swipeable
        containerStyle={undefined}
        renderRightActions={() =>
          renderActions?.(item, () => refSwipeable.current?.close?.())
        }
        ref={refSwipeable}>
        <View className={className ?? 'bg-white'} style={[style]}>
          {children}
        </View>
      </Swipeable>
    )
  },
)

export const SwipeableAction = ({
  icon,
  iconFont,
  item,
  style,
  className,
  title,
  onPress,
  cb,
  backgroundColor,
  iconColor = '#fff',
}: {
  item: any
  icon: string
  iconFont: IconFont
  style?: ViewStyle
  className?: string
  title: string
  onPress: (item: any) => void
  cb?: () => void
  backgroundColor?: string
  iconColor?: string
}) => {
  return (
    <TouchableOpacity
      className={`w-20 items-center justify-center px-2 ${className ?? ''}`}
      style={[{ backgroundColor }, style]}
      onPress={() => {
        onPress(item)
        cb?.()
      }}>
      <VectorIcon name={icon} font={iconFont} color={iconColor} size={20} />
      <Text className='mt-1 text-xs font-medium text-white'>{title}</Text>
    </TouchableOpacity>
  )
}

export const ViewSwipeable = ({
  style,
  className,
  children,
}: {
  style?: ViewStyle
  className?: string
  children?: React.ReactNode | JSX.Element | JSX.Element[]
}) => {
  return (
    <View className={`flex-row p-0 ${className ?? ''}`} style={[style]}>
      {children}
    </View>
  )
}

export const RightAction = (
  prog: SharedValue<number>,
  drag: SharedValue<number>,
  children: React.ReactNode,
) => {
  const styleAnimation = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: drag.value + 50 }],
    }
  })

  return <Reanimated.View style={styleAnimation}>{children}</Reanimated.View>
}
