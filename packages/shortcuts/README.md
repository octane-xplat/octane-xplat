# Keyboard shortcuts

> Add scoped keyboard commands, multi-step sequences, and user-recorded bindings
> to web and experimental native desktop apps.

`@octane-xplat/shortcuts` owns keyboard matching and availability; your app
keeps its command registry, menus, labels, and saved preferences. It is separate
from the software-keyboard layout package, `@octane-xplat/keyboard`.

## Install and try

After the package's first framework release, install the version matching your
other Xplat packages. No UI dependency or Octane hook is required.

```sh
pnpm add @octane-xplat/shortcuts
```

In a browser entry file, register a command and keep its cleanup with the app.
Press Command+K on macOS or Control+K elsewhere to print “Open commands”.

```ts
import { createShortcuts } from '@octane-xplat/shortcuts'

const shortcuts = createShortcuts({ target: document })
shortcuts.bind({
	combo: 'Mod+k',
	editablePolicy: 'allow-if-meta',
	preventDefault: true,
	handler: () => console.log('Open commands'),
})

// Call when this app owner closes or its module is replaced.
export const disposeShortcuts = () => shortcuts.dispose()
```

Native desktop targets accept an attached AppKit view, GTK4 widget, or WinUI
element instead of `document`. Their hosts remain experimental. Chromium and
GTK/X11 and WinUI input have runtime checks; AppKit has a native event-queue
check through the renderer. WinUI requires the framework’s pinned, patched
NativeScript core for shared event ownership. IMEs and installed desktop
consumers still need qualification. Mobile hardware shortcuts and
system-wide hotkeys are unsupported. Missing host support throws at creation.

Read [Add keyboard shortcuts](../../docs/app/keyboard-shortcuts.md) for native
ownership, scopes, recording, rebinding, and host limits. The maintained
[workspace installer](examples/workspace.ts) shows a shared service.
