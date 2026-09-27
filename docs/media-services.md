# Media Services

> Add advanced haptics, short UI sounds, or long-form playback as separate
> optional packages; check each target's capability report before relying on
> platform behavior.

Install only the service packages the app uses:

```sh
pnpm add @octane-xplat/haptics @octane-xplat/sounds @octane-xplat/audio
```

The packages own their npm and Android plugin dependencies; NativeScript iOS
still needs app-level Pulsar Swift package and source configuration. No new
dependency is added to `@octane-xplat/ui`, and the existing
`@octane-xplat/platform` basic haptics API does not change. The two
haptics APIs serve different needs: `platform.haptics` keeps impact,
notification, and selection feedback; `@octane-xplat/haptics` adds named
presets, timed patterns, gesture-driven control, cancellation, and capability
reporting.

Native Android apps using the Pulsar-backed advanced haptics package must
compile against Android API 36 or later for Pulsar 1.3.0; the app target SDK
and minimum supported Android version remain separate settings. The harness
uses compile SDK 36, target SDK 35, and minimum SDK 24. Pulsar supports Android
API 24+ at runtime.
On iOS, add Pulsar 1.4.0 to the app's
`ios.SPMPackages` and the package's
`platforms/ios/src/**/*.swift` to `ios.NativeSource` in NativeScript
configuration; NativeScript does not discover either integration from a leaf
package automatically.

## Advanced haptics

Create one haptics service for the view or interaction owner and dispose it
when that owner is removed. Check `capabilities()` first. Native builds use
Pulsar 1.4.0 on iOS and 1.3.0 on Android; Android hardware can fall back to
reduced timing or amplitude support. Web uses `navigator.vibrate` when
available. It cannot provide continuous realtime haptics, and iOS Safari does
not expose Web Vibration.

Custom pattern points use milliseconds from the start and normalized values
from 0 to 1. A `HapticSession` returned by `startRealtime()` is scoped to a
gesture; call `stop()` on release or cancellation and `dispose()` at teardown.
The native Pulsar bridge and physical tactile output still need device-level
verification.

## UI sounds

Use `createSoundBank({ maxVoices })` for short effects. `load(name, source)`
prepares a sound; `play(name, { volume })` uses a clamped per-play volume, and
`stop(name?)` stops one sound or every effect. The voice limit is a hard cap;
when full, the oldest active effect is stopped before the next starts. Call
`dispose()` when the owning screen or service ends. Native playback uses one
`@nativescript/audio-context` context with reusable decoded buffers and a gain
node per voice; the web backend uses preloaded HTML audio. It is pinned to the
stable `1.3.3` release, already present in the workspace's NativeScript probe.

Web browsers can reject preload or play until the user interacts with the
page. Check `capabilities().userGestureRequired`; a failed `play()` resolves to
`false`. Effects must stay transient: they do not own media focus or change the
long-form player's route.

## Long-form audio

`createAudioPlayer()` accepts local or remote `Track` sources, queue metadata,
play/pause/seek, state subscriptions, and queue advancement. Always handle a
rejected `play()` promise: browsers can block autoplay, remote requests can
fail, and local paths may not be readable by the platform player.

The NativeScript implementation uses a package-owned Android Media3
`MediaSessionService` and iOS `AVPlayer` with Now Playing metadata and remote
transport commands. It reports background playback, system controls, and
interruption handling as available on native. Android playback and the Media3
session were exercised on the xplat emulator; notification/headset controls,
background continuation, interruption recovery, and physical audio output
still need device verification. iOS native compilation is blocked before the
audio adapter by duplicate `QBImagePickerController` CocoaPods declarations.
The Web Media Session API can expose browser system controls when present, but
the package does not claim background playback parity.

The intended ownership boundary is one long-form audio service per app media
session. That service owns audio focus/session policy; short effects remain
bounded and must not interrupt music or change its output route. The sound
backend no longer uses `@nativescript-community/audio`'s player-per-voice path,
which changed the iOS session category while loading and deactivated it on
disposal. Android now uses a package-owned Media3 `MediaSessionService`, with
the app target's media-playback foreground-service declarations merged by
NativeScript. iOS uses AVPlayer with Now Playing metadata, remote transport
commands, interruption observation, and the app's audio background mode. Both
platform adapters are implemented, but route and interruption coexistence with
short effects still need device verification.

## Validation status

All three packages build for web and native. On the Android emulator, the
harness loaded through the CLI's non-HMR bundle path; Media3 playback moved
through `playing` and `ended`, pause and seek updated state, and the active
session exposed the expected `Sample audio` metadata. Pulsar capability lookup,
preset, pattern, and realtime start/stop calls ran without runtime exceptions.
The UI sound and overlap actions also ran without exceptions while the player
session stayed active. The emulator has audio output disabled and no physical
haptic actuator, so audible output, overlapping sound, tactile output, and
effect/player route coexistence are not proven. Background continuation and
system transport controls remain unverified. iOS preparation is blocked before
its adapter compiles by duplicate `QBImagePickerController` CocoaPods
declarations. See
[platform-service notes](platform-notes.md#haptics-ui-sounds-and-media-playback)
for the current evidence and limits.
