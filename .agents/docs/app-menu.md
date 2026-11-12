# Application menu host boundaries

`@octane-xplat/app-menu` is an optional leaf owning the OS application menu
bar. It is not the in-window menu family (`DropdownMenu`/`ContextMenu` in ui)
and not the tray/status-bar surface (`@octane-xplat/tray` owns `NSStatusItem`
and StatusNotifierItem — ownership boundaries were coordinated with that
task). The public guide is [Application menu](../../docs/packages/package-app-menu.md).

## Controller and model

One owner per process: a second live `install` throws; `dispose` frees the
slot and restores the previous bar only when ours is still installed.
Dispatch is generation-gated — every native callback carries the generation
of the normalized tree that installed it, so retired items can never invoke
stale callbacks. `update`/`dispose` called inside a dispatch are deferred
through `host.defer` (AppKit runloop turn, `GLib.idle_add`) and coalesced.
Validation is synchronous and path-aware; checkboxes are controlled — the
check mark moves only via `update`.

## AppKit host

`packages/macos-appkit/src/app-menu.ts` builds `NSMenu`/`NSMenuItem` behind
the `__xplatAppKit.installApplicationMenu` bridge (never import
`macos-node-api` from the leaf). An Objective-C action target exposes
`appMenuItemSelected:`; JS callbacks ride action-store leases carried in item
tags. Install swaps `mainMenu` before retiring old leases; retired items get
nil targets. `autoenablesItems = false`. Roles use nil-target selectors
(`copy:`, `terminate:`) so the responder chain resolves them. The automatic
application menu (About/Hide/Hide Others/Show All/Quit) is always built;
`options.macos.applicationItems` inserts between About and Hide. `quit` in
ordinary submenus is dropped — the app menu owns Cmd-Q. The CLI JSC host
still installs its standard default menu when no nib loads; a consumer
`install` replaces it cleanly and `dispose` restores it. Platform note:
this AppKit build matches key equivalents on `charactersIgnoringModifiers`
with event flags ⊆ the item mask, so ⌘N can also reach an ⌘⇧N item —
mirrored in the fixture.

## GTK host

`src/host.gtk.ts` requires the default `Gio.Application` to be a
`Gtk.Application`; otherwise `UnavailabilityError`. Every actionable node is
a `Gio.SimpleAction` named `xplat-menu-<instance>-<generation>-<nodeId>` —
per-tree names let the new generation register before the old is retired,
so the menubar never references a removed action. Checkboxes are stateful
actions; activation reports intent only. Separators become GMenu sections
(the normalized tree already collapses them). Labels escape `_` as `__` —
mnemonic labels are unsupported. Edit roles show their accelerator through
the GMenu `accel` attribute and forward activation to the focused widget's
built-in actions (`text.undo`, `clipboard.copy`, `selection.select-all`, …);
only `close`/`quit` get real app-level `set_accels_for_action` registrations
(Ctrl+W/Ctrl+Q), which is what model.ts counts in collision checks.
Deferred work uses `GLib.idle_add`. The runtime fixture needs a D-Bus
session (`xvfb-run -a dbus-run-session`) or `app.run` stalls in GApplication
registration; menubar open-via-input (F10/pointer) is unproven on the
headless rig — the GMenu model is verified structurally instead.

## Windows

`host.windows.ts` uses the pinned NativeScript core's `findCurrentWindow`
resolver (the same resolver used by `Application.run`). The distributed leaf
owns attachment; never ask consumers to expose a window through a custom global
or import from the app harness. The optional core peer is needed only on Windows.
Install after the primary window has content and dispose before root replacement
or window closure. The handle captures one window; additional windows do not
inherit the bar.

The pinned WinRT projection cannot activate `MenuBar`/`MenuBarItem`. Use a
horizontal native `StackPanel` of `Button`s and attached `MenuFlyout`s, via
`Controls.Primitives.FlyoutBase.SetAttachedFlyout`/`ShowAttachedFlyout`.
Detached `ShowAt` crashed the earlier probe. A two-row grid wraps the original
window content without changing its attached Grid.Row; disposal restores content
only if our wrapper still owns the window. Whole-tree updates replace only the
bar child, retaining the content subtree and its focus.

Register `KeyboardAccelerator`s on the content wrapper so commands work with
flyouts closed; item accelerators provide native labels and open-flyout behavior.
`Invoked` is the generic delegate
``Windows.Foundation.TypedEventHandler`2<Microsoft.UI.Xaml.Input.KeyboardAccelerator,Microsoft.UI.Xaml.Input.KeyboardAcceleratorInvokedEventArgs>``
(the backtick before 2 is part of its WinRT name), not a named
`KeyboardAcceleratorInvokedEventHandler`. Mark handled only on accepted dispatch.
Every callback checks tree activity, window ownership and controller generation.
Retirement hides flyouts, removes delegates and detaches attached flyouts;
disposal clears root shortcuts. Native toggles reset to their controlled value
before reporting intent.

Windows rejects all role entries during model validation, before a native write
or logical tree replacement. The projection has no responder-chain equivalent,
and older host builds crash on application Exit; do not invent role support.
Apps provide their own action callbacks. Alt/F10 menu-bar semantics and automatic
multi-window propagation are not implemented.

Use the maintained packed-package driver in
`packages/app-menu/tests/windows-runtime.mts` with the runtime path and SSH host
shown in its public guide. It uses UI Automation text/structure and native
SendInput; it neither captures nor analyzes images. The driver uses right Control
for ordinary chords and left Control for Control+Alt chords: the pinned host's
injected key path did not dispatch ordinary left-Control chords or right-Control
+Alt consistently. Keep that limitation visible; this is not qualification of
physical keyboards or other layouts. Investigate the upstream input path before
broadening the keyboard claim. Runtime results belong in Silo and local reports.
