# Media Services

> Add advanced haptics, short UI sounds, or long-form playback as separate
> optional packages; check each target's capability report before relying on
> platform behavior.

Choose the outcome first: a short sound after saving, tactile feedback for an
action, or playback that continues through a queue. Ask your agent to handle
unsupported features visibly and check the platform table for that package.
For [still capture](platform-services.md) or a
[live camera preview](primitives.md#when-a-screen-needs-more), use their separate guides.
The media support described here does not imply five-target parity.

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

Use the maintained [MediaServices screen](../packages/app/src/MediaServices.tsrx)
for package imports, preset/pattern calls, sound loading, player subscription,
and cleanup. It is an interaction probe, not a complete fallback UI. The
[harness native configuration](../apps/mobile/nativescript.config.ts) shows
Pulsar’s `SPMPackages` and `NativeSource` entries; adapt the workspace-relative
Swift path to your installed package location. Do not copy the harness app ID.

## Advanced haptics

Create one haptics service for the view or interaction owner and dispose it
when that owner is removed. Check `capabilities()` first. Native builds use
Pulsar 1.4.0 on iOS and 1.3.0 on Android; Android hardware can fall back to
reduced timing or amplitude support. Web uses `navigator.vibrate` when
available. It cannot provide continuous realtime haptics, and iOS Safari does
not expose Web Vibration.

Custom pattern points use milliseconds from the start and normalized values
from 0 to 1. A `HapticSession` returned by `startRealtime()` is scoped to a
gesture; call `stop()` on release or cancellation and dispose the owning haptics service at teardown (the session has no
`dispose()` method).
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

Create an owner with `createAudioPlayer()`, then await
`player.setQueue([{ id: 'sample', source: yourAudioUrl, title: 'Sample' }])`.
`source` is a local path or remote URL reachable by that target. Subscribe with
`player.subscribe(listener)` to observe state and progress; keep its returned
unsubscribe function. `seek`, `currentTime`, and `duration` use **seconds**,
unlike the video component’s milliseconds. Unsubscribe and call `dispose()`
when the media-session owner ends. Always handle a
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

## Check your integration

In the maintained probe, Play should advance the position, Pause should hold
it, and Seek 10s should move within the sample’s duration. Try an unreachable
source and check the subscription’s `error` state as well as rejected promises.
For effects, handle a rejected `load()` and a `false` result from `play()`;
retry playback from a user action when the browser blocks it. Test overlaps
against the configured voice cap. For haptics, inspect `supported`, `patterns`,
and `realtime` independently and show a fallback for unavailable features.

The maintained probe shows `systemControls` beside background playback. On iOS,
enable the app target’s Background Modes capability and select Audio, AirPlay,
and Picture in Picture before checking playback after the screen locks ([Apple
setup](https://developer.apple.com/documentation/Xcode/configuring-background-execution-modes)).
Start a track, wait until its duration is available, then check the lock screen
for its title and duration. Pause and resume there; after returning to the app,
confirm the player state and progress match those actions. On Android, check the
media notification controls in the same way. Only offer system controls when
`player.capabilities().systemControls` is true.

While playback is active, trigger a real audio interruption such as an incoming
call, then confirm playback pauses and resumes only when the system allows it.
Play a UI sound and an overlapping pair while the track runs; confirm the track
keeps playing and its output route does not change. A multi-track queue is
needed to check queue advancement and next/previous controls. These background,
lock-screen, interruption, and route checks still need device evidence; the
maintained probe currently has one track.
The [audio](../recipes/audio-playback.md),
[haptics](../recipes/advanced-haptics.md), and [sound](../recipes/ui-sounds.md)
recipes track those gaps separately from the API overview.

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
