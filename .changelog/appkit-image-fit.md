AppKit `Image` now computes clipped fit rectangles for cover, contain, fill,
none and scale-down, with shared keyword, point and percentage positions.
The optional image package uses the same native path.

```tsx
import { Image } from '@octane-xplat/ui'

export function Portrait({ src }: { src: string }) {
	return <Image src={src} alt="Portrait" contentFit="cover"
		contentPosition={{ top: 0, right: '25%' }}
		style={{ width: 120, height: 120 }} />
}
```

Native cropping, orientation, density and pixels remain unqualified. Raw CSS
positions support keywords, px and percentages; unsupported values warn and
center. See [AppKit image loading](https://octane-xplat.goddardai.org/app/components#image-loading-on-appkit).
