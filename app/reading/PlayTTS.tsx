import React, { useCallback, useEffect, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
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
  const [currentIndexParagraph, setCurrentIndexParagraph] = useState(0)
  const [paragraphs, setParagraphs] = useState<string[]>([])
  const [showPlayer, setShowPlayer] = useState(false)
  const isPlaying = useIsPlaying()

  useTrackPlayerEvents([Event.PlaybackActiveTrackChanged, Event.PlaybackQueueEnded], (event) => {
    console.log(event)
    if (event.type === Event.PlaybackActiveTrackChanged) {
      if (event.index !== undefined) {
        setCurrentIndexParagraph(event.index)
        getTrackOfIndex(event.index + 1)
      }
      else {
        hide()
      }
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
    if (showPlayer) {
      play()
    }
  }, [showPlayer])

  useEffect(() => {
    innerRef.current = { show, hide }
  }, [])

  const show = useCallback(() => {
    setShowPlayer(true)
  }, [])

  const hide = useCallback(() => {
    TrackPlayer.stop()
    setShowPlayer(false)
  }, [])

  const play = async () => {
    await TrackPlayer.reset()
    getTrackOfIndex(0)
    TrackPlayer.play()
  }

  const pause = useCallback(async () => {
    TrackPlayer.pause()
  }, [])

  const resume = useCallback(async () => {
    TrackPlayer.play()
  }, [])

  const next = useCallback(async () => {
    TrackPlayer.skipToNext()
  }, [])

  const previous = useCallback(async () => {
    TrackPlayer.skipToPrevious()
  }, [])

  const getTrackOfIndex = useCallback(
    (index: number) => {
      console.log('getTrackOfIndex', index)
      if (index >= paragraphs.length) return
      convertTTS(paragraphs[index]).then((url) => {
        if (!url) return
        TrackPlayer.add({
          id: index,
          url: url,
          title: `${name} - ${index + 1}`,
        })
      })
    },
    [paragraphs, name],
  )

  if (!showPlayer) return null

  return (
    <View style={styles.container}>
      <VectorIcon
        name={'backward'}
        font="FontAwesome6"
        size={16}
        buttonStyle={{ width: 32, height: 32 }}
        color={AppPalette.gray600}
        onPress={previous}
      />
      <VectorIcon
        name={isPlaying.playing ? 'pause' : 'play'}
        font="FontAwesome6"
        size={16}
        buttonStyle={{ width: 32, height: 32 }}
        color={AppPalette.gray600}
        onPress={isPlaying.playing ? pause : resume}
      />
      <VectorIcon
        name={'forward'}
        font="FontAwesome6"
        size={16}
        buttonStyle={{ width: 32, height: 32 }}
        color={AppPalette.gray600}
        onPress={next}
      />
      <Text style={[AppTypo.headline.semiBold, { width: 44, textAlign: 'center' }]}>
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
    backgroundColor: AppPalette.gray100,
    height: 40,
    position: 'absolute',
    borderRadius: 100,
    alignSelf: 'center',
    paddingHorizontal: 16,
  },
})
