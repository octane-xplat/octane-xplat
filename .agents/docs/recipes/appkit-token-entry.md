# Remove current AppKit tokens from an empty input

ID: appkit-token-entry
Targets: macos
Related APIs: Tokenizer, TokenizerHandle, renderToken, onChange

## Starting point

A controlled people/tag picker like ComponentsDemo and the sandbox's token-entry
examples, including an embedded action. AppKit support remains experimental.

## Requirements

Remove the current AppKit token from an empty input with Backspace and expose a
stable handle, with owned key dispatch and blur.

## Acceptance criteria

- AC1: Route empty-input Backspace through the current input/editor key owner. Preserve nonempty query/native text, composing and modified editing; use the current last token and metadata. Current disabled/read-only/inherited blocking, removed keys, callback reentry and teardown reject mutations.
- AC2: Expose one stable live public handle. Pointer removal respects callback-driven focus changes. Delayed blur uses the latest callback, cancels stale work and retains wrapper/panel descendant focus.
- AC3: Keep authored source/fake dispatch separate from actual OS keys/repeat/IME/editor/blur/popup/AX and packaging. Overflow geometry has a separate AppKit source slice and still needs native qualification.

## Documentation

- AC1: [Guide](../../../docs/app/search-selection.md#remove-appkit-tokens-with-empty-input-backspace), [target leaf](../../../packages/ui/src/components/forms/Tokenizer.macos.tsrx), seven [authored cases](../../../packages/ui/src/components/forms/tokenizer-keys.macos.mobile.test.tsrx) and [manual fixture](../../../examples/probes/tokenizer-keys.macos.tsrx).
- AC2: The same [source](../../../packages/ui/src/components/forms/Tokenizer.macos.tsrx)/[cases](../../../packages/ui/src/components/forms/tokenizer-keys.macos.mobile.test.tsrx) document current identities, callback-driven focus, handle replacement/teardown and delayed embedded-focus blur. Fake hosts do not prove actual AppKit focus ordering.
- AC3: [Target note](../exploration.md#operational-evidence) records exact deferred checks and qualification gaps. No evidence gate is satisfied by source inspection.

The separate [overflow recipe](appkit-token-overflow.md) covers native viewport/counter source wiring; the keyboard cases do not qualify token truncation.
