---
hype: 50
---

### Open a Windows action menu with the keyboard or mouse

Experimental Windows dropdowns use native menu-item input and automation for flat action rows, while keeping the shared Button and row content:

```tsx
import { DropdownMenu } from '@octane-xplat/ui'

export function Actions() {
  return <DropdownMenu button={{ label: 'Actions' }} items={[
    { type: 'action', key: 'open', label: 'Open', onSelect: () => console.log('Open') },
    { type: 'action', key: 'remove', label: 'Remove', isDisabled: true },
  ]} />
}
```

Other row kinds, keep-open or compound menus, sheet presentation and custom surface settings retain the shared view and its input limits. See the [Windows action-menu guide](https://octane-xplat.goddardai.org/platform/windows-setup#action-menu-candidate) for the experimental support boundary.
