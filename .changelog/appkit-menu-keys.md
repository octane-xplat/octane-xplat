### AppKit menu surface keyboard navigation

AppKit menus now have a source keyboard path for wrapping arrows, Home/End,
label-prefix search, manual activation and directional submenus. Existing row
state and close owners remain in charge; nested editors keep their key handling.

```tsx
import { DropdownMenu, DropdownMenuItem } from '@octane-xplat/ui'

export function Actions() {
	return <DropdownMenu button={{ label: 'Actions' }}><DropdownMenuItem label="Archive" /></DropdownMenu>
}
```

Native key/focus/popup/VoiceOver behavior remains unqualified. Closed-trigger
arrows and reliable cross-popup Tab return remain separate gaps. See the
[AppKit menu guide](https://octane-xplat.goddardai.org/menus#navigate-appkit-menu-surfaces).
