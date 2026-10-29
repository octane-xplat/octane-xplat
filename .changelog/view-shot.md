### Capture a card as an image

`@octane-xplat/view-shot` adds familiar view capture functions and an Octane
ViewShot wrapper with temporary-image cleanup. Platform formats and capture
strategies have explicit subsets. Runtime image output is not yet qualified.

```ts
import { captureRef, releaseCapture } from '@octane-xplat/view-shot'

const uri = await captureRef(card, { format: 'png' })
try {
	// Await the operation that shares or saves uri.
} finally {
	releaseCapture(uri)
}
```

See [setup, ownership and platform limits](https://github.com/octane-xplat/octane-xplat/tree/main/packages/view-shot).
