### AppKit menu surface keyboard navigation

AppKit menus now have a source keyboard path for wrapping arrows, Home/End,
label-prefix search, manual activation and directional submenus. Plain Down/Up
on the closed trigger requests first/last-row opening. Existing row
state and close owners remain in charge; nested editors keep their menu-surface
key handling. ContextMenu adds Shift+F10 and plain Context Menu key opening and return intent from a valid
invoker or visible trigger. With the matching renderer it also requests opening
from secondary-click and plain Control-primary-click inside the context scope.
Menu surfaces/rows now map to native menu roles and row titles, and native queries
read current selected/expanded state. Checked-menu announcements remain incomplete.

```tsx
import { DropdownMenu, DropdownMenuItem } from '@octane-xplat/ui'

export function Actions() {
	return <DropdownMenu button={{ label: 'Actions' }}><DropdownMenuItem label="Archive" /></DropdownMenu>
}
```

Native key/focus/popup/VoiceOver behavior remains unqualified. Owned dropdown Tab/Shift-Tab now records adjacent-trigger return intent through
accepted ancestor closure; actual native Tab return remains unqualified. See the
[AppKit menu guide](https://octane-xplat.goddardai.org/menus#navigate-appkit-menu-surfaces).
