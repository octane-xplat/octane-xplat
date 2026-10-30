# Add keyboard shortcuts

> Give a workspace keyboard commands, then let people choose their own bindings.

Start with a running web app. The optional `@octane-xplat/shortcuts` package
also has adapters for experimental AppKit, GTK4, and WinUI hosts. It handles
input inside your app; operating-system global hotkeys require a separate service.

For exact signatures, defaults, result fields and lifecycle rules, see the
[keyboard shortcuts API reference](keyboard-shortcuts-api.md).

## Open your command menu

After the package's first framework release, run this in your app directory.
Keep its version aligned with your other Xplat packages.

```sh
pnpm add @octane-xplat/shortcuts
```

Add this installer to a `.web.ts` file and call it from your browser entry.
`Mod` means Command on macOS and Control elsewhere. After installation, the
shortcut prints “Open commands”, including when a text field has focus.

```ts
import { createShortcuts } from '@octane-xplat/shortcuts'

export function installShortcuts() {
  const shortcuts = createShortcuts({ target: document })
  shortcuts.bind({
    combo: 'Mod+k',
    editablePolicy: 'allow-if-meta',
    preventDefault: true,
    handler: () => console.log('Open commands'),
  })
  return () => shortcuts.dispose()
}

const dispose = installShortcuts()
if (import.meta.hot) import.meta.hot.dispose(dispose)
```

Use `target: element` to limit the runtime to a subtree. On native desktop,
pass an attached host view through the same installer shape. Create it after
mounting and dispose it before the view detaches, closes, or changes windows;
create another runtime for the new owner. A missing or unsupported host throws.

```ts
import { createShortcuts } from '@octane-xplat/shortcuts'

export function attachWorkspace(target: object) {
  const shortcuts = createShortcuts({ target })
  shortcuts.bind('Mod+KeyK', () => console.log('Open commands'))
  return () => shortcuts.dispose()
}
```

## Choose keys and protect typing

A combo is one key press with modifiers; a sequence is several presses.
Letter names such as `k` follow the keyboard layout. Explicit codes such as
`KeyK`, `Digit1`, `Slash`, and `NumpadEnter` follow physical positions.
`Plus` names the `+` character. Alt+letter/digit bindings also match their
physical position, including when Option produces a symbol.

```ts
// Continue with an existing shortcuts runtime.
shortcuts.bind('Mod+KeyK', () => console.log('Physical K position'))
shortcuts.bind({ sequence: 'g i', handler: () => console.log('Open inbox') })
shortcuts.bind('Shift+Plus', () => console.log('Increase size'))
```

Bindings ignore editable targets and held-key repeats by default. Opt in for
commands that belong in text fields. Composition events never dispatch bindings;
recording still observes delivered composition events.

```ts
shortcuts.bind({
  combo: 'Mod+s',
  editablePolicy: 'allow-if-meta',
  preventDefault: true,
  handler: () => console.log('Save'),
})
shortcuts.bind({ combo: 'ArrowDown', allowRepeat: true, handler: () => console.log('Next row') })
```

## Put dialog commands above editor commands

A scope is a named layer. Return active layers from highest to lowest;
`root` is always included. Use `when` for smaller state changes within a layer,
and reuse that availability rule in a menu or command palette.

```ts
import { createShortcuts } from '@octane-xplat/shortcuts'

let dialogOpen = false
const shortcuts = createShortcuts({
  target: document,
  getActiveScopes: () => dialogOpen ? ['dialog', 'editor'] : ['editor'],
})
shortcuts.setContext('editor.readOnly', false)
const saveRule = { scope: 'editor', when: '!editor.readOnly' }
shortcuts.bind({ ...saveRule, combo: 'Mod+s', handler: () => console.log('Save') })
console.log(shortcuts.isAvailable(saveRule))
```

`isAvailable` checks scope and `when`, independently of keyboard pause state
and editable targets. Use `canDispatch` for checks such as whether the active
screen has a handler. A rejected candidate lets another binding win.

```ts
import { createShortcuts } from '@octane-xplat/shortcuts'

const unavailableHandlers = new Set<Function>()
const shortcuts = createShortcuts({
  target: document,
  canDispatch: candidate => !unavailableHandlers.has(candidate.handler),
})
```

