### Activate AppKit switches from their labels

AppKit Switch labels now use the same toggle/save handler as the track and
request focus on the control. The label target uses the renderer's Tab exclusion
lease so it does not introduce a second sequential keyboard stop.

```tsx
import { Switch } from '@octane-xplat/ui'

export function Alerts() {
	return <Switch label="Alerts" description="Daily summary" defaultValue />
}
```

Native hit testing, tooltip arbitration, focus, Tab order and accessibility
remain unqualified. Without the renderer's suppression bridge, use the track.
See [switch settings](https://octane-xplat.goddardai.org/app/components#save-a-switch-setting-on-appkit).
