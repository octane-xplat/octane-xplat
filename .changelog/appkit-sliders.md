### Settings and range sliders on AppKit

AppKit Slider now implements bounded scalar/range values, steps, marks,
formatted readouts and separate thumb adjustments. Field disabled/read-only
state also blocks changes. Default fractional readouts retain their value on
web as well.

```tsx
import { Slider } from '@octane-xplat/ui'

export function Budget() {
	return <Slider label="Budget" defaultValue={[20, 80]} min={0} max={100}
		step={5} valueDisplay="text" />
}
```

Native input, focus, accessibility and layout remain unqualified. See
[AppKit Slider](https://octane-xplat.goddardai.org/app/components#slider-on-appkit).
