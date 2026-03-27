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
import { cssInterop } from 'nativewind'
import React from 'react'
import {
  TouchableOpacity,
  type TouchableOpacityProps,
  type ViewStyle,
} from 'react-native'

cssInterop(MaterialCommunityIcons, { className: 'style' })
cssInterop(MaterialIcons, { className: 'style' })
cssInterop(AntDesign, { className: 'style' })
cssInterop(Entypo, { className: 'style' })
cssInterop(EvilIcons, { className: 'style' })
cssInterop(Feather, { className: 'style' })
cssInterop(FontAwesome, { className: 'style' })
cssInterop(Fontisto, { className: 'style' })
cssInterop(Foundation, { className: 'style' })
cssInterop(Ionicons, { className: 'style' })
cssInterop(Octicons, { className: 'style' })
cssInterop(SimpleLineIcons, { className: 'style' })
cssInterop(Zocial, { className: 'style' })
cssInterop(FontAwesome5, { className: 'style' })
cssInterop(FontAwesome6, { className: 'style' })

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
  className?: string
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
  buttonClassName?: string
  buttonProps?: TouchableOpacityProps
}

export const VectorIcon = ({
  name,
  size,
  color,
  style,
  className,
  font = 'FontAwesome6',
  onPress,
  buttonStyle,
  buttonClassName,
  buttonProps,
}: VectorIconProps) => {
  const IconComponent = allComponents[font]
  return typeof onPress === 'function' ? (
    <TouchableOpacity
      onPress={onPress}
      className={`items-center justify-center ${buttonClassName ?? ''}`}
      style={[buttonStyle]}
      {...buttonProps}>
      {/* @ts-ignore */}
      <IconComponent
        name={name}
        size={size}
        color={color}
        style={style}
        className={className}
      />
    </TouchableOpacity>
  ) : (
    <>
      {/* @ts-ignore */}
      <IconComponent
        name={name}
        size={size}
        color={color}
        style={style}
        className={className}
      />
    </>
  )
}
