### Labeled AppKit switches

Standalone AppKit Switch now renders labels, descriptions and validation status.
Label-side/spacing options and compact size use the shared CSS layout; an
existing Field retains metadata ownership.

```tsx
import { Switch } from '@octane-xplat/ui'

export function Alerts() {
	return <Switch label="Alerts" description="Daily summary" defaultValue
		labelPosition="start" labelSpacing="spread" width={280} />
}
```

Activate the track; label-click activation remains a gap. Native layout, focus
and accessibility are unqualified. See
[switch settings](https://octane-xplat.goddardai.org/app/components#save-a-switch-setting-on-appkit).
