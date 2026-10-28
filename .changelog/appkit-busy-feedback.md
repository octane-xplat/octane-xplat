### Busy feedback on AppKit

AppKit Spinner now renders named sizes, labels and on-media contrast and exposes
a named progress owner. Switch shows a compact ring while saving or loading.

```tsx
import { Spinner } from '@octane-xplat/ui'

export function Saving() {
	return <Spinner size="sm" label="Saving settings" />
}
```

The self-drawn ring remains static; native CSS animation playback is still a
gap. Appearance, clipping and accessibility remain unqualified. See
[busy feedback](https://octane-xplat.goddardai.org/app/components#busy-feedback-on-appkit).
