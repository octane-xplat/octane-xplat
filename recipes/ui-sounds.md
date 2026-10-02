# Add UI sound effects

ID: ui-sounds
Targets: web, ios, android
Related APIs: `@octane-xplat/sounds`, `createSoundBank`, `SoundBank`

## Starting point

A scaffolded app with short interaction sounds such as confirmation, arrival,
or warning effects. Long-form listening belongs to `@octane-xplat/audio`.

## Requirements

- Call `load()` before effects are needed and set a global voice limit. On Web,
  this prepares media metadata; browsers may defer buffering until `play()`.
- Use per-play volume and stop effects during owner cleanup.
- Account for browser user-gesture restrictions and keep effects from taking long-form media focus.

## Acceptance criteria

- AC1: The app loads an effect and plays it with an explicit volume.
- AC2: Overlapping playback never exceeds the configured voice limit and can be stopped.
- AC3: The app handles user-gesture playback restrictions and disposes its sound bank.
- AC4: Playing, stopping, or disposing effects does not interrupt long-form playback or change its output route.

## Documentation

- AC1: [UI sounds](../docs/platform/media-services.md#ui-sounds).
- AC2: [UI sounds](../docs/platform/media-services.md#ui-sounds).
- AC3: [UI sounds](../docs/platform/media-services.md#ui-sounds).
- AC4: [Long-form audio](../docs/platform/media-services.md#long-form-audio). [Integration checks](../docs/platform/media-services.md#check-your-integration) provide the coexistence procedure; [qualification boundaries](../docs/notes/optional-service-qualification.md) track pending physical route evidence.
