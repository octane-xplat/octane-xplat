# `@octane-xplat/camera`

Live camera preview for Octane xplat apps: `getUserMedia` video on web,
`AVCaptureSession` on iOS, CameraX on Android,
`AVCaptureSession` + `AVCaptureVideoPreviewLayer` on macOS (AppKit), and
`MediaCapture` + `CaptureElement` on the Windows (WinUI 3) target.

```sh
bun add @octane-xplat/camera
```

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
picking use [`@octane-xplat/media`](https://github.com/octane-xplat/octane-xplat/blob/main/packages/media/README.md). Permissions are
requested when the session starts; `onError` is how a denial shows up.
`ref` hands you the platform surface (`HTMLVideoElement` on web) for
controls the shared props don't cover, and the `ios`/`android`/`web`/
`windows` escape props apply after the shared props. On macOS the leaf is a
compiled Swift `XplatCameraHost` that owns the capture session; the app bundle
needs `NSCameraUsageDescription` (and `NSMicrophoneUsageDescription` for
audio) declared through `xplat.targets.macos.package.infoPlist`.

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

## Tap-to-focus

`CameraView` reports where the user tapped as a normalized point —
`{x: 0, y: 0}` is the top-left corner of the preview, `{x: 1, y: 1}` the
bottom-right. Hand the point to a session's `focusAtPoint` to meter one
autofocus and auto-exposure pass there:

```tsx
import { CameraView, createCameraSession } from '@octane-xplat/camera'

const session = createCameraSession()

export function FocusablePreview() {
	return <CameraView session={session} onTap={(point) => session.focusAtPoint(point)} />
}
```

`onTap` is a pure notification — it never takes over the gesture, so
double-tap and pan recognizers layered over the preview keep working.
`focusAtPoint` needs a session (it drives the camera the preview
attaches) and quietly does nothing on cameras that cannot meter at a
point — front cameras are often fixed-focus. Check
`capabilities().focusPointOfInterest` and `exposurePointOfInterest`
before showing focus UI. Metering lands on iOS, Android, and macOS; the
tap event fires on iOS, Android, and web.

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
storage is committed. Native output lives in app-private files — including the
packaged Linux WebKitGTK host, which writes under the app's data directory;
Web uses persistent origin storage. Reopen it with `session.openOutput(output)`.

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
or `session.subscribe` for state. iOS, Android, Web, macOS, the Windows WinUI
target, and the packaged Linux WebKitGTK host have recording adapters; Web
requires persistent origin storage.
macOS writes app-private MOV files through `AVCaptureMovieFileOutput` and
reports finalized track metadata; on macOS 14+ the four cardinal orientations
are lockable. Inside a qualified `xplat` WKWebView host the Web backend stores
output in the app's private storage root instead of IndexedDB. Windows records
through `MediaCapture` into app-private MP4 files and is pending real-host
qualification. On Linux the GJS/WebKitGTK host owns media permissions and
writes MP4 clips under the app's data directory.
See [Record and reopen a camera movie](https://octane-xplat.goddardai.org/movie-capture) for
explicit permission actions, audio, local output, and qualification limits.

```ts
console.log(await session.permissions())
// Call from an app button:
await session.requestPermission('camera')
console.log(await session.capabilities())
```

Guide: [Building screens](https://octane-xplat.goddardai.org/primitives) (leaf components);
component index: [`docs/app/components.md`](https://octane-xplat.goddardai.org/components).
Exercised by [`CameraDemo`](https://github.com/octane-xplat/octane-xplat/blob/main/packages/demos/src/CameraDemo.tsrx).
