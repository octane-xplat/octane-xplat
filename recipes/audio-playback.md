# Add long-form audio playback

ID: audio-playback
Targets: web, ios, android
Related APIs: `@octane-xplat/audio`, `createAudioPlayer`, `AudioPlayer`, `AudioCapabilities`

## Starting point

A scaffolded app that needs a local or remote audio queue, progress, transport
controls, background playback, lock-screen/system controls, and interruption
handling.

## Requirements

- Handle play rejection, loading, progress, queue advancement, and disposal.
- Read `capabilities()` before offering background/system controls.
- Keep browser autoplay and target-specific background playback limits visible.
- Coordinate audio focus/session policy so UI sound effects do not stop long-form
  playback or change its output route.

## Acceptance criteria

- AC1: The app loads a local or remote track, plays, pauses, seeks, and observes progress.
- AC2: End-of-track advances the queue, and disposal releases playback resources.
- AC3: Native playback continues in background and exposes lock-screen/system
  controls, including queue transport actions where supported.
- AC4: iOS and Android interruptions pause or resume playback according to the
  interruption event, and effects do not take media focus or change the route.
- AC5: Web reports browser-dependent system controls and does not claim mobile
  background-playback parity.

## Documentation

- AC1: [Long-form audio](../docs/media-services.md#long-form-audio).
- AC2: [Long-form audio](../docs/media-services.md#long-form-audio). Gap: The maintained probe has one track; queue-end advancement and disposal checks are not demonstrated.
- AC3: [Long-form audio](../docs/media-services.md#long-form-audio) and [integration checks](../docs/media-services.md#check-your-integration) cover enabling iOS audio background mode and checking lock-screen/notification metadata and controls. Gap: The maintained probe has one track, and native background, system-control, and queue transport behavior still needs device evidence.
- AC4: [Long-form audio](../docs/media-services.md#long-form-audio) and [integration checks](../docs/media-services.md#check-your-integration) cover real audio interruptions and effect/player coexistence. Gap: Interruption recovery and route coexistence still need physical-device evidence.
- AC5: [Validation status](../docs/media-services.md#validation-status).
