### `captureScreen` works on iOS

`captureScreen` on iOS rejected every call with "View is detached": the detached check read `window` on the `UIWindow` itself, which is always nil — only a window's scene association marks it attached. Screen capture now succeeds and uses the display's native pixel scale.

```ts
import { captureScreen, releaseCapture } from '@octane-xplat/view-shot'

const uri = await captureScreen({ format: 'png' })
try {
	// Consume the temporary image.
} finally {
	releaseCapture(uri)
}
```

See [app-screen capture](https://octane-xplat.goddardai.org/package-view-shot#capture-an-existing-host).
