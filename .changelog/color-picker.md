---
release: lockstep
---

### Color picker suite in `@octane-xplat/ui`

`ColorPicker` composes a saturation/brightness `ColorArea`, a hue `ColorSlider`,
a `ColorSwatch`, and a `ColorField` around one shared color state — the React
Aria counterparts, self-drawn so the shared layout holds across targets.
Values are hex strings: input accepts `'#rrggbb'`, `'#rgb'`, and a missing
`'#'`; output is always lowercase `'#rrggbb'`.

```tsx
import { useState } from 'octane'
import { ColorPicker } from '@octane-xplat/ui'

function FavoriteColor() {
	const [color, setColor] = useState('#4488ff')
	return <ColorPicker value={color} onChange={setColor} />
}
```

Limits for this release: `ColorSlider` supports only the `hue` channel, there is
no alpha channel, drags adjust by delta (no tap-to-position), and `ColorPicker`
has a fixed layout rather than React Aria's children composition.
