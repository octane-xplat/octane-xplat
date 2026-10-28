# Prepare source-owned AppKit window layers

ID: appkit-window-layer-source
Targets: macos
Related APIs: __xplatAppKit.showLayer, createContentRoot, whenCommitted, deferPresentation, WindowLayer.show

## Starting point

A future floating typeahead result list needs its declaring providers and input
focus while displaying outside the field's layout. This is a renderer prerequisite;
existing public components are not migrated by this slice.

## Acceptance criteria

- AC1: A supplied source outlet bypasses standalone root creation. Gate geometry/reveal on the current content commit; explicit deferred show must not activate windows or change focus. Retired commits cannot resize or reopen a closed/replaced request.
- AC2: Bind to the original window/content container, preserve opt-in anchor-click containment and controlled outside dismissal, and ignore staged interaction. Reject invalid geometry, avoid unchanged native frame writes, and attempt all cleanup/source disposal/detachment even after a failure.
- AC3: Separate source/fake-host cases from actual portal/context/ref/commit/geometry/focus/dismissal/AX and packaging. Keep public Typeahead/Tokenizer/Popover/useLayer limitations explicit and record exact deferred commands.

## Documentation

- AC1: [Renderer contract](../../../packages/macos-renderer/README.md#stage-a-source-owned-window-layer), [target host](../../../packages/macos-renderer/src/layer.ts), eight new [authored source cases](../../../packages/macos-renderer/test/layer.test.ts) and [manual fixture](../../../examples/probes/window-layer-portal.macos.tsrx), all unrun.
- AC2: The same source/cases cover current owner/commit and native cleanup/geometry policies; fake method calls do not establish native focus or hit testing.
- AC3: [Target note](../parity/appkit-progress.md#appkit-source-owned-window-layer-prerequisite) records exact deferred commands and remaining component integration. The fixture runner only waits/records.
