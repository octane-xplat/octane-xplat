# Handle hardware keys and copy text with feedback

ID: keyboard-clipboard
Targets: web, ios, android, macos
Related APIs: useKeyboard, KeyboardEvent, useClipboard, copyText

## Starting point

An Octane screen with a copy action, or a web leaf with a focusable DOM element.

## Requirements

Attach supported event handlers and observe copy failures without assuming
hardware-key support on native hosts.

## Acceptance criteria

- AC1: Attach normalized key handlers to a focusable DOM element and distinguish key, code, modifiers, repeat, composition, and prevention; discover unsupported native attachments.
- AC2: Attach a text-copy trigger to Pressable, observe success/failure, and await independent attempts; distinguish text copying from paste and rich clipboard formats.
- AC3: Migrate previous unknown-event handlers and void-return copy actions; understand that host tests do not establish OS input or clipboard permissions.

## Documentation

- AC1: [Hardware keys](../../../docs/app/keyboard-clipboard.md#handle-hardware-keys-on-web-and-linux) and [web example](../../../packages/ui/examples/KeyboardDemo.web.tsrx).
- AC2: [Copy feedback](../../../docs/app/keyboard-clipboard.md#copy-text-with-feedback) and [visible example](../../../packages/ui/examples/CopyTextDemo.tsrx).
- AC3: [Migration](../../../docs/app/keyboard-clipboard.md#migrate-existing-handlers). Maintained host tests cover normalization and mocked write outcomes; OS key dispatch and clipboard permissions remain unqualified.
