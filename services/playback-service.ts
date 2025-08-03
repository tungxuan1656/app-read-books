import TrackPlayer, { Event } from 'react-native-track-player'

module.exports = async function() {
    TrackPlayer.addEventListener(Event.RemotePause, () => {
        console.log('🎵 [Service] Remote pause')
        TrackPlayer.pause()
    })

    TrackPlayer.addEventListener(Event.RemotePlay, () => {
        console.log('🎵 [Service] Remote play')
        TrackPlayer.play()
    })

    TrackPlayer.addEventListener(Event.RemoteNext, () => {
        console.log('🎵 [Service] Remote next')
        TrackPlayer.skipToNext()
    })

    TrackPlayer.addEventListener(Event.RemotePrevious, () => {
        console.log('🎵 [Service] Remote previous')
        TrackPlayer.skipToPrevious()
    })
}
