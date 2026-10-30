# Add long-form audio playback

ID: audio-playback
Targets: web, ios, android, macos
Related APIs: `@octane-xplat/audio`, `createAudioPlayer`, `AudioPlayer`, `AudioCapabilities`

## Starting point

A scaffolded app that needs a local or remote audio queue, progress, transport
controls, and capability-based background playback, system controls, and
interruption handling.

## Requirements

- Handle play rejection, loading, progress, queue advancement, and disposal.
- Read `capabilities()` before offering background/system controls.
- Keep browser autoplay and target-specific background playback limits visible.
- Coordinate audio focus/session policy so UI sound effects do not stop long-form
  playback or change its output route.

## Acceptance criteria

- AC1: The app loads a local or remote track, plays, pauses, seeks, and observes progress.
- AC2: End-of-track advances the queue, and disposal releases playback resources.
- AC3: iOS and Android playback continues in background and exposes lock-screen/system
  controls, including queue transport actions where supported.
- AC4: iOS and Android interruptions pause or resume playback according to the
  interruption event, and effects do not take media focus or change the route.
- AC5: Web reports browser-dependent system controls and does not claim mobile
  background-playback parity.
- AC6: On macOS, replacing the queue cancels obsolete loads; malformed media,
  network failures, and reported output failures become terminal errors. Disposal
  stops the owned player and notifications. System controls and interruption
  recovery are reported unavailable, and audible playback remains a separate check.

- AC7: Set playback speed (0.5×–3×), volume (0–1), and mute independently; settings survive source replacement and pause/resume. Nonfinite numeric settings reject without changing the prior setting.

- AC8: Update future queue items without reloading the matching current ID/source; distinguish incomplete waiting from final completion, and cancel waiting auto-resume on explicit pause.

## Documentation

- AC1: [Long-form audio](../../../docs/platform/media-services.md#long-form-audio).
- AC2: [Long-form audio](../../../docs/platform/media-services.md#long-form-audio). [Two-track probe](../../../packages/app/src/MediaServices.tsrx) and [nonvisual browser checks](../../../apps/web/scripts/optional-services.ts) exercise advancement and teardown.
- AC3: [Long-form audio](../../../docs/platform/media-services.md#long-form-audio) and [integration checks](../../../docs/platform/media-services.md#check-your-integration) cover enabling iOS audio background mode and checking lock-screen/notification metadata and controls. The [two-track probe](../../../packages/app/src/MediaServices.tsrx) provides queue state; [qualification boundaries](../notes/optional-service-qualification.md) separate native runtime checks from setup coverage.
- AC4: [Long-form audio](../../../docs/platform/media-services.md#long-form-audio) and [integration checks](../../../docs/platform/media-services.md#check-your-integration) cover real audio interruptions and effect/player coexistence. [Qualification boundaries](../notes/optional-service-qualification.md) track pending physical interruption and route measurements.
- AC5: [Validation status](../../../docs/platform/media-services.md#validation-status).
- AC6: [macOS playback](../../../docs/platform/media-services.md#macos-playback) and the [packed macOS target check](../../../packages/audio/tests/verify-macos.mjs). Gap: audible output and physical output-device failures require hardware qualification.
- AC7: [Playback speed and volume](../../../docs/platform/media-services.md#playback-speed-and-volume) and the [shared settings controls](../../../packages/app/src/MediaServices.tsrx).
- AC8: [Growing queues](../../../docs/platform/media-services.md#add-items-without-restarting-the-current-track). Gap: physical background continuation with delayed appends requires separate target qualification.

The [packed listening/settings check](../../../tools/native-readiness/README.md)
combines these services in an external mobile consumer. Its synthetic auth and
silent foreground media do not close physical background, output, restart,
or provider callback gates; see the [readiness record](../notes/still-native-readiness.md).
