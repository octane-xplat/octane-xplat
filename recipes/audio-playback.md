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

- AC1: [Long-form audio](../docs/platform/media-services.md#long-form-audio).
- AC2: [Long-form audio](../docs/platform/media-services.md#long-form-audio). [Two-track probe](../packages/app/src/MediaServices.tsrx) and [nonvisual browser checks](../apps/web/scripts/optional-services.mjs) exercise advancement and teardown.
- AC3: [Long-form audio](../docs/platform/media-services.md#long-form-audio) and [integration checks](../docs/platform/media-services.md#check-your-integration) cover enabling iOS audio background mode and checking lock-screen/notification metadata and controls. The [two-track probe](../packages/app/src/MediaServices.tsrx) provides queue state; [qualification boundaries](../docs/notes/optional-service-qualification.md) separate native runtime checks from setup coverage.
- AC4: [Long-form audio](../docs/platform/media-services.md#long-form-audio) and [integration checks](../docs/platform/media-services.md#check-your-integration) cover real audio interruptions and effect/player coexistence. [Qualification boundaries](../docs/notes/optional-service-qualification.md) track pending physical interruption and route measurements.
- AC5: [Validation status](../docs/platform/media-services.md#validation-status).
