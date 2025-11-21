import { AppPalette } from '@/assets'
import { VectorIcon } from '@/components/Icon'
import { AppTypo } from '@/constants'
import { audioPlayerService } from '@/services/audio-player.service'
import React, { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, DeviceEventEmitter, StyleSheet, Text, View } from 'react-native'
import TrackPlayer, {
  Event,
  State,
  useIsPlaying,
  useTrackPlayerEvents,
} from 'react-native-track-player'

function PlayAudioControl() {
  const isPlaying = useIsPlaying().playing
  const [currentIndex, setCurrentIndex] = useState<number | null>(null)
  const [maxIndex, setMaxIndex] = useState<number | null>(null)

  const handlePlayPause = useCallback(async () => {
    if (isPlaying) {
      await audioPlayerService.pause()
    } else {
      await audioPlayerService.play()
    }
  }, [isPlaying])

  const handlePrevious = useCallback(() => {
    audioPlayerService.skipToPrevious()
  }, [])

  const handleNext = useCallback(() => {
    audioPlayerService.skipToNext()
  }, [])

  useTrackPlayerEvents([Event.PlaybackActiveTrackChanged], (event) => {
    if (event.type === Event.PlaybackActiveTrackChanged && event.index !== undefined) {
      setCurrentIndex(event.index)
    }
  })

  useTrackPlayerEvents([Event.PlaybackState], (event) => {
    if (event.type === Event.PlaybackState) {
      if (event.state === State.Paused || event.state === State.Stopped) {
        setCurrentIndex(null)
      }
    }
  })

  useEffect(() => {
    const unsubscribe = DeviceEventEmitter.addListener('trackPlayerTracksAdded', () => {
      TrackPlayer.getQueue().then((queue) => {
        setMaxIndex(queue.length - 1)
      })
    })
    return () => unsubscribe.remove()
  }, [])

  return (
    <View style={styles.ttsContainer}>
      <Text style={[AppTypo.caption.medium, styles.progressText]}>
        {currentIndex !== null ? currentIndex + 1 : '-'} / {maxIndex ?? '-'}
      </Text>
      <>
        <VectorIcon
          name={'backward'}
          font="FontAwesome6"
          size={16}
          buttonStyle={{ width: 28, height: 28 }}
          color={AppPalette.white}
          onPress={handlePrevious}
        />
        <VectorIcon
          name={isPlaying ? 'pause' : 'play'}
          font="FontAwesome6"
          size={16}
          buttonStyle={{ width: 28, height: 28 }}
          color={AppPalette.white}
          onPress={handlePlayPause}
        />
        <VectorIcon
          name={'forward'}
          font="FontAwesome6"
          size={16}
          buttonStyle={{ width: 28, height: 28 }}
          color={AppPalette.white}
          onPress={handleNext}
        />
      </>
    </View>
  )
}

export default React.memo(PlayAudioControl)

const styles = StyleSheet.create({
  ttsContainer: {
    backgroundColor: AppPalette.gray400,
    borderRadius: 100,
    flexDirection: 'row',
    alignSelf: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 4,
  },
  progressText: {
    color: AppPalette.white,
    marginRight: 8,
  },
})
