# Open a second desktop window

ID: desktop-windows
Targets: macos, linux
Related APIs: @octane-xplat/desktop, windows, DesktopWindow, app, setWindowContentResolver

## Starting point

An AppKit or GTK app that needs a regular window for an inspector or editor.

## Requirements

Resolve window content at startup. Open an independent native window and retain
its handle for close, cancellation, and forced teardown. Request quit through the native app lifecycle so every managed window can protect its work.

## Acceptance criteria

- AC1: Install a content resolver, check support, and open the intended screen with its own title and native root after the main window mounts.
- AC2: Use synchronous cancellation to keep unsaved edits open on both native and programmatic close requests. Allow a subsequent close when the edits are safe.
- AC3: Observe completion after content unmounts. Retire the handle and use forced destruction when teardown must bypass the close guard.

- AC4: Wait for host readiness. Exercise an app-level quit veto and a secondary window veto, then retry quit and observe all managed roots close before exit.

## Documentation

- AC1: [Open a second window](../../../docs/packages/package-desktop.md#open-a-second-window), [AppKit entry](../../../tools/verification/desktop-shell/app/main.macos.ts), [GTK entry](../../../tools/verification/desktop-shell/app/main.gtk.ts).
- AC2: [Close the window](../../../docs/packages/package-desktop.md#close-the-window), [native lifecycle assertions](../../../packages/desktop/tests/window/lifecycle.tsrx).
- AC3: [Close the window](../../../docs/packages/package-desktop.md#close-the-window), [native lifecycle assertions](../../../packages/desktop/tests/window/lifecycle.tsrx).
- AC4: [Wait for startup and request quit](../../../docs/packages/package-desktop.md#wait-for-startup-and-request-quit), [native lifecycle assertions](../../../packages/desktop/tests/window/lifecycle.tsrx).
