# Render streamed Markdown

ID: stream-markdown
Targets: web, ios, android, macos, linux
Related APIs: createMarkdownStreamParser, MarkdownStreamParser, MdDoc,
Markdown, outlineFromDoc, CodeToken, SyntaxToken, CodeTokenizer

## Starting point

An app receives Markdown text in chunks and needs readable document data for
rendering, a heading outline, or syntax highlighting.

## Requirements

- Append new chunks through one parser and render its document snapshots.
- Finish incomplete input literally and reset for another message.
- Derive an outline from document data without inspecting rendered elements.
- Interpret syntax offsets and implement a typed custom tokenizer.

## Acceptance criteria

- AC1: Each appended chunk produces a versioned document usable by Markdown.
- AC2: Finishing matches a full parse, rejects further appends, and resetting
  clears prior content without affecting another parser.
- AC3: The reader can derive portable outline items from the document.
- AC4: The reader can distinguish line-relative and absolute UTF-16 token
  offsets and convert a custom token spanning lines.

## Documentation

- AC1: [Streaming text](../../../docs/app/content-display.md#streaming-text).
- AC2: [Streaming text](../../../docs/app/content-display.md#streaming-text).
- AC3: [Streaming text](../../../docs/app/content-display.md#streaming-text).
- AC4: [Custom renderer migration](../../../docs/app/content-display.md#migrate-custom-streaming-renderers).

## Verification

Maintained executable examples: `packages/ui/src/markdown/public-api.test.ts`.
These are parser and tokenizer checks, not device-rendering evidence.
