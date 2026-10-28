### Busy feedback on AppKit

AppKit Spinner now renders named sizes, labels and on-media contrast and exposes
a named progress owner. Switch shows a compact ring while saving or loading.

```tsx
import { Spinner } from '@octane-xplat/ui'

export function Saving() {
	return <Spinner size="sm" label="Saving settings" />
}
```

Spinner rotation and indeterminate ProgressBar sliding now connect to the
existing AppKit keyframe sampler. Reduced Motion leaves steady feedback; workspace
display-option changes refresh its media rule. Native playback, notification
delivery, appearance, clipping and accessibility remain unqualified. See
[busy feedback](https://octane-xplat.goddardai.org/app/components#busy-feedback-on-appkit).

```tsx
import { ProgressBar } from '@octane-xplat/ui'
export function Upload() {
	return <ProgressBar label="Uploading" isIndeterminate />
}
```
