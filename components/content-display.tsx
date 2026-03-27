import React from 'react'
import RenderHTML from 'react-native-render-html'

import { AppConst, READING_FONT_FAMILIES } from '@/constants'
import { useTypographyStore } from '@/controllers/stores'

export const ContentDisplay = React.memo(
  ({
    chapterHtml,
    onLoaded,
  }: {
    chapterHtml: string
    onLoaded?: () => void
  }) => {
    const { font, fontSize, lineHeight } = useTypographyStore.use.typography()

    return (
      <RenderHTML
        source={{ html: chapterHtml, baseUrl: '' }}
        baseStyle={{ flex: 1, marginHorizontal: 16, marginBottom: 80 }}
        contentWidth={AppConst.windowWidth() - 32}
        systemFonts={[...READING_FONT_FAMILIES]}
        tagsStyles={{
          body: {
            fontFamily: font,
            lineHeight: fontSize * lineHeight,
            fontSize: fontSize,
          },
          h2: { fontSize: fontSize * 1.5 },
        }}
        onHTMLLoaded={onLoaded}
      />
    )
  },
)
