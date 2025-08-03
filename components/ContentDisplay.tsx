import { AppConst } from "@/constants"
import React from "react"
import RenderHTML from "react-native-render-html"

export const ContentDisplay = React.memo(
  ({
    chapterHtml,
    font,
    lineHeight,
    fontSize,
    onLoaded,
  }: {
    chapterHtml: string
    font: string
    lineHeight: number
    fontSize: number
    onLoaded: () => void
  }) => {
    return (
      <RenderHTML
        source={{ html: chapterHtml, baseUrl: '' }}
        baseStyle={{ flex: 1, marginHorizontal: 16 }}
        contentWidth={AppConst.windowWidth() - 32}
        systemFonts={[
          'Inter-Regular',
          'Montserrat-Regular',
          'NotoSans-Regular',
          'OpenSans-Regular',
          'Raleway-Regular',
          'Roboto-Regular',
          'SpaceMono-Regular',
          'WorkSans-Regular',
        ]}
        tagsStyles={{
          body: { fontFamily: font, lineHeight: fontSize * lineHeight, fontSize: fontSize },
          h2: { fontSize: fontSize * 1.5 },
        }}
        onHTMLLoaded={onLoaded}
      />
    )
  },
)
