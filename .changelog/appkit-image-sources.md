### Resolution candidates for AppKit images

AppKit images now choose among resolution candidates using the image box and
its window's backing density, and reselect after resize or density changes.
Use a stable styled box; native cross-screen and intrinsic-only behavior still
need runtime qualification.

```tsx
import { Image } from '@octane-xplat/ui'

export function Avatar() {
	return <Image alt="Avatar" style={{ width: 80, height: 80 }} src={[
	{ uri: '~/avatar.png', width: 80, height: 80, scale: 1 },
	{ uri: '~/avatar@2x.png', width: 80, height: 80, scale: 2 },
]} />
}
```

See [AppKit image loading](https://octane-xplat.goddardai.org/app/components#image-loading-on-appkit).
