### Adjust native macOS color controls from the keyboard and VoiceOver

On experimental AppKit, `ColorArea` and `ColorSlider` (including the parts
inside `ColorPicker`) are now Tab stops. Arrow keys move the hue by 1° or the
saturation and brightness by 1%, and Shift moves ten times as far. VoiceOver
can increment and decrement them and reads the current hue or color. Real
keyboard and VoiceOver behavior has not yet been checked on a running Mac.

```tsx
import { ColorSlider } from '@octane-xplat/ui'

export function AccentHue() {
	return <ColorSlider channel="hue" defaultValue="#4488ff" accessibilityLabel="Accent hue" />
}
```

See [color controls](https://octane-xplat.goddardai.org/app/components#color-controls).
