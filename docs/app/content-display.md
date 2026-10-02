# Content display

> Show formatted text, code, progress, dates, or a table of contents.

For plain words, use `Text`. The components here add formatting and supporting
information: `CodeBlock` displays code, `ProgressBar` shows how far an action
has progressed, and `Outline` lists a document's headings.

```tsx
import { Text, CodeBlock, ProgressBar, Outline } from '@octane-xplat/ui'

export function Example() {
	return (
		<>
			<Text>Upload report</Text>
			<CodeBlock code="const ready = true" language="typescript" />
			<ProgressBar label="Upload" value={68} />
			<Outline items={[{ id: 'report', label: 'Report', level: 1 }]} hasScrollOnClick={false} />
		</>
	)
}
```

The example combines several of these pieces into an article summary. Place
the component in a `.tsrx` file and render it in your screen. The bars,
labels, and outline all use sample data so you can try them before connecting
real records.

```tsx
import {
	Blockquote,
	Code,
	CodeBlock,
	MetadataList,
	MetadataListItem,
	Outline,
	ProgressBar,
	StatusDot,
	Timestamp,
	useOutlineFromMarkdown,
} from '@octane-xplat/ui'

const source = '# Release notes\n\n## Highlights\n\n## Fixes'

function ArticleSummary() {
	const items = useOutlineFromMarkdown(source)
	return (
		<>
			<Blockquote cite="Release notes">A portable quotation.</Blockquote>
			<Code>pnpm add @octane-xplat/ui</Code>
			<CodeBlock code="const ready = true" language="typescript" hasCopyButton={true} />
			<MetadataList columns={2}>
				<MetadataListItem label="Status">
					<StatusDot variant="success" label="Ready" /> Ready
				</MetadataListItem>
				<MetadataListItem label="Updated">
					<Timestamp value="2026-10-01T12:00:00Z" />
				</MetadataListItem>
			</MetadataList>
			<ProgressBar label="Upload" value={68} hasValueLabel={true} />
			<Outline items={items} hasScrollOnClick={false} />
		</>
	)
}
```

`Outline` accepts explicit `items`, `useOutlineFromMarkdown(markdown)`, or
`useOutlineFromDoc(doc)` from the same Markdown document used by `Markdown`.
The Markdown outline parser covers ATX and Setext headings, ignores fenced and
indented code, and strips the inline constructs rendered by this package's
Markdown vocabulary. It is not a plug-in Markdown parser.

## Markdown documents

`Markdown` renders either a `data` prop — the `MdDoc` AST that `xplat routes`
bakes from `marked` at codegen (no parser in the bundle) — or a `text` prop of
raw Markdown parsed at runtime. `data` wins when both are set.

