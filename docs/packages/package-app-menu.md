# Application menu

> The native menu bar your desktop app owns — File, Edit, and your own menus

Every desktop app has a menu bar at the top of the screen (macOS) or the top
of its window (Linux). It holds commands like New, Save, and Quit, plus
standard editing items such as Copy and Paste that work in your text fields
for free.

`@octane-xplat/app-menu` installs that menu bar on macOS and Linux. It is a
different thing from `DropdownMenu` and `ContextMenu` in
[`@octane-xplat/ui`](package-ui.md): those draw menus inside your app's
window, while this package drives the real OS menu bar. It is also different
from a tray or status-bar icon, which lives beside the clock and is owned by
`@octane-xplat/tray`.

[Generated API reference](https://octane-xplat.goddardai.org/api-app-menu).

## Install and try

After the package's first framework release, run this in your app directory.
Keep its version aligned with your other Xplat packages.

```sh
bun add @octane-xplat/app-menu
```

Install a menu bar once, when your app starts. Menu-bar entries are always
submenus — the bar itself only holds menu titles like File and Edit.

```ts
import { appMenu } from '@octane-xplat/app-menu'

const handle = appMenu.install([
  {
    type: 'submenu',
    key: 'file',
    label: 'File',
    items: [
      {
        type: 'action',
        key: 'new',
        label: 'New',
        accelerator: 'Mod+N',
        onSelect: () => createDocument(),
      },
      { type: 'separator', key: 'after-new' },
      { type: 'role', key: 'quit', role: 'quit' },
    ],
  },
])
```

Press Command+N on macOS or Control+N on Linux and `createDocument` runs.

## Check support first

Only desktop apps have an application menu bar. On web, iOS, Android, and
Windows the package still imports, reports `supported: false`, and `install`
throws an `UnavailabilityError` you can catch — it never silently does
nothing.

```ts
import { appMenu } from '@octane-xplat/app-menu'

if (appMenu.supported) {
  appMenu.install(menus)
}
```

`supported` is a cheap synchronous guess. `isAvailable()` is the stronger
async check and resolves to the same answer on today's hosts.

```ts
const available = await appMenu.isAvailable()
```

## Build the menu tree

Each entry has a `type` and a `key` that is unique among its siblings. An
`action` runs your `onSelect` callback. A `separator` draws a divider —
leading, trailing, and repeated separators collapse automatically. A
`submenu` nests inside another menu.

```ts
const fileMenu = {
  type: 'submenu',
  key: 'file',
  label: 'File',
  items: [
    { type: 'action', key: 'new', label: 'New', accelerator: 'Mod+N', onSelect: createDocument },
    {
      type: 'submenu',
      key: 'recent',
      label: 'Open Recent',
      items: [
        { type: 'action', key: 'doc-a', label: 'Doc A', onSelect: () => open('doc-a') },
      ],
    },
    { type: 'separator', key: 's1' },
    { type: 'action', key: 'revert', label: 'Revert', isDisabled: true, onSelect: revert },
  ],
}
```

Set `isDisabled: true` on an action or checkbox to draw it greyed out.
Disabled items stay visible but never run their callback or accelerator.

A `checkbox` is a controlled on/off item. Toggling it calls
`onValueChange` with the value the person asked for; the check mark only
moves after you install the new `value` through `update()` — the same
controlled-state rule as checkbox rows in shared menus.

```ts
const viewMenu = {
  type: 'submenu',
  key: 'view',
  label: 'View',
  items: [
    {
      type: 'checkbox',
      key: 'sidebar',
      label: 'Sidebar',
      value: showSidebar,
      accelerator: 'Mod+Shift+S',
      onValueChange: (next) => {
        setShowSidebar(next)
        handle.update(buildMenus(next))
      },
    },
  ],
}
```

A `role` entry is a standard item the platform already knows how to perform:
`undo`, `redo`, `cut`, `copy`, `paste`, `selectAll`, `minimize`, `close`,
and `quit`. Roles carry the native label and accelerator, need no callback,
and reach the focused text field through the platform's own dispatch — so
Copy really copies on both hosts.

```ts
const editMenu = {
  type: 'submenu',
  key: 'edit',
  label: 'Edit',
  items: [
    { type: 'role', key: 'undo', role: 'undo' },
    { type: 'role', key: 'redo', role: 'redo' },
    { type: 'separator', key: 's2' },
    { type: 'role', key: 'cut', role: 'cut' },
    { type: 'role', key: 'copy', role: 'copy' },
    { type: 'role', key: 'paste', role: 'paste' },
    { type: 'role', key: 'selectAll', role: 'selectAll' },
  ],
}
```

## Choose the keys

An `accelerator` names modifiers and one key joined by `+`, such as
`Mod+Shift+Z`. `Mod` means Command on macOS and Control on Linux.
`Ctrl`/`Control`, `Alt`/`Option`, `Shift`, and `Meta`/`Cmd`/`Command`/`Super`
name the rest, case-insensitively. Keys are `A`–`Z`, `0`–`9`, `F1`–`F24`,
`Enter`, `Escape`, `Tab`, `Space`, `Backspace`, `Delete`,
`ArrowUp`/`ArrowDown`/`ArrowLeft`/`ArrowRight`, `Home`, `End`, `PageUp`,
`PageDown`, `Plus`, and the punctuation `` , . / ; ' [ ] \ - = ` ``.

```ts
const items = [
  { type: 'action', key: 'save', label: 'Save', accelerator: 'Mod+S', onSelect: save },
  { type: 'action', key: 'help', label: 'Help', accelerator: 'F1', onSelect: showHelp },
]
```

Every accelerator except `F1`–`F24` needs at least one non-Shift modifier —
plain letters are reserved for typing. Two items that resolve to the same
keys on the current host are rejected, including collisions with the standard
macOS application-menu keys (Command+H, Option+Command+H, Command+Q).

## Update and clean up

`update` swaps the whole menu tree atomically — the new native menu installs
before the old one's callbacks retire, so the bar is never empty in between.
Call it whenever the enabled/checked state or the item set should change.

```ts
handle.update([
  {
    type: 'submenu',
    key: 'file',
    label: 'File',
    items: [
      { type: 'action', key: 'new', label: 'New Window', accelerator: 'Mod+Shift+N', onSelect: newWindow },
    ],
  },
])
```

Only one menu bar can be installed at a time; a second `install` while a
handle is live throws. Call `update` on the live handle instead. Updates and
disposal requested inside a callback are deferred until it returns and then
coalesced. Callbacks that throw are reported without taking the host down,
and native items from a replaced tree can never run stale callbacks.

`dispose` removes your menu, restores the menu bar the host had before, and
frees the slot so another `install` can run. Calling it twice is harmless.

```ts
handle.dispose()
console.log(handle.isDisposed) // true
```

## Put items in the macOS app menu

On macOS the package always builds the bold-named application menu for you —
About, Hide, Hide Others, Show All, and Quit with their standard keys. Extra
entries for it go in `options.macos.applicationItems`, placed between About
and the Hide group. Other platforms ignore the option, so you can share one
menu definition.

```ts
appMenu.install(menus, {
  macos: {
    applicationItems: [
      { type: 'action', key: 'settings', label: 'Settings…', accelerator: 'Mod+,', onSelect: openSettings },
    ],
  },
})
```

A `quit` role inside your own submenus is dropped on macOS because the
application menu already owns Quit with Command+Q.

## Platform support and limits

Desktop hosts are experimental. This table describes what each one uses and
what it needs from you.

| Target | How it works | What to know |
| --- | --- | --- |
| macOS (AppKit host) | `NSApplication.mainMenu` built from `NSMenu`/`NSMenuItem`. | The automatic application menu (About/Hide/Quit) is always present. Roles dispatch through the responder chain, so edit roles act on the focused field. Keyboard matching is AppKit's own; a plain-Command event can also reach a Command+Shift item on this build. |
| Linux (GTK4/GJS host) | `Gio.Menu` menubar on the default `Gtk.Application`, driven by `Gio.SimpleAction`s. | Requires a running `Gtk.Application`. Separators become GMenu sections. `_` in labels is escaped (`Save_As` shows as `Save_As`, not a mnemonic) — mnemonic labels are unsupported. Edit roles forward to the focused widget's built-in actions and only show their accelerator; close/quit register real app-level Ctrl+W/Ctrl+Q. |
| Windows, web, iOS, Android | None. | `supported: false`; `install` throws `UnavailabilityError('appMenu')`. Windows has no global menu bar; a WinUI in-window `MenuBar` mapping is being qualified separately. |

Submenus cannot be disabled on any host — GMenu has no concept for it.
Checkbox state is controlled everywhere: the native check mark changes only
through `update`.

## What has been tested

Verified on this release:

- **macOS (AppKit host):** install and bar replacement, automatic
  application-menu layout with inserted `applicationItems`, nested submenus,
  disabled items, controlled checkboxes, role selectors over the real
  responder chain (Copy reached the pasteboard), accelerators delivered by
  posted key events including a nested-submenu item, deferred updates made
  inside a callback, whole-tree replacement, stale retired items inert,
  dispose restoring the previous menu bar, and single-owner rejection.
- **Linux (GTK4/GJS host):** install, GMenu structure and mnemonic escaping,
  real key input driving action, checkbox, disabled, and nested-submenu
  accelerators, `selectAll` reaching the focused entry's own action,
  whole-tree update retiring every prior action and accelerator, stale key
  input inert, and dispose restoring the prior menubar. Opening the menubar
  with F10 or a pointer is not yet proven on the headless qualification rig,
  though the installed model verifies structurally.

Unit tests cover tree validation, separator collapse, the accelerator
grammar and duplicate detection, dispatch generation gating, and both host
adapters' construction and teardown.
