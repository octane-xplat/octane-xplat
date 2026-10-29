# Keyboard shortcut engine and host boundaries

`@octane-xplat/shortcuts` is an optional leaf because it owns desktop input
leases and the `@casbin/expression-eval` engine dependency. UI neither depends
on it nor re-exports it. `@octane-xplat/keyboard` continues to own software
keyboard geometry and avoidance. The public workflow is
[Add keyboard shortcuts](../../docs/app/keyboard-shortcuts.md).

## Engine origin and API choices

The local engine derives from Powerkeys 0.2.5 at
[`18ee1fd0`](https://github.com/alloc/powerkeys/tree/18ee1fd0eeee5e4430b193a55e93247d7698d758).
Its direct DOM `instanceof` checks, target listeners and platform detection
prevent using that runtime unchanged in AppKit/GJS/WinUI. Source inspection is
the evidence for this upstream boundary. The local fork injects only host
events, boundaries, editable detection, timers and platform identity; retain
upstream scope, sequence, reservation, recording and binding-set behavior.
See [attribution and local changes](../../packages/shortcuts/UPSTREAM.md).
Remove the fork when an upstream host-neutral engine can pass the retained suite.

Keep the Powerkeys operation names and separate `combo`/`sequence` descriptors.
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
- WinUI uses typed KeyEventHandler/RoutedEventHandler instances with
  `AddHandler`/`RemoveHandler`, not event-property assignment that would replace
  an existing owner. Preview key events carry scan codes and VK_PROCESSKEY;
  `GetKeyboardState` and `ToUnicodeEx` recover the active logical layout.
  [ToUnicodeEx flag 4](https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-tounicodeex)
  avoids mutating native dead-key state. Runtime source examined:
  `@nativescript/windows` 0.1.0-alpha.144, `global_fns.rs` Win32/interop helpers
  and `ns_proxy.rs` delegate construction. Pointer addresses are checked for
  safe integer representation and buffers remain closure-owned during calls.
  This is source feasibility, not live WinUI/IME qualification.
- Webviews use the browser adapter. Phone hosts and an unconfigured default
  throw on creation; import alone remains safe. OS reservations are validation
  data, not permission to intercept system-wide input. Browser reservations
  remain advisory and only suppress defaults for events delivered to the page.

## Verification

The retained Powerkeys suite and local regressions exercise registration,
availability, conflicts, sequences, blocklists, recording, rebinding, physical
matching, iframe realms and disposal. Native adapter fixtures use models and
must not be reported as AppKit or WinUI input runs.

```sh
pnpm exec turbo run test pack:check test:packed --filter=@octane-xplat/shortcuts
pnpm exec turbo run typecheck --filter=...@octane-xplat/shortcuts
pnpm exec turbo run test:e2e --filter=@octane-xplat/shortcuts
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
  -- pnpm exec turbo run test:gtk-runtime --filter=@octane-xplat/shortcuts
```

For a direct Linux SSH host, omit SHORTCUTS_GTK_VM. The runner only removes its
own temporary directory and stops its own process/display. AppKit/WinUI OS
input, all IMEs/layouts, Wayland and installed desktop consumers remain open;
the packed check proves export resolution and ambient-free Bundler/NodeNext
declarations, not those runtime contracts. Browser/device runs stay outside
the PR checks job.

The new package joins lockstep discovery. Before the first automated release,
the npm stub and trusted publisher must be configured under the final package
name using the [release procedure](releases.md#add-a-publishable-package).
