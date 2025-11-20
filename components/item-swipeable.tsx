import React, { useRef } from 'react'
import { StyleSheet, Text, TouchableOpacity, View, type ViewStyle } from 'react-native'
import Swipeable, { type SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable'
import Reanimated, {
  type SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated'
import { VectorIcon } from './Icon'

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
}

export const ItemSwipeable = React.memo(
  ({ item, renderActions, children, style }: ItemSwipeableProps) => {
    const refSwipeable = useRef<SwipeableMethods | null>(null)
    return (
      <Swipeable
        containerStyle={undefined}
        renderRightActions={() => renderActions?.(item, () => refSwipeable.current?.close?.())}
        ref={refSwipeable}>
        <View style={[styles.container, style]}>{children}</View>
      </Swipeable>
    )
  },
)

export const SwipeableAction = ({
  icon,
  iconFont,
  item,
  style,
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
  title: string
  onPress: (item: any) => void
  cb?: () => void
  backgroundColor?: string
  iconColor?: string
}) => {
  return (
    <TouchableOpacity
      style={[styles.action, { backgroundColor }, style]}
      onPress={() => {
        onPress(item)
        cb?.()
      }}>
      <VectorIcon name={icon} font={iconFont} color={iconColor} size={20} />
      <Text style={styles.actionText}>{title}</Text>
    </TouchableOpacity>
  )
}

export const ViewSwipeable = ({
  style,
  children,
}: {
  style?: ViewStyle
  children?: React.ReactNode | JSX.Element | JSX.Element[]
}) => {
  return <View style={[styles.actionsContainer, style]}>{children}</View>
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

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
  },
  actionsContainer: {
    flexDirection: 'row',
    padding: 0,
  },
  action: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    paddingHorizontal: 8,
  },
  actionText: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '500',
    color: '#fff',
  },
})
