### AppKit self-drawn control semantics

The renderer now maps switch/tab/slider roles, selected and numeric values,
and ignored container hosts. Native slider increment/decrement actions dispatch
the current callbacks; changed value/selection props emit change notifications.

```tsx
import { Slider, Switch } from '@octane-xplat/ui'

export function Settings() {
	return <><Switch label="Alerts" defaultValue /><Slider label="Volume" defaultValue={40} /></>
}
```

Native selector registration, VoiceOver, notification ordering and packaged
support remain unqualified. See [renderer accessibility](https://github.com/octane-xplat/octane-xplat/blob/feat/appkit-native-support/packages/macos-renderer/README.md#self-drawn-control-accessibility).
