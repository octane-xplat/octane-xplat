---
hype: 60
---

### Install a real OS menu bar on desktop

New `@octane-xplat/app-menu` package installs the native application menu bar — `NSApplication.mainMenu` on macOS and the `Gtk.Application` menubar on Linux — with action items, nested submenus, separators, disabled and controlled checkbox state, keyboard accelerators, and platform role items such as Copy and Quit.

```ts
import { appMenu } from '@octane-xplat/app-menu'

const handle = appMenu.install([
  { type: 'submenu', key: 'file', label: 'File', items: [
    { type: 'action', key: 'new', label: 'New', accelerator: 'Mod+N', onSelect: createDocument },
    { type: 'separator', key: 'after-new' },
    { type: 'role', key: 'quit', role: 'quit' },
  ]},
])

handle.update(nextMenus)
handle.dispose()
```

Updates swap the whole tree atomically and retire stale callbacks, `dispose` restores the previous menu bar, and one owner is allowed per process. This is separate from in-window `DropdownMenu`/`ContextMenu` surfaces and from tray/status-bar icons. Web, iOS, Android, and Windows report `supported: false` and throw `UnavailabilityError` on install; a WinUI in-window `MenuBar` mapping is still being qualified.

See [Application menu](https://octane-xplat.goddardai.org/package-app-menu).
