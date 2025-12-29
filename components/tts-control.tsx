import { AppPalette } from '@/assets'
import { AppTypo } from '@/constants'
import { useTTSPlayer } from '@/hooks/use-tts-player'
import React from 'react'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { VectorIcon } from './vector-icon'

interface TTSControlProps {
  content: string
  bookId: string
  chapterIndex: number
}

const TTSControl = ({ content, bookId, chapterIndex }: TTSControlProps) => {
  const {
    isConverting,
    isPlaying,
    currentSentenceIndex,
    totalSentences,
    isReady,
    startTTS,
    stopTTS,
    togglePlayPause,
    nextSentence,
    previousSentence,
  } = useTTSPlayer(content, bookId, chapterIndex)

  if (!isReady) {
    return (
      <VectorIcon
        name="volume-high"
        font="FontAwesome6"
        size={12}
        color={AppPalette.white}
        buttonStyle={styles.iconButton}
        onPress={startTTS}
      />
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.controls}>
        <VectorIcon
          name="backward"
          font="FontAwesome6"
          size={14}
          color={AppPalette.white}
          buttonStyle={styles.controlButton}
          onPress={previousSentence}
        />
        
        {isConverting && totalSentences === 0 ? (
          <ActivityIndicator size="small" color={AppPalette.white} />
        ) : (
          <VectorIcon
            name={isPlaying ? 'pause' : 'play'}
            font="FontAwesome6"
            size={14}
            color={AppPalette.white}
            buttonStyle={styles.controlButton}
            onPress={togglePlayPause}
          />
        )}

        <VectorIcon
          name="forward"
          font="FontAwesome6"
          size={14}
          color={AppPalette.white}
          buttonStyle={styles.controlButton}
          onPress={nextSentence}
        />

        <VectorIcon
          name="stop"
          font="FontAwesome6"
          size={14}
          color={AppPalette.white}
          buttonStyle={styles.controlButton}
          onPress={stopTTS}
        />
      </View>
      
      <Text style={styles.progressText}>
        {currentSentenceIndex + 1} / {totalSentences || '?'}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppPalette.gray400,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
    gap: 8,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: AppPalette.gray300,
    borderRadius: 100,
  },
  controlButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressText: {
    ...AppTypo.caption.medium,
    color: AppPalette.white,
    fontSize: 10,
    minWidth: 40,
    textAlign: 'center',
  },
})

export default React.memo(TTSControl)
