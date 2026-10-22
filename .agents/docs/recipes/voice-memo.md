# Record a voice memo to WAV

ID: voice-memo
Targets: web, ios, android, macos
Related APIs: @octane-xplat/recorder, createAudioRecorder, AudioRecorder, RecordingResult

## Starting point

An Xplat app with an app-owned Record and Stop action. Native targets have
microphone privacy declarations. The app owns finished recordings and deletion.

## Requirements

Record a foreground voice memo, handle refusal and interruptions, then use a
complete PCM WAV file or discard the unfinished take.

## Acceptance criteria

- AC1: The reader can install the recorder, configure target privacy requirements, and distinguish undetermined, granted, denied, unavailable and unsupported access without showing recording while permission is pending.
- AC2: The reader can start, pause, resume explicitly after interruption recovery, and observe duration and metering without promising background capture or automatic resumption.
- AC3: Stop returns a finalized 16-bit PCM WAV with actual sample rate, channels and duration; empty, incomplete or failed output rejects and surfaces the error.
- AC4: Cancel, restart and dispose settle pending operations and release the microphone; only the current unfinished take is discarded, while completed result files remain app-owned.

## Documentation

- AC1: [Microphone recording](../../../docs/platform/media-services.md#recording-audio) and [macOS setup](../../../packages/recorder/README.md#macos-setup-and-lifecycle). Gap: web/iOS/Android pending-authorization behavior and privacy setup need a dedicated workflow review.
- AC2: [Microphone recording](../../../docs/platform/media-services.md#recording-audio) and [macOS lifecycle](../../../packages/recorder/README.md#macos-setup-and-lifecycle). Gap: real microphone and input-removal qualification remains pending on macOS; mobile interruption behavior still needs device qualification.
- AC3: [MacOS finalization](../../../packages/recorder/README.md#macos-setup-and-lifecycle) and [voice-memo example](../../../examples/recorder/voice-memo.ts). Gap: macOS software tests validate output and failure handling; actual microphone WAV finalization and mobile failure paths remain unqualified.
- AC4: [Browser disposal](../../../packages/recorder/README.md), [web lifecycle regression](../../../packages/recorder/tests/web-lifecycle.test.mjs) (modeled browser interfaces; no OS microphone evidence), [MacOS lifecycle](../../../packages/recorder/README.md#macos-setup-and-lifecycle) and [voice-memo cleanup](../../../examples/recorder/voice-memo.ts). Gap: macOS filesystem/microphone release needs real-device qualification; mobile pending-operation cleanup has not been qualified.
