# `@octane-xplat/camera`

```sh
pnpm add @octane-xplat/camera
```

Live camera preview for Octane xplat apps: `getUserMedia` video on web,
`AVCaptureSession` on iOS, CameraX on Android, `MediaCapture` +
`CaptureElement` on the Windows (WinUI 3) target.

```tsx
import { CameraView } from '@octane-xplat/camera'

export function Preview() {
	return (
		<CameraView
			facing="back"
			active
			onReady={() => console.log('Preview running')}
			onError={(error) => console.log(error.message)}
		/>
	)
}
```

This is the preview surface only — for one-shot still capture and library
picking use [`@octane-xplat/media`](../media/README.md). Permissions are
requested when the session starts; `onError` is how a denial shows up.
`ref` hands you the platform surface (`HTMLVideoElement` on web) for
controls the shared props don't cover, and the `ios`/`android`/`web`/
`windows` escape props apply after the shared props.

```tsx
// Preview.web.tsx — browser properties belong in this platform file.
import { CameraView } from '@octane-xplat/camera'

export function Preview() {
	return (
		<CameraView
			web={{ playsInline: true }}
			ref={(handle) => console.log(handle.native)}
			onError={(error) => console.log(error.message)}
		/>
	)
}
```

## Movie recording

`createCameraSession` creates a shared camera owner: the same session can
drive a `CameraView` preview and one movie-recording attempt at a time.
Pass the session to `CameraView` instead of `facing`; the preview attaches
the camera the session owns. Recording requires an attached, ready preview.

```tsx
import { CameraView, createCameraSession } from '@octane-xplat/camera'

const session = createCameraSession({ camera: 'default' })

export function Recorder() {
	return <CameraView session={session} />
}
```

A take settles after the movie is finalized, metadata is verified, and local
storage is committed. Native output lives in app-private files; Web uses
persistent origin storage. Reopen it with `session.openOutput(output)`.

```ts
const take = session.startRecording({ maximumDurationMs: 30_000 })
// … later, on a stop press or a maximum-duration limit:
const outcome = await take.stop()
if (outcome.kind === 'clip') {
	const clip = outcome.clip
	console.log(clip.durationMs, clip.width, clip.height, clip.output)
}
```

One preview and one recording per session; a second `startRecording` throws
`CameraCaptureError` with `kind: 'busy'`. Check `session.capabilities()` for
`supported`/`available` before presenting capture UI, and `session.snapshot()`
or `session.subscribe` for state. iOS, Android, Web, and the Windows WinUI
target have recording adapters; Web requires persistent origin storage.
Windows records through `MediaCapture` into app-private MP4 files and is
pending real-host qualification. macOS and Linux adapters remain unfinished.
See [Record and reopen a camera movie](../../docs/app/movie-capture.md) for
explicit permission actions, audio, local output, and qualification limits.

```ts
console.log(await session.permissions())
// Call from an app button:
await session.requestPermission('camera')
console.log(await session.capabilities())
```

Guide: [Building screens](../../docs/app/primitives.md) (leaf components);
component index: [`docs/app/components.md`](../../docs/app/components.md).
Exercised by [`CameraDemo`](../demos/src/CameraDemo.tsrx).
