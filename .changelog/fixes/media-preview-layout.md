### Keep image previews in their frame

Web `AspectRatio` now reserves its requested shape even when an image has a
different intrinsic size. Thumbnail preview and remove actions also work
independently with pointer and keyboard input. Dragging a zoomed Lightbox image
keeps the image zoomed after release.

```tsx
import { AspectRatio, Image } from '@octane-xplat/ui'

export function PhotoPreview() {
  return <AspectRatio ratio={16 / 9}><Image src="/photo.png" alt="Coastline" /></AspectRatio>
}
```

[Media components](https://octane-xplat.goddardai.org/app/components#content)
