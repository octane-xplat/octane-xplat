# Update raw AppKit search text during composition

ID: appkit-search-text
Targets: macos
Related APIs: searchbar, text, onTextChange, onSubmit

## Starting point

A raw native search field receives a programmatic query while its editor is
composing text. Shared SearchInput is a separate normalized control.

## Acceptance criteria

- AC1: Read edits from the live field editor and preserve marked text while queuing the latest differing programmatic query. Keep native submit/cancel separate from text changes.
- AC2: A matching native echo supersedes pending work. A dropped text prop requests an empty string after composition, while teardown cancels pending work and observers.
- AC3: Changed programmatic text still emits one property-change event using the current handler and previous value; unchanged strings are silent. Distinguish source cases from actual native editor, IME, selection, focus and packaging evidence.

## Documentation

- AC1: [Renderer contract](../../../packages/macos-renderer/README.md#controlled-text-during-composition) and [authored search cases](../../../packages/macos-renderer/test/search-bar.test.ts). Tests unrun.
- AC2: The same contract/cases use the shared writer and controlled scheduler. Production teardown already disposes that writer; native lifecycle remains unqualified.
- AC3: [Target note](../../../tools/platform-qualification/evidence/appkit-progress-2026-10-30.md#raw-searchbar-marked-text-synchronization) records event scope and deferred commands. No native/physical-input result is claimed.
