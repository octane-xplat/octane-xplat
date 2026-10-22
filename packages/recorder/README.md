# `@octane-xplat/recorder`

```sh
pnpm add @octane-xplat/recorder
```

Microphone recording for Octane xplat apps — one take produces a complete
16-bit PCM **WAV** file (`audio/wav`). iOS and macOS drive
`AVAudioRecorder`, Android drives `AudioRecord`, and web captures through
`getUserMedia` + `AudioWorklet` (ScriptProcessor fallback) — no plugin
dependency. The leaf owns permission, capture, metering, and honest state
reporting; your app owns the interaction (hold-to-record, limits,
transcription, insertion).

```ts
import { createAudioRecorder } from '@octane-xplat/recorder'

const recorder = createAudioRecorder()
const off = recorder.subscribe((snapshot) => {
	// { state, permission, durationSeconds, meterLevel, error }
})

await recorder.start() // asks for the microphone if still undetermined
// ... record ...
const take = await recorder.stop() // { bytes, mimeType: 'audio/wav', durationSeconds, path? }
off()
recorder.dispose()
```

`state` is explicit: `recording`, `paused` (app-paused), `interrupted` (the OS
suspended capture — a call, a silenced mic, a dead track; it becomes `paused`
when the interruption clears so the app can `resume()`), `idle`, and `error`
(`snapshot().error` carries the cause). `permission` reports
`undetermined | granted | denied | unavailable | unsupported` — a denied or
failed `start()` rejects _and_ updates the snapshot, never a silent no-op.

```ts
if (recorder.capabilities().supported) {
	await recorder.pause()
	await recorder.resume() // also resumes a cleared interruption
	await recorder.cancel() // discards the open take
}
```

In a browser, `dispose()` also retires a pending `start()`. The browser may still
finish its permission prompt, but a late stream is stopped and startup rejects;
create a new recorder to record again.

```ts
const pendingRecorder = createAudioRecorder()
const starting = pendingRecorder.start()
pendingRecorder.dispose()
await starting.catch(() => {}) // disposed; no capture starts after the grant
```

Notes and limits:

- `restart(options)` discards the open take and starts a new one.
- `options.sampleRate` defaults to 44100 Hz and `options.channels` defaults
  to mono (1); stereo (2) is also accepted. These are requests — the result's
  `sampleRate`/`channels` report what was actually written.
- Native takes also return `path` (a temp file your app owns and deletes);
  `bytes` always carries the full WAV file.
- Android: background capture requires an app-owned foreground service — the
  leaf does not start one.
- iOS: the leaf sets `AVAudioSessionCategoryPlayAndRecord` (mix + duck) while
  a take is open and deactivates on stop/cancel.
- The mobile native entry requires iOS or Android. macOS uses the `macos`
  export condition and its own Swift leaf; see setup below.

For playback of the result see [`@octane-xplat/audio`](../audio/README.md).
Permission dispatch through `@octane-xplat/platform` answers
`permissions.ensure('microphone')`.

## macOS setup and lifecycle

Use the AppKit target with the `macos` export condition (the Xplat CLI sets
it). The app bundle needs a nonempty microphone explanation in `Info.plist`
and the audio-input entitlement when signed with the hardened runtime or
sandbox. These are app-owned settings; the recorder never edits them.

```xml
<!-- Info.plist: place inside the existing dict -->
<key>NSMicrophoneUsageDescription</key>
<string>Record the voice memo you choose to attach.</string>
```

```xml
<!-- Your signing entitlements: place inside the existing dict -->
<key>com.apple.security.device.audio-input</key>
<true/>
```

Check support before recording. A missing native bridge or usage explanation
reports `unsupported`; missing input reports `unavailable`. A user refusal or
OS restriction reports `denied`; a rejected start's error retains the native
reason. While the permission prompt is pending the snapshot stays `idle`.

```ts
import { createAudioRecorder } from '@octane-xplat/recorder'

const recorder = createAudioRecorder()
try {
	if (!recorder.capabilities().supported) throw new Error('Recorder bridge is unavailable')
	await recorder.start() // default request: 44100 Hz, mono, 16-bit PCM
	const take = await recorder.stop()
	console.log(take.mimeType, take.sampleRate, take.channels, take.durationSeconds)
} catch (error) {
	console.log(recorder.snapshot().permission, error)
} finally {
	recorder.dispose()
}
```

A macOS take pauses when the app leaves the foreground or an input device
disconnects. It never resumes automatically. After recovery the app chooses
whether to resume, finish, or discard. Stop waits for native file finalization
and validates the WAV header, whole samples and metadata; empty or invalid
takes reject. Cancel and dispose settle pending operations and release the
microphone, removing only that unfinished take. A successful result's file
belongs to the app and survives later cancellation or disposal.

```ts
import { createAudioRecorder } from '@octane-xplat/recorder'

const recorder = createAudioRecorder()
await recorder.start({ sampleRate: 16000, channels: 2 })
await recorder.pause()
await recorder.resume() // explicit; wait for 'paused' after an interruption
const take = await recorder.stop()
recorder.dispose()
console.log(take.path, take.bytes.length) // app owns deletion of this finished path
```

The [voice-memo example](../../examples/recorder/voice-memo.ts) connects cleanup
to an app-owned Stop action. Adapter state/failure tests, packed public
consumers and native bridge checks cover software behavior. Real microphone
capture, privacy prompts, input removal, metering and foreground recovery
remain queued for hardware qualification; these checks do not establish
runtime capture parity. No background recording is promised.
