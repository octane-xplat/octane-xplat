### Mobile drawers include edge gestures

**Breaking change:** import `Drawer` and `DrawerProps` from
`@octane-xplat/drawer`. The UI root Drawer and platform-specific SideDrawer and
DrawerLayout exports are removed. Installing the drawer package brings its
mobile plugins; unrelated UI widget imports no longer initialize them.

```tsx
import { useState } from 'octane'
import { Drawer } from '@octane-xplat/drawer'

export function Menu() {
	const [open, setOpen] = useState(false)
	return <Drawer open={open} onOpenChange={setOpen} main={null} drawer={null} />
}
```

Mobile users can open from the left edge and drag closed. Web and desktop use
explicit controls and backdrop dismissal.

[Drawer setup and migration](https://github.com/octane-xplat/octane-xplat/blob/main/docs/app/drawer.md)
