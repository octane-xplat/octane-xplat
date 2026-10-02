# `@octane-xplat/camera`

Live camera preview for Octane xplat apps: `getUserMedia` video on web,
`AVCaptureSession` on iOS, CameraX on Android.

```sh
pnpm add @octane-xplat/camera
```

```tsx
import { CameraView } from '@octane-xplat/camera'

;<CameraView
	facing="back" // 'front' | 'back', default 'back'
	active={streaming} // default true — false releases the session
	onReady={() => console.log('preview running')}
	onError={(e) => console.log(e.message)}
	ref={(h) => {
		handle = h
	}} // h.native is the preview surface
/>
```

This is the preview surface only — for one-shot still capture and library
picking use [`@octane-xplat/media`](../media/README.md). Permissions are
requested when the session starts; `onError` is how a denial shows up.
`ref` hands you the platform surface (`HTMLVideoElement` on web) for
controls the shared props don't cover, and the `ios`/`android`/`web`
escape props apply after the shared props.

Guide: [Building screens](../../docs/primitives.md) (leaf components);
component index: [`docs/components.md`](../../docs/components.md).
Exercised by [`CameraDemo`](../demos/src/CameraDemo.tsrx).
