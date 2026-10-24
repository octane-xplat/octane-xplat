---
release: lockstep
---

### Keep image grids within their available width

On iOS and Android, percentage-sized images now fit their share of a grid
instead of making its columns grow to the image's natural width. This also
works when an image sits inside a flex-growing tile.

```tsx
import { Grid, Image } from '@octane-xplat/ui'

export function ThumbnailPair({ src }: { src: string }) {
	return <Grid columns="*,*" style={{ width: 402 }}>
		<Image src={src} alt="" style={{ width: '100%', height: 402 }} />
		<Image src={src} alt="" style={{ width: '100%', height: 402 }} />
	</Grid>
}
```

Rebuild the native app after upgrading to load the corrected engine.

[Image sizing](https://octane-xplat.goddardai.org/primitives#fit-and-position-an-image)
