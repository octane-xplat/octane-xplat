### Know when the camera preview is on screen

`CameraView` gains `onDisplayReady`, which fires when the preview shows its first live camera frame. `onReady` still means the session can start recording; it does not promise that a frame is visible yet. Use `onDisplayReady` when something should wait for a visible preview, such as starting a recording automatically. It fires on iOS 13+, Android and web. macOS, Windows and Linux never fire it, so do not block your app on it there.

```tsx
import { CameraView, createCameraSession } from '@octane-xplat/camera'

const session = createCameraSession()

export function InstantRecorder() {
  return <CameraView session={session} onDisplayReady={() => session.startRecording()} />
}
```

See [preview readiness](https://octane-xplat.goddardai.org/package-camera#preview-readiness).
