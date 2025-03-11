import React, { useCallback, useEffect, useRef, useState } from 'react'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { AppPalette } from '@/assets'
import { VectorIcon } from '@/components/Icon'
import { convertTTS, splitContentToParagraph } from '@/services/convert-tts'
import { AppTypo } from '@/constants'
import TrackPlayer, { useTrackPlayerEvents, Event, useIsPlaying } from 'react-native-track-player'

export type PlayTTSRef = {
  show: () => void
  hide: () => void
}

export type PlayTTSProps = {
  name: string
  chapterHtml: string
  innerRef: React.MutableRefObject<PlayTTSRef | undefined>
  onChange: (showPlayer: boolean) => void
}

const PlayTTS = ({ name, chapterHtml, innerRef, onChange }: PlayTTSProps) => {
  const [currentIndexParagraph, setCurrentIndexParagraph] = useState(-1)
  const [paragraphs, setParagraphs] = useState<string[]>([])
  const [showPlayer, setShowPlayer] = useState(false)
  const isPlaying = useIsPlaying()
  const refUrls = useRef<string[]>([])

  const show = useCallback(() => setShowPlayer(true), [])
  const hide = useCallback(() => setShowPlayer(false), [])

  useEffect(() => {
    innerRef.current = { show, hide }
  }, [])

  useTrackPlayerEvents([Event.PlaybackActiveTrackChanged, Event.PlaybackQueueEnded], (event) => {
    console.log(event)
    if (event.type === Event.PlaybackActiveTrackChanged && event.index !== undefined) {
      setCurrentIndexParagraph(event.index)
      getTrackOfIndex(event.index + 1)
    }
    if (event.type === Event.PlaybackQueueEnded) {
      hide()
    }
  })

  useEffect(() => {
    const splitText = splitContentToParagraph(chapterHtml.replace(/<[^>]*>?/g, '\n'))
    setParagraphs(splitText)
  }, [chapterHtml])

  useEffect(() => {
    onChange(showPlayer)
    if (showPlayer) play()
    else {
      TrackPlayer.stop()
      refUrls.current = []
      setCurrentIndexParagraph(-1)
    }
  }, [showPlayer])

  const play = async () => {
    await TrackPlayer.reset()
    getTrackOfIndex(0)
    TrackPlayer.play()
  }

  const getTrackOfIndex = useCallback(
    (index: number) => {
      if (index >= paragraphs.length) return
      convertTTS(paragraphs[index]).then((url) => {
        if (!url) return
        if (refUrls.current.includes(url)) return
        refUrls.current.push(url)
        console.log(index, url)
        TrackPlayer.add({
          id: index,
          url: url,
          title: `${name} - ${index + 1}`,
        })
      })
    },
    [paragraphs, name],
  )

  const pause = useCallback(() => TrackPlayer.pause(), [])
  const resume = useCallback(() => TrackPlayer.play(), [])
  const next = useCallback(() => TrackPlayer.skipToNext(), [])
  const previous = useCallback(() => TrackPlayer.skipToPrevious(), [])

  if (!showPlayer) return null

  return (
    <View style={styles.container}>
      <VectorIcon
        name={'backward'}
        font="FontAwesome6"
        size={16}
        buttonStyle={{ width: 32, height: 32 }}
        color={AppPalette.white}
        onPress={previous}
      />
      {currentIndexParagraph === -1 ? (
        <ActivityIndicator style={{ width: 32, height: 32 }} color={AppPalette.white} />
      ) : (
        <VectorIcon
          name={isPlaying.playing ? 'pause' : 'play'}
          font="FontAwesome6"
          size={16}
          buttonStyle={{ width: 32, height: 32 }}
          color={AppPalette.white}
          onPress={isPlaying.playing ? pause : resume}
        />
      )}
      <VectorIcon
        name={'forward'}
        font="FontAwesome6"
        size={16}
        buttonStyle={{ width: 32, height: 32 }}
        color={AppPalette.white}
        onPress={next}
      />
      <Text
        style={[
          AppTypo.headline.semiBold,
          { width: 44, textAlign: 'center', color: AppPalette.white },
        ]}>
        {currentIndexParagraph + 1}/{paragraphs.length}
      </Text>
    </View>
  )
}

export default React.memo(PlayTTS)

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    bottom: 12,
    backgroundColor: AppPalette.gray400,
    height: 40,
    position: 'absolute',
    borderRadius: 100,
    alignSelf: 'center',
    paddingHorizontal: 16,
  },
})
