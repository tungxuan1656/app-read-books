import React from 'react'
import { TouchableOpacity, ViewStyle } from 'react-native'
import {
  AntDesign,
  Entypo,
  EvilIcons,
  Feather,
  FontAwesome,
  Fontisto,
  Foundation,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
  Octicons,
  SimpleLineIcons,
  Zocial,
  FontAwesome5,
  FontAwesome6,
} from '@expo/vector-icons'

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
}

export const VectorIcon = ({
  name,
  size,
  color,
  style,
  font = 'FontAwesome6',
  onPress,
  buttonStyle,
}: VectorIconProps) => {
  const IconComponent = allComponents[font]
  return typeof onPress === 'function' ? (
    <TouchableOpacity
      onPress={onPress}
      style={[{ justifyContent: 'center', alignItems: 'center' }, buttonStyle]}>
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
