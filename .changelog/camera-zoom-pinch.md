---
hype: 60
---

### Pinch to zoom the camera

`CameraSession` gains `zoomState()` and `setZoom(ratio)`, which read and set the active camera's zoom, including while recording. `setZoom` keeps every value inside the camera's supported range. Shared `View`, `Row`, `Stack`, `StackItem` and `Pressable` gain `onPinch`, which reports how much a pinch has scaled since it began on iOS and Android. Zoom works on iOS, Android, and web browsers whose camera track exposes zoom; macOS, Windows and Linux report `zoom: false`.

```tsx
import { CameraView, createCameraSession } from '@octane-xplat/camera'
import { View } from '@octane-xplat/ui'
import { useRef } from 'octane'

const session = createCameraSession()

export function ZoomablePreview() {
  const baseZoom = useRef(1)
  return (
    <View
      onPinch={(event) => {
        if (event.state === 'began') {
          baseZoom.current = session.zoomState()?.zoom ?? 1
        }

        session.setZoom(baseZoom.current * event.scale)
      }}
    >
      <CameraView session={session} />
    </View>
  )
}
```

**Breaking change:** `CameraSessionCapabilities` now requires a `zoom` boolean. Code that builds its own capabilities object, such as a test double, must add it:

```ts
import type { CameraSessionCapabilities } from '@octane-xplat/camera'

declare const previous: Omit<CameraSessionCapabilities, 'zoom'>
const capabilities: CameraSessionCapabilities = { ...previous, zoom: false }
```

See [pinch-to-zoom](https://octane-xplat.goddardai.org/package-camera#pinch-to-zoom).
