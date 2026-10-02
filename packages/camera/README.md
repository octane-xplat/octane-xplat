# `@octane-xplat/camera`

```sh
pnpm add @octane-xplat/camera
```

Live camera preview for Octane xplat apps: `getUserMedia` video on web,
`AVCaptureSession` on iOS, CameraX on Android.

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
controls the shared props don't cover, and the `ios`/`android`/`web`
escape props apply after the shared props.

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

Guide: [Building screens](../../docs/primitives.md) (leaf components);
component index: [`docs/components.md`](../../docs/components.md).
Exercised by [`CameraDemo`](../demos/src/CameraDemo.tsrx).
