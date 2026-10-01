# Display formatted content and status

ID: display-content
Targets: web, ios, android, macos
Related APIs: Blockquote, Code, CodeBlock, Citation, MetadataList, Thumbnail, ProgressBar, StatusDot, Timestamp, Timer, Outline, useOutlineFromMarkdown, useOutlineFromDoc, useOutlineFromDOM, Markdown

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
- AC2: Linear progress, status, timestamps, and elapsed timers expose labels and values; live updates and tooltip behavior follow the target contract.
- AC3: An outline can be derived from Markdown or a baked Markdown document, while DOM/view-tree observation and heading navigation limitations are clear for each target.
- AC4: A maintained example exercises the composition without relying on target-only props.

## Documentation

- AC1: [Content-display components](../docs/components.md#content) and the [content display guide](../docs/content-display.md).
- AC2: [Status, progress, and time behavior](../docs/content-display.md#progress-status-and-time) and the [maintained demo](../packages/demos/src/ContentDisplayDemo.tsrx).
- AC3: [Outline and Markdown behavior](../docs/content-display.md#outline-from-markdown-or-views).
- AC4: [Content-display demo](../packages/demos/src/ContentDisplayDemo.tsrx), available as “Content display” in the harness.
