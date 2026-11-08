# Global shortcuts

> System-wide hotkeys that reach your desktop app while it is in the background

A global shortcut is a key combination the operating system watches for every
app. Press it while another app is in front, and your desktop app still hears
it. Quick-entry windows, push-to-talk buttons and screenshot tools use this.

`@octane-xplat/global-shortcuts` registers these on macOS, Windows and Linux.
It is separate from [`@octane-xplat/shortcuts`](package-shortcuts.md), which
handles keys only while your app's window has focus. Use that package for
in-app commands and this one only for the few actions that must work from
anywhere.

[Generated API reference](https://octane-xplat.goddardai.org/api-global-shortcuts).

## Install and try

After the package's first framework release, run this in your app directory.
Keep its version aligned with your other Xplat packages.

```sh
bun add @octane-xplat/global-shortcuts
```

Put this in your desktop app's startup code. It registers Command+Shift+Space
on macOS, or Control+Shift+Space on Windows and Linux. Switch to another app
and press it: your app prints “Show quick entry”.

```ts
import { createGlobalShortcuts } from '@octane-xplat/global-shortcuts'

const globalShortcuts = createGlobalShortcuts()

export async function installQuickEntry() {
  const result = await globalShortcuts.register({
    id: 'quick-entry',
    accelerator: 'Mod+Shift+Space',
    description: 'Show quick entry',
    onPress: () => console.log('Show quick entry'),
  })
  if (!result.ok) console.warn(result.error.message)
}

// Call when the app's owner shuts down or this module is replaced.
export const disposeQuickEntry = () => globalShortcuts.dispose()
```

`register` never throws for an ordinary refusal. It returns `ok: false` with an
error you can show, as described in [handle refusals](#handle-refusals). Your
app only hears the combinations it registered; it does not see other typing.

## Check support first

Browsers, iPhones, iPads and Android phones have no system-wide hotkeys. On
those targets the package still imports, reports `supported: false`, and every
`register` call returns the `unsupported` error. Check support before you show
a “global shortcut” setting.

```ts
import { getGlobalShortcutSupport } from '@octane-xplat/global-shortcuts'

const support = await getGlobalShortcutSupport()
if (!support.supported) {
  console.log('Global shortcuts are unavailable:', support.reason)
} else if (support.assignment === 'desktop') {
  console.log('The desktop may ask the person to confirm or change the keys')
}
```

`assignment: 'exact'` means the OS registers exactly the keys you asked for
(macOS and Windows). `'desktop'` means the Linux desktop decides: it may ask
the person, and it may assign different keys. Show the `trigger` text from the
result, as in the next example, rather than your requested accelerator.

## Choose the keys

An accelerator names modifiers and one key joined by `+`. `Mod` means Command
on macOS and Control elsewhere. Keys use physical positions such as `KeyK`,
`Digit1`, `Space`, `F5` or `ArrowUp`, so `Mod+KeyK` stays on the same key on any
keyboard layout. A single letter such as `k` is rejected with a message that
suggests `KeyK`.

```ts
import { parseAccelerator } from '@octane-xplat/global-shortcuts'

const parsed = parseAccelerator('mod+shift+keyk', { platform: 'windows' })
if (parsed.ok) console.log(parsed.accelerator.text) // "Ctrl+Shift+KeyK"
else console.log(parsed.error.message)
```

Every accelerator needs Control, Alt (Option) or Meta (Command, Windows key or
Super). Shift alone is not enough, because it would steal ordinary typing. The
one exception is `F13` through `F24`, which can be used without modifiers.
Modifier names are case-insensitive, and the normalized text always lists them
as `Ctrl+Alt+Shift+Meta`.

Use `parseAccelerator` to check a preference a person typed before you save it.
It applies the current platform's rules unless you pass `platform`.

## Handle refusals

A refusal has a `code` your app can branch on and a `message` you can show.

| Code | Meaning |
| --- | --- |
| `invalid-accelerator` | The text isn't a usable accelerator on this platform. |
| `reserved` | The system keeps these keys for itself, such as Command+Tab. |
| `conflict` | Another app, or another registration in your app, already has them. |
| `duplicate-id` | This `GlobalShortcuts` object already uses the `id`. |
| `denied` | The desktop or the person declined it (Linux). |
| `unavailable` | The system service failed or isn't ready. |
| `unsupported` | This target has no system-wide hotkeys. |
| `disposed` | The `GlobalShortcuts` object was disposed. |

This settings helper tries a person's choice and reports what happened. A
successful result includes `trigger`, the label the system reports for the keys.

```ts
// Continue with the globalShortcuts object from the first example.
export async function applyShortcutPreference(accelerator: string) {
  await globalShortcuts.unregister('quick-entry')
  const result = await globalShortcuts.register({
    id: 'quick-entry',
    accelerator,
    description: 'Show quick entry',
    onPress: () => console.log('Show quick entry'),
  })
  if (result.ok) return `Saved: ${result.shortcut.trigger}`
  if (result.error.code === 'conflict') return 'Another app already uses those keys.'
  return result.error.message
}
```

## Clean up

Each registration lasts until you release it. `unregister(id)` and
`result.shortcut.unregister()` release one; `unregisterAll()` releases them all
while keeping the object usable. `dispose()` releases everything and makes later
`register` calls return `disposed`. Calling `dispose()` twice is harmless.

```ts
// Continue with the globalShortcuts object from the first example.
await globalShortcuts.unregister('quick-entry')
console.log(globalShortcuts.list().length) // 0
await globalShortcuts.dispose()
```

The package also releases its registrations when the app quits, and the OS
drops them when the process ends. If `onPress` throws, the error goes to the
`onError` option, or is reported as an uncaught error when you don't pass one.
Later presses still arrive.

```ts
import { createGlobalShortcuts } from '@octane-xplat/global-shortcuts'

const globalShortcuts = createGlobalShortcuts({
  onError: (error) => console.error('Global shortcut failed', error),
})
```

## Platform support and limits

Desktop hosts are experimental. This table describes what each one uses and
what it needs from you.

| Target | How it works | What to know |
| --- | --- | --- |
| macOS (AppKit host) | Carbon `RegisterEventHotKey`. No permission prompt. | Enabled System Settings shortcuts (Command+Tab, Spotlight, screenshots) return `reserved`. Registration is exclusive, so another app's identical hotkey returns `conflict`. `F21`–`F24` don't exist. Laptop function keys may need the fn key. |
| Windows (WinUI host) | `RegisterHotKey` on a package-owned background thread. No permission prompt. | Ctrl+Alt+Delete, Windows+L and any `F12` combination are `reserved`. Many Windows-key combinations belong to Windows and return `conflict`. `NumpadEnter` can't be told apart from Enter. The first registration starts the thread and can pause the app briefly. Requires the framework's pinned NativeScript Windows host. |
| Linux (GTK4/GJS host) | The desktop's XDG GlobalShortcuts portal, on Wayland and X11 alike. | The desktop owns the keys: it may ask the person, assign different keys, or let them change keys later in its settings. Desktops without the portal report unsupported. Your app needs an application ID with a matching installed `.desktop` file. |
| Web, iOS, Android | None. | `supported: false`; `register` returns `unsupported`. |

On Linux, the package uses the GTK application's ID. Pass `appId` when your
process has no default `Gio.Application`. The first ID a process uses is kept;
the desktop stores the person's chosen keys under that ID and each shortcut `id`.

```ts
import { createGlobalShortcuts } from '@octane-xplat/global-shortcuts'

const globalShortcuts = createGlobalShortcuts({ appId: 'com.example.QuickNotes' })
```

Linux has no fallback that grabs keys directly from X11. Desktops differ in
which versions provide the portal. Older desktops, such as Ubuntu 24.04's
Plasma 5.27 with portal 1.18, accept the request from an unpackaged app
but bind nothing; the result is `denied`. KDE Plasma may open its shortcut
settings when an app adds shortcuts.

Apps rendered in a system WebView run their screens as web content, which
reports unsupported. Only native desktop host code can register global
shortcuts.

## What has been tested

Verified on this release:

- **macOS (AppKit host):** registration, real OS input delivered to an
  unfocused app through `CGEventPost` into the WindowServer, duplicate-accelerator
  conflicts, `Meta+Tab` reserved rejection, and no delivery after `unregister` —
  in the packaged NativeScript host.
- **Linux (GTK4/GJS host):** portal `CreateSession`/`BindShortcuts` returning a
  desktop-assigned trigger, real X11 input activating the shortcut while a
  foreign window held focus under KDE Plasma 6 (`xdg-desktop-portal` 1.20,
  `kglobalacceld` 6.3), and no activation after session close.
- **Windows (WinUI host):** `RegisterHotKey` on the worker thread receives
  `WM_HOTKEY` for externally injected input; the packaged worker/pipe path is
  covered by the runtime fixture but has not yet been qualified end-to-end —
  treat Windows as experimental.
- **Unit and consumer coverage:** parser/normalization tables, registry
  lifecycle and dispose races, reserved accelerators, cross-instance conflicts,
  unsupported-host refusals, and a packed-consumer resolution check across all
  export conditions.
