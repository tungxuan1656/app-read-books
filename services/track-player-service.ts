import TrackPlayer, {
  AppKilledPlaybackBehavior,
  Capability,
  RepeatMode,
} from 'react-native-track-player'

const setupPlayer = async (): Promise<boolean> => {
  try {
    await TrackPlayer.setupPlayer({
      maxCacheSize: 1024 * 10, // 10MB cache
    })

    await TrackPlayer.updateOptions({
      android: {
        appKilledPlaybackBehavior: AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
      },
      capabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
        Capability.SeekTo,
      ],
      compactCapabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
      ],
      progressUpdateEventInterval: 1,
    })

    console.log('🎵 [TrackPlayer] Setup completed successfully')
    return true
  } catch (error) {
    console.error('🎵 [TrackPlayer] Error setting up:', error)
    return false
  }
}

const reset = async (): Promise<void> => {
  try {
    await TrackPlayer.stop()
    await TrackPlayer.reset()
  } catch (error) {
    console.error('🎵 [TrackPlayer] Error resetting:', error)
  }
}

const addTracks = async (
  tracks: Array<{ id: string; url: string; title: string; artist?: string }>,
): Promise<void> => {
  try {
    await TrackPlayer.add(tracks)
  } catch (error) {
    console.error('🎵 [TrackPlayer] Error adding tracks:', error)
    throw error
  }
}

const skipToTrack = async (trackIndex: number): Promise<void> => {
  try {
    await TrackPlayer.skip(trackIndex)
  } catch (error) {
    console.error('🎵 [TrackPlayer] Error skipping to track:', error)
    throw error
  }
}

const play = async (): Promise<void> => {
  try {
    await TrackPlayer.play()
  } catch (error) {
    console.error('🎵 [TrackPlayer] Error playing:', error)
    throw error
  }
}

const pause = async (): Promise<void> => {
  try {
    await TrackPlayer.pause()
  } catch (error) {
    console.error('🎵 [TrackPlayer] Error pausing:', error)
    throw error
  }
}

const skipToNext = async (): Promise<void> => {
  try {
    await TrackPlayer.skipToNext()
  } catch (error) {
    console.error('🎵 [TrackPlayer] Error skipping to next:', error)
    throw error
  }
}

const skipToPrevious = async (): Promise<void> => {
  try {
    await TrackPlayer.skipToPrevious()
  } catch (error) {
    console.error('🎵 [TrackPlayer] Error skipping to previous:', error)
    throw error
  }
}

const setRepeatMode = async (mode: RepeatMode): Promise<void> => {
  try {
    await TrackPlayer.setRepeatMode(mode)
  } catch (error) {
    console.error('🎵 [TrackPlayer] Error setting repeat mode:', error)
  }
}

const getCurrentTrack = async (): Promise<number | undefined> => {
  try {
    const trackIndex = await TrackPlayer.getActiveTrackIndex()
    return trackIndex
  } catch (error) {
    console.error('🎵 [TrackPlayer] Error getting current track:', error)
    return undefined
  }
}

const setRate = async (rate: number): Promise<void> => {
  try {
    await TrackPlayer.setRate(rate)
  } catch (error) {
    console.error('🎵 [TrackPlayer] Error setting playback rate:', error)
  }
}

const trackPlayerService = {
  setupPlayer,
  reset,
  addTracks,
  skipToTrack,
  play,
  pause,
  skipToNext,
  skipToPrevious,
  setRepeatMode,
  getCurrentTrack,
  setRate,
}

export default trackPlayerService
