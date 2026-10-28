# Continue typing after clearing an AppKit field

ID: appkit-clear-focus
Targets: macos
Related APIs: TextInput, SearchInput

## Starting point

A search or text field with a clear affordance and an existing value.

## Acceptance criteria

- AC1: Clear requests onChange('') then onClear and requests focus on the retained input. Uncontrolled values clear; controlled display follows parent feedback. A callback that unmounts the input does not focus its detached host.
- AC2: Disabled/read-only fields omit the clear action; SearchInput shares the input path. Distinguish handler/fake-window focus requests from actual pointer/key activation, native first responder/caret/IME, accessibility and packaging.

## Documentation

- AC1: [Clear guide](../../../docs/app/primitives.md#clear-and-continue-typing-on-appkit) and [authored source cases](../../../packages/ui/src/text-controls.macos.mobile.test.tsrx). Tests unrun.
- AC2: The same guide/cases plus [target progress](../parity/appkit-progress.md#appkit-text-clear-focus) record source scope, remaining native gates and exact deferred commands.