Only one binding wins each event. Priority wins first, then a completed
sequence, longer sequences, earlier active scopes, narrower `within` boundaries,
and later registration. A binding set retains its registration position when
replaced. Pause calls are counted and need matching resumes.

```ts
shortcuts.pause('editor')
// While a temporary interaction owns the editor's keys…
shortcuts.resume('editor')
// Limit a command to one host subtree inside this runtime:
function bindEditor(editor: object) {
  return shortcuts.bindWithin(editor, 'Mod+Enter', () => console.log('Submit'))
}
```

## Record and replace a saved shortcut

Start recording from a settings action, then save its expression in your app's
preferences. Recording ends after one second of inactivity by default; a
cancelled session rejects with `AbortError`. Dispose the owning runtime on close.

```ts
async function chooseShortcut() {
  const session = shortcuts.record({ consumeEvents: true, timeout: 1000 })
  try {
    const recording = await session.finished
    console.log('Save this preference:', recording.expression)
  } catch (error) {
    if (!(error instanceof Error) || error.name !== 'AbortError') throw error
  }
}
```

Use a binding set to replace user preferences atomically. If a new binding is
invalid, replacement throws and the previous set stays active. A successful
replacement clears sequences started by the previous set.

```ts
const userBindings = shortcuts.createBindingSet()
function applyPreference(expression: string) {
  userBindings.replace([{ sequence: expression, handler: () => console.log('User command') }])
}
applyPreference('Ctrl+k Ctrl+c')
```

Validate individual combos against your chosen reservations before saving.
OS reservations report conflicts without intercepting system input. Browser
reservations attempt to cancel delivered browser defaults; some shortcuts
never reach the page. Presets are snapshots, so review the defaults for your host.

```ts
import { createShortcuts, commonBrowserShortcuts, macOsShortcuts } from '@octane-xplat/shortcuts'

const shortcuts = createShortcuts({
  target: document,
  blocklist: [...commonBrowserShortcuts, ...macOsShortcuts],
})
console.log(shortcuts.validateShortcut('Mod+w'))
// For a sequence, validate each recorded step separately.
```

Use `explain` on a delivered event to inspect a decision without dispatching
handlers or advancing a sequence. Keep dispatch guards free of side effects,
because explanation also evaluates them. Registration errors throw synchronously;
handler and recording errors go to `onError` or are rethrown asynchronously.

```ts
function inspectLastKey(event: import('@octane-xplat/shortcuts').ShortcutEvent) {
  console.log(shortcuts.explain(event))
}
```

## Native desktop boundaries

| Host | Target and behavior |
| --- | --- |
| Browser and desktop webviews | Document or DOM element. The browser adapter also accepts iframe realms. |
| AppKit | An attached renderer-owned NSView. Shares the renderer's key monitor, field-editor routing and focus-scope ordering. Modifier-only `flagsChanged` events remain unavailable. |
| GTK4/GJS | An attached GTK widget. Runs after native editors filter input; shortcuts consumed by a focused widget or IME are unavailable. Physical codes use Linux XKB/evdev positions. |
| WinUI | An attached UIElement, or a NativeScript view wrapping it. Uses preview routed events, scan codes and the active Windows text layout. Requires NativeScript's Win32 projection and the framework's patched core event subscription helper. |
| iOS, Android, and unconfigured hosts | Creation throws; importing the package itself is safe. |

Use the normal platform preset to select the adapter. Chromium, Linux GTK/X11
and WinUI have nonvisual input checks; AppKit has a queued native-event check
through its renderer. Desktop hosts remain experimental: these checks do not
establish physical AppKit input, Wayland, every keyboard layout, every IME or
installed-app integration. Pure-modifier recording is excluded on every host.

WinUI requires the pinned Windows host and patched NativeScript core supplied
with the framework. Its optional NativeScript peer is unnecessary on web,
AppKit and GTK. Register after the native element attaches to its window.

```ts
import { createShortcuts } from '@octane-xplat/shortcuts'

export function attachDesktopShortcuts(target: object) {
	const shortcuts = createShortcuts({ target })
	shortcuts.bind('Mod+KeyK', () => console.log('Open commands'))
	return () => shortcuts.dispose()
}
```

GTK and WinUI use one native “handled” result for event consumption. On those
hosts, stopping propagation also stops native handling. AppKit and the browser
can distinguish propagation from default prevention. Unmapped physical codes
are empty strings; do not infer that a key position exists on every keyboard.
