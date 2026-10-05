# `@octane-xplat/recorder`

```sh
pnpm add @octane-xplat/recorder
```

Microphone recording for Octane xplat apps — one take produces a complete
16-bit PCM **WAV** file (`audio/wav`) on every target. iOS drives
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

Notes and limits:

- `restart(options)` discards the open take and starts a new one.
- `options.sampleRate` (default 44100) and `options.channels` (1 or 2, default
  1. are requests — the result's `sampleRate`/`channels` report what was
     actually written.
- Native takes also return `path` (a temp file your app owns and deletes);
  `bytes` always carries the full WAV file.
- Android: background capture requires an app-owned foreground service — the
  leaf does not start one.
- iOS: the leaf sets `AVAudioSessionCategoryPlayAndRecord` (mix + duck) while
  a take is open and deactivates on stop/cancel.
- The native entry requires iOS or Android — other targets get the web
  implementation or a thrown error, never a silent no-op.

For playback of the result see [`@octane-xplat/audio`](../audio/README.md).
Permission dispatch through `@octane-xplat/platform` answers
`permissions.ensure('microphone')`.
