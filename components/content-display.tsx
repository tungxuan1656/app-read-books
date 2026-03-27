import React from 'react'
import RenderHTML from 'react-native-render-html'

import { AppConst } from '@/constants'
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
        systemFonts={[
          'Arial',
          'Georgia',
          'Inter',
          'Lato',
          'Lora',
          'Merriweather',
          'Montserrat',
          'MontserratAlternates',
          'NotoSans',
          'NotoSerif',
          'OpenSans',
          'PTSans',
          'PTSerif',
          'Raleway',
          'Roboto',
          'SpaceMono',
          'TimesNewRoman',
          'Verdana',
          'WorkSans',
        ]}
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
