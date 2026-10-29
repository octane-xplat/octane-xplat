### AppKit dropdown requests use current state

AppKit dropdown toggles now use the latest local open intent and current parent
props. Trigger, arrow and dismissal requests share a guard against nested or
detached actions, including during button-ref replacement. Loading blocks new
opening unless the trigger is interruptible; an open menu remains visible.

```tsx
import { DropdownMenu, DropdownMenuItem } from '@octane-xplat/ui'

export function Actions({ saving }: { saving: boolean }) {
	return <DropdownMenu button={{ label: 'Actions', isLoading: saving }}>
		<DropdownMenuItem label="Archive" />
	</DropdownMenu>
}
```

Native input, popup timing, focus and accessibility remain unqualified. See the
[AppKit menu contract](https://octane-xplat.goddardai.org/menus#appkit-menu-host-state).
