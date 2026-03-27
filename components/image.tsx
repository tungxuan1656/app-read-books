import {
  Image as NImage,
  ImageBackground as NImageBackground,
  type ImageProps,
  type ImageSource as NImageSource,
  type ImageStyle as NImageStyle,
} from 'expo-image'
import { cssInterop } from 'nativewind'
import * as React from 'react'

export type ImgProps = ImageProps & {
  className?: string
}

export type { ImageProps }

cssInterop(NImage, { className: 'style' })
cssInterop(NImageBackground, { className: 'style' })

export const Image = ({
  style,
  className,
  placeholder = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4',
  ...props
}: ImgProps) => {
  return (
    <NImage
      className={className}
      placeholder={placeholder}
      style={style}
      {...props}
    />
  )
}

export type ImageSource = NImageSource
export type ImageStyle = NImageStyle

export const preloadImages = (sources: string[]) => {
  NImage.prefetch(sources)
}
