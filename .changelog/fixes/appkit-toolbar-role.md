### AppKit toolbars retain controls and expose their role

AppKit Toolbar now supplies its current label and native toolbar role on the
existing host. Changing orientation now preserves slot controls and their local
state. Child actions remain separate; the container does not become a button or
extra Tab stop.

```tsx
import { Button, Toolbar } from '@octane-xplat/ui'

export function Actions() {
	return <Toolbar label="Page actions" startContent={<Button label="Save" />} />
}
```

Complete mixed-control roving and orientation accessibility metadata remain gaps.
Native input and VoiceOver remain unqualified. See [toolbar actions](https://octane-xplat.goddardai.org/app/navigation-ui#add-toolbar-actions-and-responsive-overflow).
