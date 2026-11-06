### Handle pinches directly on camera previews

`CameraView` accepts `onPinch` on iOS and Android, with a cumulative scale, gesture phase, and normalized focus point. The focus falls back to the center when unavailable. Shared UI pinch events also expose optional `focusX` and `focusY` coordinates reported by the native recognizer.

```tsx
import { CameraView } from '@octane-xplat/camera'

export function Preview() {
  return <CameraView onPinch={({ scale, focus }) => console.log(scale, focus)} />
}
```

Native gesture delivery and focal-coordinate units still need device qualification. See [camera pinch-to-zoom](https://octane-xplat.goddardai.org/package-camera#pinch-to-zoom) for the zoom recipe and current limits.
