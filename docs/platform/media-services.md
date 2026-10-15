# Audio and haptics

> Play a sound, add vibration feedback, or play a queue of audio tracks.

**Haptics** are physical feedback from a device, such as a short vibration
after an action. UI sounds are short effects; long-form audio covers music,
podcasts, or other tracks with playback controls.

These are optional features installed as separate packages. Decide what the
app should do when a device can't provide one. For example, a successful save
should still show a message even when vibration is unavailable. If you're
using an agent, include that in your request.
For [still capture](platform-services.md) or a
[live camera preview](../app/primitives.md#when-a-screen-needs-more), use their separate guides.
Check the support table for each feature and platform you use.

From your app folder, install the package for the feature you need:

| Feature                            | Command                            |
| ---------------------------------- | ---------------------------------- |
| Advanced vibration patterns        | `pnpm add @octane-xplat/haptics`   |
| Short sound effects                | `pnpm add @octane-xplat/sounds`    |
| Audio tracks and playback controls | `pnpm add @octane-xplat/audio`     |
| Microphone recording to WAV        | `pnpm add @octane-xplat/recorder`  |

The packages include their JavaScript and Android plugin dependencies.
Advanced haptics on iOS also needs the Pulsar Swift package and source
configuration described below. Pulsar supplies its native vibration features. The two
haptics APIs serve different needs: `platform.haptics` keeps impact,
notification, and selection feedback; `@octane-xplat/haptics` adds named
presets, timed patterns, gesture-driven control, cancellation, and capability
reporting.

```ts
import { haptics, createHaptics } from '@octane-xplat/haptics'

if ((await haptics.ensure()) === 'granted') haptics.impl?.selection()
const advanced = createHaptics()
try {
	if (advanced.capabilities().presets) advanced.play('success')
} finally {
	advanced.dispose()
}
```

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

Use the maintained [MediaServices screen](../../packages/app/src/MediaServices.tsrx)
for package imports, preset/pattern calls, sound loading, player subscription,
and cleanup. It is an interaction probe, not a complete fallback UI. The
[harness native configuration](../../apps/mobile/nativescript.config.ts) shows
Pulsar’s `SPMPackages` and `NativeSource` entries; adapt the workspace-relative
Swift path to your installed package location. Do not copy the harness app ID.

## Advanced haptics

Create one haptics service for the view or interaction owner and dispose it
when that owner is removed. Check `capabilities()` first. Native builds use
Pulsar 1.4.0 on iOS and 1.3.0 on Android; Android hardware can fall back to
reduced timing or amplitude support. Web uses `navigator.vibrate` when
available. It cannot provide continuous realtime haptics, and iOS Safari does
not expose Web Vibration.

```tsx
import { useEffect, useState } from 'octane'
import { createHaptics } from '@octane-xplat/haptics'
import { Pressable, Text } from '@octane-xplat/ui'

export function SaveFeedback() {
	const [haptics] = useState(() => createHaptics())
	useEffect(() => () => haptics.dispose(), [])
	return (
		<Pressable
			onPress={() => {
				if (haptics.capabilities().presets) haptics.play('success')
			}}
		>
			<Text>Save</Text>
		</Pressable>
	)
}
```

Custom pattern points use milliseconds from the start and normalized values
from 0 to 1. A `HapticSession` returned by `startRealtime()` is scoped to a
gesture; call `stop()` on release or cancellation and dispose the owning haptics service at teardown (the session has no
`dispose()` method).
The native Pulsar bridge and physical tactile output still need device-level
verification.

```ts
import { createHaptics } from '@octane-xplat/haptics'

export function patternExample() {
	const haptics = createHaptics()
	if (haptics.capabilities().patterns) {
		haptics.playPattern({
			duration: 200,
			points: [
				{ at: 0, intensity: 0.5 },
				{ at: 150, intensity: 1 },
			],
		})
	}
	return () => {
		haptics.stop()
		haptics.dispose()
	}
}
// A gesture owner calls these callbacks on begin, move, and end OR cancel.
export function realtimeExample() {
	const haptics = createHaptics()
	if (!haptics.capabilities().realtime) {
		haptics.dispose()
		return null
	}
	const session = haptics.startRealtime(0.2)
	return {
		move: (intensity: number) => session.update(intensity),
		end: () => {
			session.stop()
			haptics.dispose()
		},
	}
}
```

## UI sounds

Use `createSoundBank({ maxVoices })` for short effects. `load(name, source)`
prepares a sound; `play(name, { volume })` uses a clamped per-play volume, and
`stop(name?)` stops every voice of one sound or every effect. The voice limit is
a hard cap; when full, the oldest active effect is stopped before the next starts. Web
`stop()` also unloads each stopped voice; the preloaded clip remains reusable. Call
`dispose()` when the owning screen or service ends. iOS/Android playback uses one
`@nativescript/audio-context` context with reusable decoded buffers and a gain
node per voice; the web backend uses preloaded HTML audio. It is pinned to the
stable `1.3.3` release, already present in the workspace's NativeScript probe.
macOS AppKit retains loaded bytes and uses an independent `AVAudioPlayer` for
each voice, so repeated plays can overlap. Local paths, file URLs, and HTTP(S)
URLs are accepted; malformed or missing audio rejects during load.

```ts
import { createSoundBank } from '@octane-xplat/sounds'

// Call from a user action; keep the bank until its owner ends.
export async function prepareSounds(source: string) {
	const bank = createSoundBank({ maxVoices: 2 })
	try {
		await bank.load('saved', source)
	} catch (error) {
		bank.dispose()
		throw error
	}
	return {
		play: () => bank.play('saved', { volume: 0.5 }),
		stopSaved: () => bank.stop('saved'),
		stopAll: () => bank.stop(),
		dispose: () => bank.dispose(),
	}
}
```

Web `load()` waits for media metadata; browsers may defer buffering until
playback. They can reject playback until the user interacts with the page.
Check `capabilities().userGestureRequired`; a failed `play()` resolves to
`false`. Effects must stay transient: they do not own media focus or change the
long-form player's route.

```ts
import type { SoundBank } from '@octane-xplat/sounds'

export async function playSaved(bank: SoundBank) {
	const needsGesture = bank.capabilities().userGestureRequired
	const played = await bank.play('saved') // call from a button when needsGesture
	if (!played) console.log(needsGesture ? 'Try again from a button' : 'Sound unavailable')
}
```

macOS construction is safe when AppKit audio APIs are absent: check `supported`
before loading. Reloading a name stops its existing voices and cancels its
pending download. Disposal cancels all pending downloads and stops all effects.
The packed silent AppKit checks qualify overlap and cleanup; audible output and
long-form route coexistence still need the [integration checks](#check-your-integration).

```ts
import { createSoundBank } from '@octane-xplat/sounds'

export async function prepareAppKitEffect(source: string) {
	const bank = createSoundBank({ maxVoices: 2 })
	try {
		if (!bank.capabilities().supported) {
			bank.dispose()
			return undefined
		}
		await bank.load('saved', source)
		return bank // keep until the screen or service ends
	} catch (error) {
		bank.dispose()
		throw error
	}
}
```

## Long-form audio

Create an owner with `createAudioPlayer()`, then await
`player.setQueue([{ id: 'sample', source: yourAudioUrl, title: 'Sample' }])`.
`source` is a local path or remote URL reachable by that target. Subscribe with
`player.subscribe(listener)` to observe state and progress; keep its returned
unsubscribe function. `seek`, `currentTime`, and `duration` use **seconds**,
unlike the video component’s milliseconds. Unsubscribe and call `dispose()`
when the media-session owner ends. Web disposal clears its Media Session
action handlers as well as metadata and the audio source. Always handle a
rejected `play()` promise: browsers can block autoplay, remote requests can
fail, and local paths may not be readable by the platform player.
On Web, `loading` covers a request or buffering wait; state returns to
`playing` when media resumes.

```ts
import { createAudioPlayer } from '@octane-xplat/audio'

export async function preparePlayer(source: string) {
	const player = createAudioPlayer()
	const unsubscribe = player.subscribe((snapshot) =>
		console.log(snapshot.state, snapshot.currentTime),
	)
	try {
		await player.setQueue([{ id: 'sample', source, title: 'Sample' }])
	} catch (error) {
		unsubscribe()
		player.dispose()
		throw error
	}
	return {
		play: async () => {
			try {
				await player.play()
			} catch {
				console.log('Playback unavailable')
			}
		},
		pause: () => player.pause(),
		seek: () => player.seek(10),
		dispose: () => {
			unsubscribe()
			player.dispose()
		},
	}
}
```

The NativeScript implementation uses a package-owned Android Media3
`MediaSessionService` and iOS `AVPlayer` with Now Playing metadata and remote
transport commands. It reports background playback, system controls, and
interruption handling as available on native. Android playback and the Media3
session were exercised on the Xplat emulator; notification/headset controls,
background continuation, interruption recovery, and physical audio output
still need device verification. Fresh iOS preparation on 2026-09-30 installed
`QBImagePickerController` once and resolved Swift packages; the historical
duplicate-pod failure is superseded at the preparation stage. Complete native
build and runtime qualification remain separate checks.
The Web Media Session API can expose browser system controls when present, but
the package does not claim background playback parity.

```ts
import { createAudioPlayer } from '@octane-xplat/audio'

const player = createAudioPlayer()
const features = player.capabilities()
console.log(features.backgroundPlayback, features.systemControls, features.interruptions)
player.dispose()
```

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

### macOS playback

macOS uses the same public import and an AVPlayer owned by each player instance.
Install the audio package and rebuild the macOS app so its native playback
code is included. Sources can be absolute local paths, `file:` URLs, or HTTP(S)
URLs. Loading waits for the track to become ready. A new queue stops the old
item and rejects its pending load; an empty queue returns to `idle`.

```ts
import { createAudioPlayer } from '@octane-xplat/audio'

export async function loadMacAudio(source: string) {
	const player = createAudioPlayer()
	try {
		await player.setQueue([{ id: 'first', source }])
		return player
	} catch (error) {
		player.dispose()
		throw error
	}
}
```

Subscribe to receive state changes and progress in seconds. End-of-track
advances to the next track and plays it. Invalid media, network failures, and
errors reported by the native output engine enter `error`; loading or buffering
that stalls for 30 seconds also fails. Handle command rejections and install a
new queue to retry. Disposal rejects pending loads, stops the owned playback,
and removes its notifications and subscriptions.

```ts
import type { AudioPlayer } from '@octane-xplat/audio'

export async function playMacAudio(player: AudioPlayer) {
	const unsubscribe = player.subscribe(({ state, currentTime, error }) => {
		console.log(state, currentTime, error?.message)
	})
	try {
		await player.play()
		await player.seek(10)
		await player.pause()
	} finally {
		unsubscribe()
		player.dispose()
	}
}
```

macOS reports system controls and interruption recovery as unavailable.
Background playback means playback can continue while the app is running
without focus; it does not promise playback after the app quits. If the native
code is absent, construction stays safe and `supported` is false. Audio output
from real speakers or headphones needs a separate listening check. The
maintained [packed macOS check](../../packages/audio/tests/verify-macos.mjs)
uses silent audio to test the native engine and injects output failures to test
cleanup; neither demonstrates audible playback or physical route failures.

```ts
import { createAudioPlayer } from '@octane-xplat/audio'

const player = createAudioPlayer()
const capabilities = player.capabilities()
console.log(capabilities.supported, capabilities.reason)
console.log(capabilities.systemControls, capabilities.interruptions) // false, false on macOS
player.dispose()
```

## Recording audio

Use `createAudioRecorder()` when the app needs microphone capture — a voice
memo, a dictated block, an attachment. `recorder.start()` requests the
microphone when the user hasn't been asked yet, or call
`recorder.requestPermission()` yourself from a settings screen so the prompt
timing is yours. `stop()` resolves a `RecordingResult` whose `bytes` are a
complete **WAV file** (16-bit PCM) on every target — pass it to an upload or
transcription call as-is.

```ts
import { createAudioRecorder } from '@octane-xplat/recorder'

const recorder = createAudioRecorder()
await recorder.start() // asks for the mic if still undetermined
// ... later, when the user releases or taps stop:
const take = await recorder.stop()
console.log(take.mimeType, take.bytes.byteLength, take.durationSeconds)
// 'audio/wav', the full file length, seconds recorded
recorder.dispose()
```

Watch `snapshot()` while a take is open: `state` moves between `recording`,
`paused`, `interrupted` (the OS suspended capture — a phone call, a silenced
mic, a disconnected route; it becomes `paused` when the interruption clears
and `resume()` continues the same take), and `error`. `permission` reports
`undetermined`, `granted`, `denied`, `unavailable` (no usable input device), or
`unsupported` — a refused or failed `start()` rejects *and* updates the
snapshot, so always catch it.

```ts
import { createAudioRecorder } from '@octane-xplat/recorder'

const recorder = createAudioRecorder()
const off = recorder.subscribe((snapshot) => {
	console.log(snapshot.state, snapshot.permission, snapshot.meterLevel)
})
try {
	await recorder.start()
} catch (error) {
	console.log(`Cannot record: ${recorder.snapshot().permission}`)
}
if (recorder.snapshot().state === 'recording') {
	await recorder.pause()
	await recorder.resume() // explicit; interruptions never resume themselves
}
await recorder.cancel() // discards the take entirely
off()
recorder.dispose()
```

`recorder.restart()` discards the open take and starts a new one — handy for
"try again" in a dictation UI. On native, `take.path` names the temp file the
take was written to; your app owns deleting it. `permissions.ensure('microphone')`
from `@octane-xplat/platform` also delegates to this leaf when it is installed.

Native recording runs `AVAudioRecorder` on iOS/macOS and `AudioRecord` on Android;
the web target captures through `getUserMedia` and an AudioWorklet tap
(ScriptProcessor fallback). Android captures in the foreground only —
background microphone use needs an app-owned foreground service, which the
package does not start. Real-device permission prompts, interruption recovery,
route coexistence, and mic audio quality still need on-device qualification.

On macOS, configure the app's microphone explanation and signing entitlement
before recording; follow [macOS recorder setup](../../packages/recorder/README.md#macos-setup-and-lifecycle).
The `macos` export loads independently of mobile APIs. Permission prompts leave
the snapshot `idle`. A foreground loss or disconnected input interrupts capture;
recovery requires an explicit app action. Stop waits for a valid finished WAV;
cancel and dispose remove only the unfinished operation's file and release input.
Real macOS microphone qualification remains queued, including privacy prompts,
input removal and foreground recovery. The maintained
[voice-memo example](../../examples/recorder/voice-memo.ts) is typechecked by the
packed-consumer suite.

```ts
import { createAudioRecorder } from '@octane-xplat/recorder'

const recorder = createAudioRecorder()
try {
	await recorder.start() // idle until authorized; default 44100 Hz, mono
	const take = await recorder.stop() // rejects an empty or invalid take
	console.log(take.sampleRate, take.channels, take.durationSeconds)
} finally {
	recorder.dispose() // keeps a successfully finished result's path
}
```

## Check your integration

In the maintained probe, Play should advance the position, Pause should hold
it, and Seek 10s should move within the sample’s duration. Try an unreachable
source and check the subscription’s `error` state as well as rejected promises.
For effects, handle a rejected `load()` and a `false` result from `play()`;
retry playback from a user action when the browser blocks it. Test overlaps
against the configured voice cap. For haptics, inspect `supported`, `patterns`,
and `realtime` independently and show a fallback for unavailable features.

```ts
import type { AudioPlayer, AudioSnapshot } from '@octane-xplat/audio'

export function observe(player: AudioPlayer, report: (snapshot: AudioSnapshot) => void) {
	return player.subscribe((snapshot) => {
		report(snapshot)
		if (snapshot.state === 'error') console.log(snapshot.error?.message)
	})
}
```

The maintained probe shows `systemControls` beside background playback. On iOS,
enable the app target’s Background Modes capability and select Audio, AirPlay,
and Picture in Picture before checking playback after the screen locks ([Apple
setup](https://developer.apple.com/documentation/Xcode/configuring-background-execution-modes)).
Start a track, wait until its duration is available, then check the lock screen
for its current track title and duration. Pause and resume there; after returning to the app,
confirm the player state and progress match those actions. On Android, check the
media notification controls in the same way. Only offer system controls when
`player.capabilities().systemControls` is true.

```ts
import type { AudioPlayer } from '@octane-xplat/audio'

export function hasSystemControls(player: AudioPlayer) {
	return player.capabilities().systemControls
}
```

While playback is active, trigger a real audio interruption such as an incoming
call, then confirm playback pauses and resumes only when the system allows it.
Play a UI sound and an overlapping pair while the track runs; confirm the track
keeps playing and its output route does not change. A multi-track queue is
needed to check queue advancement and next/previous controls. The maintained
probe now uses two sample tracks and displays the current track ID. Seek near
the end of the first track and expect `sample-two`; leave the owning screen
and verify its playback resources are released. These background, lock-screen,
interruption, and route checks still need device evidence.
The [audio](../../.agents/docs/recipes/audio-playback.md),
[haptics](../../.agents/docs/recipes/advanced-haptics.md), and [sound](../../.agents/docs/recipes/ui-sounds.md)
recipes track those gaps separately from the API overview.

## Validation status

Use [optional-service qualification](../../.agents/docs/notes/optional-service-qualification.md) for the
current target-by-target evidence and remaining checks. The nonvisual Chromium
probe exercises real browser file-input reads, playback, pause/seek, two-track
advancement, effect voice limits, stopping and teardown. It does not verify
audibility, hardware routes, mobile background playback or system transport UI.

Earlier Android emulator checks verified Media3 state and metadata, haptics
calls and effects beside an active player. They remain historical evidence;
the emulator's disabled audio output and absent haptic actuator did not prove
physical output. Fresh iOS pod installation now succeeds with a single
`QBImagePickerController` source. Native build and runtime evidence are tracked
independently from that preparation result.