The runtime parser is a deliberately small, dependency-free subset covering
what the `MdDoc` AST can express: ATX and Setext headings, paragraphs, fenced
code (` ``` ` and `~~~`; an unclosed fence runs to end of input), flat
ordered/unordered lists, blockquotes, and horizontal rules; inline code spans,
`**`/`__` bold, `*`/`_` emphasis, `[text](href)` links, and images reduced to
their alt text. Tables, HTML blocks, indented code, reference-style links, and
nested block structure fall through to literal text.

### Streaming text

For chat/AI-style output where `text` is a cumulative snapshot that grows in
chunks — often ending mid-token — set `isStreaming`:

```tsx
<Markdown text={message.text} isStreaming={message.status === 'streaming'} />
```

Streaming mode parses incrementally: blocks before the last safe blank line
(not inside an open fence) are parsed once and reused by reference, so
per-chunk work stays proportional to the open tail rather than the document.
Incomplete trailing constructs are withheld until they close — a bare `- `
marker, a half-typed `[link](…`, a `>`/`#` opener, a whole-line backtick run —
and unclosed mid-line `**bold`/`_em_` is auto-closed so it formats while it
streams instead of flashing raw markers. A loose list split by a chunk
boundary merges to match the full parse. When the input is replaced rather
than appended, the cache resets and reparses whole.

`fadeIn` (default on while streaming) wraps newly arrived text in a
`vx-md-fade` span that fades in once on web — suppressed under
`prefers-reduced-motion` — and renders settled on native.

The same machinery is exported for custom renderers: `parseMdDoc` /
`parseMdNodes` for one-shot parsing, `createMarkdownIncrementalState` +
`parseMarkdownIncremental` for the settled-prefix cache, and
`computeBoundaries` / `computeSegments` / `markdownTextLength` for boundary
tracking. These are ports of the incremental parser and streaming segmentation
in upstream Astryx's `Markdown`, narrowed to the local grammar.

> Runtime evidence: convergence (every-character chunking → identical AST as
> the full parse), withholding, and settled-block reference stability are
> covered by `packages/ui/src/markdown-stream.test.ts` and
> `markdown-stream.mobile.test.ts` (web + native-rendered suites). The fade
> animation itself is web CSS and unverified on native targets.

## Outline from Markdown or views

`useOutlineFromDOM` is platform-specific under one portable function name. On
web it reads h1–h6 elements and tracks subtree changes with
`MutationObserver`. On NativeScript, pass a ref to the containing view; it
collects views with the `heading` accessibility role after mount. That native
view-tree snapshot does not observe later tree changes, so pass explicit items
or derive them from Markdown when headings change. The experimental macOS
renderer can display and activate outline items, but has no scroll-position or
scroll-to-heading bridge; `hasScrollOnClick` and scroll spy therefore have no
effect there.

```tsx
import { View, Heading, Outline, useOutlineFromDOM } from '@octane-xplat/ui'
import { useRef } from 'octane'

export function Example() {
	const root = useRef(null)
	const items = useOutlineFromDOM(root)
	return (
		<>
			<View
				ref={(view) => {
					root.current = view
				}}
			>
				<Heading id="summary" level={2}>
					Summary
				</Heading>
			</View>
			<Outline items={items} />
		</>
	)
}
```

## Code highlighting and copy

`CodeBlock` tokenizes shared source text and uses the same language/token
contract across targets. Web can use CSS Custom Highlight ranges when the
browser supports them; native uses colored text spans. The macOS host label
cannot compose per-token runs, so it displays a single text color. Native
scrolling is vertical only: long unwrapped lines do not horizontally scroll.
Copy uses the host clipboard implementation and calls `onCopy` only after a
successful write.

```tsx
import { CodeBlock } from '@octane-xplat/ui'

export function Example() {
	return (
		<CodeBlock
			code="const ready = true"
			language="typescript"
			isWrapped
			hasCopyButton
			onCopy={() => console.log('Copied')}
		/>
	)
}
```

The upstream low-level helpers `applyHighlightRangesChunked`,
`applyHighlightRangesBatch`, `applyHighlightRangesFlat`, `cleanupRanges`, and
`ensureHighlightStyles` act directly on DOM ranges and CSS Custom Highlights.
They are not exported from the portable root because NativeScript has no
equivalent range API; `CodeBlock` chooses the span path on native. The portable
root does export the tokenizer functions and token types.

```ts
import { tokenize } from '@octane-xplat/ui'

const tokens = tokenize('const ready = true', 'typescript')
console.log(tokens)
```

## Progress, status, and time

`Timestamp` absolute formats use `Intl` and an optional named time zone. Live
relative timestamps and timers update on their own intervals. Hover cards and
mark tooltips are pointer affordances; touch targets do not show them. Keep
essential status in visible or accessible labels.

```tsx
import { Timestamp, Timer } from '@octane-xplat/ui'

export function Example() {
	return (
		<>
			<Timestamp
				value="2026-10-01T12:00:00Z"
				format="date_time"
				tooltipEntries={[{ timezoneID: 'UTC', format: 'full', label: 'UTC' }]}
			/>
			<Timestamp value="2026-10-01T12:00:00Z" format="relative" isLive />
			<Timer format="clock" />
		</>
	)
}
```

Web pulse and indeterminate animations stop under
`prefers-reduced-motion`. The NativeScript and experimental macOS pulse loops
currently have no system reduced-motion subscription, so set
`isPulsing={false}` when the app applies a reduced-motion preference itself.

```tsx
import { StatusDot } from '@octane-xplat/ui'

export function Example() {
	return <StatusDot variant="success" label="Connected" isPulsing={false} />
}
```

The [content-display demo](../../packages/demos/src/ContentDisplayDemo.tsrx)
exercises these components from the shared package entry.
