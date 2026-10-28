# Handle hardware keys and copy text with feedback

ID: keyboard-clipboard
Targets: web, ios, android, macos
Related APIs: useKeyboard, KeyboardEvent, useClipboard, copyText, Slider, useFocusVisible, isFocusVisible, useFocusRing

## Starting point

An Octane screen with a copy action, or a web leaf with a focusable DOM element.

## Requirements

Attach supported event handlers and observe copy failures without assuming
hardware-key support on native hosts.

## Acceptance criteria

- AC1: Attach normalized key handlers to a focusable DOM element and distinguish key, code, modifiers, repeat, composition, and prevention; discover unsupported native attachments.
- AC2: Attach a text-copy trigger to Pressable, observe success/failure, and await independent attempts; distinguish text copying from paste and rich clipboard formats.
- AC3: Migrate previous unknown-event handlers and void-return copy actions; understand that host tests do not establish OS input or clipboard permissions.
- AC4: On web, a controlled Slider supports Tab, bounded Arrow adjustments in increments of 1% of its range, and Home/End. Disabled sliders are skipped and do not change value.
- AC5: On AppKit, distinguish keyboard/pointer/unknown modality, preserve native event delivery and shortcuts, clear modality on app deactivation, share/release hook subscriptions, and distinguish bridge availability from OS input/focus-ring qualification. Understand the module lifetime of synchronous global reads and the remaining mobile limitation.

## Documentation

- AC1: [Hardware keys](../../../docs/app/keyboard-clipboard.md#handle-hardware-keys-on-web-and-linux) and [web example](../../../packages/ui/examples/KeyboardDemo.web.tsrx).
- AC2: [Copy feedback](../../../docs/app/keyboard-clipboard.md#copy-text-with-feedback) and [visible example](../../../packages/ui/examples/CopyTextDemo.tsrx).
- AC3: [Migration](../../../docs/app/keyboard-clipboard.md#migrate-existing-handlers). Maintained host tests cover normalization and mocked write outcomes; OS key dispatch and clipboard permissions remain unqualified.
- AC4: [Input components](../../../docs/app/components.md#inputs), [component regressions](../../../packages/ui/src/Slider.web.test.tsrx), and [browser input checks](../../../apps/web/scripts/input-readiness.ts).
- AC5: [Focus behavior](../../../docs/app/primitives.md#focus-behavior), [AppKit source regressions](../../../packages/ui/src/focus-visible-source.macos.test.ts) and [maintained probe](../../../examples/probes/focus-modality.macos.tsrx). Gap: actual OS key/mouse input, hook rerender, focus callbacks, focus appearance and VoiceOver have not run.
