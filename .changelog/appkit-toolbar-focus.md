### AppKit toolbar action focus

AppKit Toolbar now moves focus between discrete actions with axis arrows and
Home/End, without activating them. Hidden/disabled actions are skipped, and
changing orientation preserves slot controls and their local state. The native
accessibility metadata follows the current axis.

```tsx
import { Button, Toolbar } from '@octane-xplat/ui'

export function Actions() {
	return <Toolbar label="Page actions" startContent={<Button label="Save" />}
		endContent={<Button label="Share" />} />
}
```

Editors, sliders and nested composites keep their own keys and Tab stops.
Complete mixed-control roving and stock native-control Tab suppression remain
gaps. Native keys, Tab, VoiceOver,
layout and installed behavior remain unqualified. See [toolbar actions](https://octane-xplat.goddardai.org/app/navigation-ui#add-toolbar-actions-and-responsive-overflow).
