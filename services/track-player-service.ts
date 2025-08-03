import TrackPlayer, {
  AppKilledPlaybackBehavior,
  Capability,
  RepeatMode,
  Event,
} from 'react-native-track-player'

class TrackPlayerService {
  private static instance: TrackPlayerService
  private isSetupComplete = false

  static getInstance(): TrackPlayerService {
    if (!TrackPlayerService.instance) {
      TrackPlayerService.instance = new TrackPlayerService()
    }
    return TrackPlayerService.instance
  }

  async setupPlayer(): Promise<boolean> {
    if (this.isSetupComplete) {
      return true
    }

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

      this.isSetupComplete = true
      return true
    } catch (error) {
      console.error('Error setting up TrackPlayer:', error)
      return false
    }
  }

  async reset(): Promise<void> {
    try {
      await TrackPlayer.reset()
    } catch (error) {
      console.error('Error resetting TrackPlayer:', error)
    }
  }

  async addTracks(tracks: Array<{ id: string; url: string; title: string; artist?: string }>): Promise<void> {
    try {
      await TrackPlayer.add(tracks)
    } catch (error) {
      console.error('Error adding tracks:', error)
      throw error
    }
  }

  async skipToTrack(trackIndex: number): Promise<void> {
    try {
      await TrackPlayer.skip(trackIndex)
    } catch (error) {
      console.error('Error skipping to track:', error)
      throw error
    }
  }

  async play(): Promise<void> {
    try {
      await TrackPlayer.play()
    } catch (error) {
      console.error('Error playing:', error)
      throw error
    }
  }

  async pause(): Promise<void> {
    try {
      await TrackPlayer.pause()
    } catch (error) {
      console.error('Error pausing:', error)
      throw error
    }
  }

  async skipToNext(): Promise<void> {
    try {
      await TrackPlayer.skipToNext()
    } catch (error) {
      console.error('Error skipping to next:', error)
      throw error
    }
  }

  async skipToPrevious(): Promise<void> {
    try {
      await TrackPlayer.skipToPrevious()
    } catch (error) {
      console.error('Error skipping to previous:', error)
      throw error
    }
  }

  async setRepeatMode(mode: RepeatMode): Promise<void> {
    try {
      await TrackPlayer.setRepeatMode(mode)
    } catch (error) {
      console.error('Error setting repeat mode:', error)
    }
  }

  async getCurrentTrack(): Promise<number | undefined> {
    try {
      return await TrackPlayer.getActiveTrackIndex()
    } catch (error) {
      console.error('Error getting current track:', error)
      return undefined
    }
  }
}

export default TrackPlayerService
