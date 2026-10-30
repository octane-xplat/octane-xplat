# Add configurable workspace shortcuts

ID: keyboard-shortcuts
Targets: web, macos, linux, windows
Related APIs: @octane-xplat/shortcuts, createShortcuts, ShortcutRuntime, BindingSet, ShortcutEvent

## Starting point

A running browser app or experimental native desktop host, with a mounted
workspace boundary and app-owned actions.

## Requirements

Register scoped shortcuts without stealing ordinary typing. Record and apply
user preferences, own listeners for the target's lifetime, and distinguish
supported input from unqualified native behavior.

## Acceptance criteria

- AC1: Install the optional package, select the correct host, attach to a mounted boundary, reject unsupported hosts, and dispose/recreate with the target owner.
- AC2: Distinguish logical keys from physical codes, register combos/sequences, preserve editable input/composition, and understand repeats, consumption and native-host limits.
- AC3: Combine scopes, context and when clauses; reuse action availability, filter dispatch candidates, and understand conflict ordering and balanced pauses.
- AC4: Record/cancel a shortcut and handle errors, validate reservations, atomically replace user bindings, and inspect dispatch decisions.

## Documentation

- AC1: [Installation and ownership](../../../docs/app/keyboard-shortcuts.md#open-your-command-menu), [native boundaries](../../../docs/app/keyboard-shortcuts.md#native-desktop-boundaries), [workspace installer](../../../packages/shortcuts/examples/workspace.ts), [API reference](../../../docs/app/keyboard-shortcuts-api.md).
- AC2: [Keys and typing](../../../docs/app/keyboard-shortcuts.md#choose-keys-and-protect-typing), [host boundaries](../../../docs/app/keyboard-shortcuts.md#native-desktop-boundaries), [browser input fixture](../../../packages/shortcuts/tests/fixtures/index.html), [GTK input fixture](../../../packages/shortcuts/tests/fixtures/input.gtk.js), [AppKit native-event fixture](../../../apps/macos/test/shortcuts-fixture.macos.tsx), [WinUI input fixture](../../../packages/shortcuts/tests/fixtures/input.windows.js).
- AC3: [Scoped actions](../../../docs/app/keyboard-shortcuts.md#put-dialog-commands-above-editor-commands), [workspace installer](../../../packages/shortcuts/examples/workspace.ts), [API reference](../../../docs/app/keyboard-shortcuts-api.md).
- AC4: [Recording and rebinding](../../../docs/app/keyboard-shortcuts.md#record-and-replace-a-saved-shortcut), [runtime regressions](../../../packages/shortcuts/tests/runtime.web.test.ts), [recording API](../../../docs/app/keyboard-shortcuts-api.md#recording), [diagnostic types](../../../docs/app/keyboard-shortcuts-api.md#inspection).
