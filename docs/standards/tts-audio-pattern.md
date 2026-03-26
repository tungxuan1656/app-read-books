# TTS and Audio Pattern

## 1) Responsibilities

- `services/tts.service.ts`: TTS generation pipeline (CapCut WebSocket, chunking, cancellation).
- `services/audio-player.service.ts`: playback control and queue behavior (`react-native-track-player`).
- `hooks/use-tts-player.ts`: UI orchestration for playback + generation lifecycle.

## 2) Processing Rules

- Split long content into manageable chunks before TTS generation.
- Reuse cached audio segments whenever available.
- Keep cancellation support explicit (`stopConvertTTSCapcut` pattern).
- Do not block UI thread during generation loops.

## 3) Playback Rules

- Setup player once at app startup.
- Reset player and listeners when leaving flow or stopping session.
- Use explicit next/previous/stop controls from service.

## 4) Failure and Retry

- Handle WebSocket timeout and connection errors.
- Retry with bounded attempts for transient failures.
- Surface clear user-facing status when generation fails.

## 5) Checklist

- [ ] Chunking strategy applied before generation.
- [ ] Cache lookup precedes remote generation.
- [ ] Cancellation path works mid-process.
- [ ] Player reset/cleanup handled on unmount or stop.
- [ ] Error states are visible in UI.
