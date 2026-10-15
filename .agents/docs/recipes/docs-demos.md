# Try a shared docs demo

ID: docs-demos
Targets: web, ios, android
Related APIs: @xplat/demos, GoalCounter, PackingList

## Starting point

A docs visitor with a browser; local and native runs additionally need the repository and platform tools.

## Requirements

A reader completes a small task, finds its shared source, and chooses an honest browser or native run path.

## Acceptance criteria

- AC1: On web, discovery and detail pages explain the task, preview platform, initial state, reset, source and local run instructions without requiring a preview to load.
- AC2: On web, previews load only on explicit activation, announce loading and failure, offer retry and standalone recovery, and close without trapping focus or scroll.
- AC3: On web, each demo supports keyboard interaction, narrow standalone viewports and text zoom, and local interactions after loading while offline.
- AC4: On iOS and Android, a reader can launch the shared source using the documented native entry and complete and reset both tasks; evidence distinguishes runtime execution from source availability.

## Documentation

- AC1: [Demo gallery](../../../docs/demos/browser-demos.md), [goal task and source](../../../docs/demos/goal-counter.md), [packing task and source](../../../docs/demos/packing-list.md).
- AC2: [Preview instructions](../../../docs/demos/goal-counter.md#try-it), [preview host](../../../apps/docs/src/DemoPreview.web.tsrx), [browser checks](../../../apps/docs/demos.browser.mjs).
- AC3: [Packing task](../../../docs/demos/packing-list.md#try-it), [browser checks](../../../apps/docs/demos.browser.mjs).
- AC4: [Native run instructions](../../../docs/demos/packing-list.md#run-locally), [native entry](../../../apps/mobile/src/docs-demos.mobile.tsrx), [native task checks](../../../apps/mobile/src/tests/docs-demos.spec.ts).
