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
      console.log('🎵 [TrackPlayer] Already setup, skipping')
      return true
    }

    try {
      console.log('🎵 [TrackPlayer] Setting up player...')
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
      console.log('🎵 [TrackPlayer] Setup completed successfully')
      return true
    } catch (error) {
      console.error('🎵 [TrackPlayer] Error setting up:', error)
      return false
    }
  }

  async reset(): Promise<void> {
    try {
      console.log('🎵 [TrackPlayer] Resetting player...')
      await TrackPlayer.reset()
      console.log('🎵 [TrackPlayer] Reset completed')
    } catch (error) {
      console.error('🎵 [TrackPlayer] Error resetting:', error)
    }
  }

  async addTracks(tracks: Array<{ id: string; url: string; title: string; artist?: string }>): Promise<void> {
    try {
      console.log('🎵 [TrackPlayer] Adding tracks:', tracks.length)
      tracks.forEach((track, index) => {
        console.log(`🎵 [TrackPlayer] Track ${index}: ${track.title} - ${track.url}`)
      })
      
      await TrackPlayer.add(tracks)
      console.log('🎵 [TrackPlayer] Tracks added successfully')
      
      // Get queue to verify
      const queue = await TrackPlayer.getQueue()
      console.log('🎵 [TrackPlayer] Current queue length:', queue.length)
    } catch (error) {
      console.error('🎵 [TrackPlayer] Error adding tracks:', error)
      throw error
    }
  }

  async skipToTrack(trackIndex: number): Promise<void> {
    try {
      console.log('🎵 [TrackPlayer] Skipping to track:', trackIndex)
      await TrackPlayer.skip(trackIndex)
      console.log('🎵 [TrackPlayer] Skipped to track:', trackIndex)
    } catch (error) {
      console.error('🎵 [TrackPlayer] Error skipping to track:', error)
      throw error
    }
  }

  async play(): Promise<void> {
    try {
      console.log('🎵 [TrackPlayer] Playing...')
      await TrackPlayer.play()
      console.log('🎵 [TrackPlayer] Play command sent')
    } catch (error) {
      console.error('🎵 [TrackPlayer] Error playing:', error)
      throw error
    }
  }

  async pause(): Promise<void> {
    try {
      console.log('🎵 [TrackPlayer] Pausing...')
      await TrackPlayer.pause()
      console.log('🎵 [TrackPlayer] Pause command sent')
    } catch (error) {
      console.error('🎵 [TrackPlayer] Error pausing:', error)
      throw error
    }
  }

  async skipToNext(): Promise<void> {
    try {
      console.log('🎵 [TrackPlayer] Skipping to next...')
      await TrackPlayer.skipToNext()
      console.log('🎵 [TrackPlayer] Skip to next command sent')
    } catch (error) {
      console.error('🎵 [TrackPlayer] Error skipping to next:', error)
      throw error
    }
  }

  async skipToPrevious(): Promise<void> {
    try {
      console.log('🎵 [TrackPlayer] Skipping to previous...')
      await TrackPlayer.skipToPrevious()
      console.log('🎵 [TrackPlayer] Skip to previous command sent')
    } catch (error) {
      console.error('🎵 [TrackPlayer] Error skipping to previous:', error)
      throw error
    }
  }

  async setRepeatMode(mode: RepeatMode): Promise<void> {
    try {
      console.log('🎵 [TrackPlayer] Setting repeat mode:', mode)
      await TrackPlayer.setRepeatMode(mode)
      console.log('🎵 [TrackPlayer] Repeat mode set')
    } catch (error) {
      console.error('🎵 [TrackPlayer] Error setting repeat mode:', error)
    }
  }

  async getCurrentTrack(): Promise<number | undefined> {
    try {
      const trackIndex = await TrackPlayer.getActiveTrackIndex()
      console.log('🎵 [TrackPlayer] Current track index:', trackIndex)
      return trackIndex
    } catch (error) {
      console.error('🎵 [TrackPlayer] Error getting current track:', error)
      return undefined
    }
  }
}

export default TrackPlayerService
