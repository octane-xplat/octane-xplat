### CameraView renders a live preview on macOS

`CameraView` from `@octane-xplat/ui/macos` now mounts the AppKit camera
backend from `@octane-xplat/camera` instead of an unsupported label. The
AVCaptureSession preview, permission flow, and `onReady`/`onError`
lifecycle come from the camera leaf unchanged — `@octane-xplat/ui` gains a
workspace dependency on `@octane-xplat/camera`.

```tsx
import { CameraView } from '@octane-xplat/ui/macos'

export function Preview() {
	return <CameraView facing="back" onReady={() => console.log('live')} />
}
```

See the [camera package](https://github.com/octane-xplat/octane-xplat/tree/main/packages/camera)
for the full preview and capture contract.
