import React from 'react'
import { StyleSheet, View } from 'react-native'
import PlayAudioControl from '../PlayAudioControl'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function ReadingAudioControl() {
  const insets = useSafeAreaInsets()

  return (
    <View style={[styles.viewContainer, { bottom: 12 + insets.bottom }]}>
      <PlayAudioControl
        currentIndex={0}
        maxIndex={1}
        handlePrevious={() => {}}
        handleNext={() => {}}
        handlePlayPause={() => {}}
        isPlaying={false}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  viewContainer: {
    flexDirection: 'row',
    paddingHorizontal: 2,
    position: 'absolute',
    left: 12,
    alignSelf: 'center',
    marginRight: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
})
