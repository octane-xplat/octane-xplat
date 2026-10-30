# Display formatted content and status

ID: display-content
Targets: web, ios, android, macos
Related APIs: Blockquote, Code, CodeBlock, Citation, MetadataList, Thumbnail, ProgressBar, StatusDot, Timestamp, Timer, Outline, useOutlineFromMarkdown, useOutlineFromDoc, useOutlineFromView, useOutlineFromDOM (@octane-xplat/ui/web), Markdown

## Starting point

The app already uses `@octane-xplat/ui` and has content or operation state to
present. The task is composing the shared display primitives; it does not add a
Markdown parser, clipboard package, image loader, or navigation system.

## Requirements

- Present prose, source references, code, metadata, and images without changing
  the public component contract by target.
- Keep progress, status, and time values understandable to assistive
  technology and useful without hover.
- Build an outline from the same Markdown content, then choose the target's
  supported scrolling behavior.
- State the target-specific limits for code highlighting, clipboard, DOM
  observation, and outline scrolling.

## Acceptance criteria

- AC1: A shared content composition renders block quotations, inline and block code, source citations, metadata, and thumbnails through the documented component props.
- AC2: Linear progress, status, timestamps, and elapsed timers expose labels and values; timestamp inputs identify Unix seconds or milliseconds explicitly, timer starts use Unix milliseconds, duration thresholds name seconds, live updates and tooltip behavior follow the target contract.
- AC3: An outline can be derived from Markdown or a baked Markdown document, web DOM discovery is live, NativeScript view discovery is a snapshot, and macOS view discovery uses a renderer-backed snapshot only when `getOutlineFromViewCapabilities()` reports it available (missing/older hosts stay unsupported); heading-navigation limits are clear for each target.
- AC4: A maintained example exercises the composition without relying on target-only props.

- AC5: AppKit heading discovery walks renderer-owned native heading owners in view order with IDs/current plain/rich labels/levels, including NSArray collections. Root/ref/scroll-handle inputs and generated-ID collisions are defined; same-root snapshots stay stable across renders and recollect on rendered root/reader changes. Keep mutation tracking, navigation and native/packaged proof separate from discovery/source cases.

- AC6: AppKit Outline resolves current heading targets and scroll geometry for activation/header offset and uncontrolled spy, preserving controlled activeId and opt-out behavior. Support either document orientation, reduced-motion seeks, current callbacks, balanced navigation on settle/replacement/interruption/disposal, and owned observer/timer cleanup. Reject invalid/hidden/detached/foreign-window/nested-scroll targets. Keep source/timer evidence separate from actual native seeks, animation completion, OS input/AX and packing.

## Documentation

- AC1: [Content-display components](../../../docs/app/components.md#content) and the [content display guide](../../../docs/app/content-display.md).
- AC2: [Status, progress, and time behavior](../../../docs/app/content-display.md#progress-status-and-time), [UI API migrations](../../../docs/app/ui-api-migrations.md#explicit-units), and the [maintained demo](../../../packages/demos/src/ContentDisplayDemo.tsrx).
- AC3: [Outline and Markdown behavior](../../../docs/app/content-display.md#outline-from-markdown-or-a-rendered-tree).
- AC4: [Content-display demo](../../../packages/demos/src/ContentDisplayDemo.tsrx), available as “Content display” in the harness.

- AC3, AC5 (AppKit): [Snapshot usage and limits](../../../docs/app/content-display.md#outline-from-markdown-or-a-rendered-tree), [renderer bridge](../../../packages/macos-renderer/README.md#heading-snapshots-for-outline), two [renderer cases](../../../packages/macos-renderer/test/outline-headings.test.ts), three [snapshot/capability cases](../../../packages/ui/src/components/collections/outline-view.macos.test.ts), one [mounted hook case](../../../packages/ui/src/components/collections/outline-view.macos.mobile.test.tsrx) and [manual fixture](../../../examples/probes/outline-snapshot.macos.tsrx), all unrun. [Target note](../exploration.md#operational-evidence) records exact deferred commands. Native discovery/class/collection behavior and packed subpaths remain unqualified; Outline scrolling/scroll spy remain gaps.

- AC6: [Native navigation usage/limits](../../../docs/app/content-display.md#outline-from-markdown-or-a-rendered-tree), six [controller cases](../../../packages/ui/src/components/collections/outline-scroll.macos.test.ts), one [mounted source case](../../../packages/ui/src/components/collections/outline-navigation.macos.mobile.test.tsrx), updated [manual fixture](../../../examples/probes/outline-snapshot.macos.tsrx) and [target note](../exploration.md#operational-evidence). All unrun. The quiet-timer fallback does not qualify actual animation completion; native coordinates/scrolling/input/AX/cleanup and packaged consumers remain unqualified.
