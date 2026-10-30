# Keyboard shortcut engine and host boundaries

`@octane-xplat/shortcuts` is an optional leaf because it owns desktop input
leases and the `@casbin/expression-eval` engine dependency. UI neither depends
on it nor re-exports it. `@octane-xplat/keyboard` continues to own software
keyboard geometry and avoidance. The public workflow is
[Add keyboard shortcuts](../../docs/app/keyboard-shortcuts.md); the complete
[API reference](../../docs/app/keyboard-shortcuts-api.md) owns method, option and
result lookup. Its examples and exported-type coverage are checked by
`turbo run test:docs --filter=@octane-xplat/shortcuts`.

## Engine and API boundaries

The shared engine handles parsing, scopes, conflicts, sequences, reservations,
recording and binding sets. Host adapters supply events, boundaries, editable
detection, timers and platform identity.

Keep separate `combo`/`sequence` descriptors.
The shared target is an opaque host object, and callbacks expose a structural
event without DOM types. An optional `platform` override makes `Mod` resolution
deterministic without changing defaults. Explicit physical codes must not fall
back to a logical match on a different position. Application commands, menu
presentation, settings persistence and global OS hotkeys remain app/service
concerns.

## Desktop host constraints

- AppKit uses the renderer's `__xplatAppKit.observeViewKeys` lease, preserving
  the single monitor, field-editor ownership, event scopes and FocusScope
  ordering. It requires an attached renderer-owned view. The existing monitor
  handles key down/up only, not `flagsChanged`; extended codes remain limited
  by the renderer map. Do not install another independent AppKit monitor in
  production. Recreate the runtime when its view changes windows.
- GTK4 uses `EventControllerLegacy` at bubble phase. This is necessary because
  [EventControllerKey::key-released](https://docs.gtk.org/gtk4/signal.EventControllerKey.key-released.html)
  has no cancellation result. Native editors and their IM contexts get input
  first; input they consume cannot reach shortcuts. `handled` cannot separate
  stopping propagation from cancelling native input. Linux physical positions
  use XKB's evdev+8 keycodes. GJS timers use GLib directly.
- WinUI uses typed KeyEventHandler/RoutedEventHandler instances through the
  pinned NativeScript core `subscribeNativeEvent` helper, exposed through the
  host-owned `__xplatWindowsEvents.subscribe` bridge. Production shortcuts do
  not deep-import core: a separate bundle copy would have another listener
  registry. The runtime rejects
  `AddHandler` with `E_NOINTERFACE` (0x80004002) on a real attached element;
  the helper shares its replacement-only event-property fallback with other
  owners. It is supplied by
  [the Windows core patch](../../packages/cli/patches/@nativescript__core@9.1.4-next.0.patch).
  The package declares core as an optional peer; Windows consumers must use
  this framework's pinned preview and patch, not an arbitrary stable core.
  Preview events carry scan codes and VK_PROCESSKEY; `GetKeyboardState` and
  `ToUnicodeEx` recover the active layout. ToUnicodeEx flag 4 avoids changing
  the editor's dead-key state. Pointer addresses are checked for safe integer
  representation and buffers remain closure-owned during calls. Native
  `GetType()?.FullName` is unavailable on the tested projection; editable
  ancestors are identified using the projected control constructors instead.
- Webviews use the browser adapter. Phone hosts and an unconfigured default
  throw on creation; import alone remains safe. OS reservations are validation
  data, not permission to intercept system-wide input. Browser reservations
  remain advisory and only suppress defaults for events delivered to the page.

## Verification

The engine suite and host regressions exercise registration,
availability, conflicts, sequences, blocklists, recording, rebinding, physical
matching, iframe realms and disposal. Native adapter unit fixtures use models. The separate desktop runners below
exercise the actual native adapters and their engine.

```sh
bun run turbo run test pack:check test:packed --filter=@octane-xplat/shortcuts
bun run turbo run typecheck --filter=...@octane-xplat/shortcuts
bun run turbo run test:e2e --filter=@octane-xplat/shortcuts
```

The Chromium check uses browser keyboard input, asserts native-default text
prevention and target boundaries, and creates no screenshots. The GTK runner
bundles the real adapter and engine, enters a task-owned Xvfb display on Linux,
and injects X11 keys with xdotool. On andromeda.local's octane-linux VM it
passes physical Ctrl+K, a context-gated command, `g i`, recording and disposal.
GLib owns recording timing. EGL/AT-SPI environment warnings do not change the
assertions; accessibility behavior was not tested.

```sh
SHORTCUTS_GTK_HOST=andromeda.local SHORTCUTS_GTK_VM=octane-linux \
  goddard-agent resource run --json '{"resources":{"exclusive":["linux:octane-linux"],"resident_devices":1},"purpose":"isolated GTK shortcut input"}' \
  -- bun run turbo run test:gtk-runtime --filter=@octane-xplat/shortcuts
```

For a direct Linux SSH host, omit SHORTCUTS_GTK_VM. The runner only removes its
own temporary directory and stops its own process/display.

The AppKit runner bundles current source with the real renderer and transfers
its checksum-tracked JSC host/SDK to a temporary directory on the SSH host.
On skymac.local, queued NSEvents pass Mod/physical matching, context/when,
boundary selection, sequences, editable native text/default prevention,
recording consumption and disposal. This exposed method-projected
`NSEvent.isARepeat`: coercing the function to boolean marked every initial
press as a repeat. The renderer now calls the method while retaining property
projection support. AppKit editable detection also checks the active field
editor rather than assuming every NSControl with a currentEditor method is
a text input. A real NSButton check guards that distinction. This proves native event-queue routing, not physical OS
input or IMEs.

```sh
SHORTCUTS_MACOS_HOST=skymac.local \
  goddard-agent resource run --json '{"resources":{"exclusive":["device:skymac"],"desktop_input":1},"purpose":"AppKit shortcut queue"}' \
  -- bun run turbo run test:shortcuts-runtime --filter=@xplat/macos
```

The WinUI runner uses a compiled NativeScript Windows runtime directory on the
SSH host. It copies that directory, registers a unique development app identity
in an interactive scheduled task, injects scan-code keys using SendInput, and
removes its own registration, process, task and temporary files. No native
compilation or replacement of the host's app is needed. On windy, it passes
physical Control+K, context/when, sequences, recording, editable input/default
prevention, boundary selection and disposal. Right Control avoids the host's
observed left-Control-to-Alt remapping; system input configuration is untouched.
The tested runtime is @nativescript/windows 0.1.0-alpha.144 with the framework's
core 9.1.4-next.0 Windows patch. A development-mode interactive user session is
required. The path below names an existing compiled runtime, not a new build.

```sh
SHORTCUTS_WINDOWS_HOST=windy \
SHORTCUTS_WINDOWS_RUNTIME='C:\Users\alecs\dev\octane-xplat\apps\windows\platforms\windows\windows\bin\x64\Release\net10.0-windows10.0.26100.0\win-x64' \
  goddard-agent resource run --json '{"resources":{"exclusive":["device:windy"],"desktop_input":1},"purpose":"WinUI shortcut input"}' \
  -- bun run turbo run test:windows-runtime --filter=@octane-xplat/shortcuts
```

All IMEs/layouts, physical AppKit input, Wayland and installed desktop consumers
remain open. The packed check proves export resolution and ambient-free
Bundler/NodeNext declarations, not those runtime contracts. Browser/device
runs stay outside the PR checks job.

The new package joins lockstep discovery. Before the first automated release,
the npm stub and trusted publisher must be configured under the final package
name using the [release procedure](releases.md#add-a-publishable-package).
