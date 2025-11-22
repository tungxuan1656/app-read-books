import { AppConst } from '@/constants'
import useAppStore from '@/controllers/store'
import React from 'react'
import RenderHTML from 'react-native-render-html'

export const ContentDisplay = React.memo(
  ({ chapterHtml, onLoaded }: { chapterHtml: string; onLoaded?: () => void }) => {
    const { font, fontSize, lineHeight } = useAppStore((state) => state.typography)

    return (
      <RenderHTML
        source={{ html: chapterHtml, baseUrl: '' }}
        baseStyle={{ flex: 1, marginHorizontal: 16, marginBottom: 80 }}
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
          'Montserrat-Medium',
          'MontserratAlternates-Medium',
          'MontserratAlternates-Regular',
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
