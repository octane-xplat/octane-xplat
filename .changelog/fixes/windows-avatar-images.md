### Load Windows avatar images and expose their names

Windows images using base64 data URIs now reach the native async decoder instead
of remaining empty. Avatar initials fit inside their circle, and both the image
and initials paths expose a named image peer.

```tsx
import { Avatar } from '@octane-xplat/ui'

export function Person() {
  return <Avatar name="Ada Lovelace" size="lg" />
}
```

[Windows image guide](https://github.com/octane-xplat/octane-xplat/blob/main/docs/platform/windows-setup.md#avatars-and-raster-images-candidate)
