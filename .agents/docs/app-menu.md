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

`src/host.windows.ts` reports unsupported — proven, not merely unqualified.
An interactive fixture on windy (AppX + UIA + SendInput, run under
`goddard-agent resource run`) showed `MenuFlyoutItem`,
`KeyboardAccelerator`, and click handlers all work on the pinned
NativeScript Windows host, but `Microsoft.UI.Xaml.Controls.MenuBar` and
`MenuBarItem` fail `ActivateInstance` with `Not implemented` — the pinned
WinRT projection does not ship the in-window menu bar control, and Windows
has no global menubar alternative. Raw Win32 does work on this host —
the tray task proved `Shell_NotifyIconW`/`TrackPopupMenu` end-to-end — so a
classic `SetMenu` window bar is a theoretical avenue, but bolting a Win32
menu onto a XAML window is layout-hostile and unusual enough that it is not
the right default. Supporting Windows therefore waits for either the
projection to grow MenuBar/MenuBarItem or a deliberate from-scratch widget. Probe artifacts live in
`research/app-menu-windows-probe/` (bundle.mjs exercises every control;
run.mjs handles the interactive scheduled-task dance — session-1 process
init needs the interactive session healthy and `< NUL` on the action's
stdin).
