import {
  AntDesign,
  Entypo,
  EvilIcons,
  Feather,
  FontAwesome,
  FontAwesome5,
  FontAwesome6,
  Fontisto,
  Foundation,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
  Octicons,
  SimpleLineIcons,
  Zocial,
} from '@expo/vector-icons'
import React from 'react'
import {
  TouchableOpacity,
  type TouchableOpacityProps,
  type ViewStyle,
} from 'react-native'

const allComponents = {
  MaterialCommunityIcons,
  MaterialIcons,
  AntDesign,
  Entypo,
  EvilIcons,
  Feather,
  FontAwesome,
  Fontisto,
  Foundation,
  Ionicons,
  Octicons,
  SimpleLineIcons,
  Zocial,
  FontAwesome5,
  FontAwesome6,
}

type VectorIconProps = {
  name: string
  size?: number
  color?: string
  style?: ViewStyle
  font?:
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
  onPress?: () => void
  buttonStyle?: ViewStyle
  buttonProps?: TouchableOpacityProps
}

export const VectorIcon = ({
  name,
  size,
  color,
  style,
  font = 'FontAwesome6',
  onPress,
  buttonStyle,
  buttonProps,
}: VectorIconProps) => {
  const IconComponent = allComponents[font]
  return typeof onPress === 'function' ? (
    <TouchableOpacity
      onPress={onPress}
      style={[{ justifyContent: 'center', alignItems: 'center' }, buttonStyle]}
      {...buttonProps}>
      {/* @ts-ignore */}
      <IconComponent name={name} size={size} color={color} style={style} />
    </TouchableOpacity>
  ) : (
    <>
      {/* @ts-ignore */}
      <IconComponent name={name} size={size} color={color} style={style} />
    </>
  )
}
