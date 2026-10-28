# Bound AppKit multiline input

ID: appkit-text-limits
Targets: macos
Related APIs: TextArea, maxLength, value, defaultValue, onChange

## Starting point

An AppKit note/composer field that accepts typing, pastes and composed text.

## Acceptance criteria

- AC1: A committed insertion/replacement fits the UTF-16 cap while preserving unchanged prefix/suffix and valid surrogate pairs. Deletion remains possible. Zero, omitted and invalid caps have explicit behavior; initial/external programmatic values are not truncated.
- AC2: Marked text remains intact during composition and is normalized at commit, including explicit unmark without another text-change notification. Distinguish direct native API dispatch from physical keyboard/IME evidence.
- AC3: A correction remaps the current selection, avoids a nested public change echo, honors a native should-change veto and releases its reentry guard after failure. Recognize separate real IME, undo/redo, native bridge and packaging qualification.

## Documentation

- AC1: [Length semantics](../../../docs/app/primitives.md#grow-a-multiline-field) and [range/source regressions](../../../packages/macos-renderer/test/text-limit.test.ts).
- AC2: [Native editing contract](../../../packages/macos-renderer/README.md#bound-multiline-user-edits) and [nonvisual direct-API probe](../../../examples/probes/text-limit.macos.tsrx). These artifacts are authored and have not run.
- AC3: [Correction and qualification boundaries](../../../packages/macos-renderer/README.md#bound-multiline-user-edits), [delegate/selection regressions](../../../packages/macos-renderer/test/text-limit.test.ts) and [leaf forwarding source](../../../packages/ui/src/text-controls.macos.mobile.test.tsrx). Tests, native probes, physical IME/undo and packaging are deferred.
