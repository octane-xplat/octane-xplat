# Add a system-wide hotkey for a background action

ID: global-shortcuts
Targets: macos, linux, windows
Related APIs: @octane-xplat/global-shortcuts, createGlobalShortcuts, getGlobalShortcutSupport, parseAccelerator, GlobalShortcutResult

## Starting point

A running experimental native desktop host (AppKit, WinUI or GTK4) with an
app-owned action that should run while the app is unfocused or backgrounded.

## Requirements

Register an OS-level accelerator without colliding with system or
cross-process reservations. Report conflicts and denials to the user, own the
registration for the feature's lifetime, and release it on dispose and app
exit.

## Acceptance criteria

- AC1: Install the optional package, check support before showing settings, register/unregister with a stable id, and dispose with the owner.
- AC2: Author accelerators with physical key codes and `Mod`, validate stored preferences with `parseAccelerator`, and show the desktop-assigned trigger.
- AC3: Branch on structured refusal codes (conflict, reserved, denied, unsupported) and understand per-platform limits (Wayland/X11 portal policy, reserved keys, app-id requirements).

## Documentation

- AC1: [Install and try](../../../docs/packages/package-global-shortcuts.md#install-and-try), [support check](../../../docs/packages/package-global-shortcuts.md#check-support-first), [cleanup](../../../docs/packages/package-global-shortcuts.md#clean-up), [workspace example](../../../packages/global-shortcuts/examples/quick-entry.ts).
- AC2: [Choose the keys](../../../docs/packages/package-global-shortcuts.md#choose-the-keys), [parser tests](../../../packages/global-shortcuts/tests/accelerator.test.ts).
- AC3: [Handle refusals](../../../docs/packages/package-global-shortcuts.md#handle-refusals), [platform limits](../../../docs/packages/package-global-shortcuts.md#platform-support-and-limits), [registry tests](../../../packages/global-shortcuts/tests/registry.test.ts).
