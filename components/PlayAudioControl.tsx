import { AppPalette } from '@/assets'
import { VectorIcon } from '@/components/Icon'
import { AppTypo } from '@/constants'
import React from 'react'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'

interface PlayAudioControlProps {
  currentIndex: number | null
  maxIndex: number
  handlePrevious: () => void
  handleNext: () => void
  handlePlayPause: () => void
  isPlaying: boolean
}

export default function PlayAudioControl({
  currentIndex,
  maxIndex,
  handlePrevious,
  handleNext,
  handlePlayPause,
  isPlaying,
}: PlayAudioControlProps) {
  return (
    <View style={styles.ttsContainer}>
      <Text style={[AppTypo.caption.medium, styles.progressText]}>
        {currentIndex !== null ? currentIndex + 1 : '-'} / {maxIndex}
      </Text>
      {maxIndex === 0 ? (
        <ActivityIndicator size={'small'} color={'#FFF'} style={{ paddingVertical: 4 }} />
      ) : (
        <>
          <VectorIcon
            name={'backward'}
            font="FontAwesome6"
            size={16}
            buttonStyle={{ width: 32, height: 32 }}
            color={AppPalette.white}
            onPress={handlePrevious}
          />
          <VectorIcon
            name={isPlaying ? 'pause' : 'play'}
            font="FontAwesome6"
            size={16}
            buttonStyle={{ width: 32, height: 32 }}
            color={AppPalette.white}
            onPress={handlePlayPause}
          />
          <VectorIcon
            name={'forward'}
            font="FontAwesome6"
            size={16}
            buttonStyle={{ width: 32, height: 32 }}
            color={AppPalette.white}
            onPress={handleNext}
          />
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  ttsContainer: {
    backgroundColor: AppPalette.gray400,
    borderRadius: 100,
    flexDirection: 'row',
    alignSelf: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 16,
    gap: 8,
  },
  progressText: {
    color: AppPalette.white,
    marginRight: 8,
  },
})
