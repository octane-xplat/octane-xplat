# Install a native application menu bar on desktop

ID: app-menu
Targets: macos, linux, windows
Related APIs: @octane-xplat/app-menu, appMenu, AppMenuEntry, AppMenuRole, AppMenuOptions

## Starting point

A running experimental desktop host (AppKit, GTK4, or pinned NativeScript WinUI) whose app needs the
real OS menu bar — not an in-window DropdownMenu/ContextMenu and not a
tray/status-bar icon.

## Requirements

Install one menu bar per process with action, checkbox, separator, nested
submenu, and platform role entries plus accelerators; keep checkbox state
controlled; replace the tree through `update`; free the slot and restore the
prior bar through `dispose`.

## Acceptance criteria

- AC1: Check `supported` before installing, build a valid submenu tree, and never install a second menu while one is live.
- AC2: Use the documented accelerator grammar and keep duplicate effective accelerators out of the tree, including standard macOS application-menu keys.
- AC3: Treat checkboxes as controlled (the mark moves only through `update`), use roles for standard edit/window/quit behavior on AppKit/GTK; reject roles on Windows and supply action callbacks there. Web and mobile throw on install; Windows requires a mounted primary window and disposal before root replacement.

- AC4: On Windows, prove native pointer selection, shortcuts with the flyout closed, disabled and controlled checkbox state, nested commands, updated shortcuts and stale input after disposal. Do not infer Alt/F10 menu-bar navigation or multi-window propagation.

## Documentation

- AC1: [Install and try](../../../docs/packages/package-app-menu.md#install-and-try), [support check](../../../docs/packages/package-app-menu.md#check-support-first), [update and clean up](../../../docs/packages/package-app-menu.md#update-and-clean-up), [controller tests](../../../packages/app-menu/tests/controller.test.ts).
- AC2: [Choose the keys](../../../docs/packages/package-app-menu.md#choose-the-keys), [accelerator tests](../../../packages/app-menu/tests/accelerator.test.ts).
- AC3: [Build the menu tree](../../../docs/packages/package-app-menu.md#build-the-menu-tree), [platform limits](../../../docs/packages/package-app-menu.md#platform-support-and-limits), [macOS runtime fixture](../../../apps/macos/test/verify-app-menu.mts), [GTK runtime driver](../../../packages/app-menu/tests/gtk-runtime.mts), [packed Windows runtime driver](../../../packages/app-menu/tests/windows-runtime.mts).

- AC4: [Windows fixture](../../../packages/app-menu/tests/fixtures/menu.windows.js), [native input driver](../../../packages/app-menu/tests/fixtures/menu-driver.windows.ps1), [lifecycle tests](../../../packages/app-menu/tests/host-windows.test.ts).
