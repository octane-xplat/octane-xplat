# Content display

Use the content-display components to compose article metadata, readable code,
status, timestamps, and a heading outline from one shared tree.

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

function ArticleSummary() @{
	const items = useOutlineFromMarkdown(source)
	<>
		<Blockquote cite="Release notes">A portable quotation.</Blockquote>
		<Code>pnpm add @octane-xplat/ui</Code>
		<CodeBlock code="const ready = true" language="typescript" hasCopyButton={true} />
		<MetadataList columns={2}>
			<MetadataListItem label="Status"><StatusDot variant="success" label="Ready" /> Ready</MetadataListItem>
			<MetadataListItem label="Updated"><Timestamp value="2026-10-01T12:00:00Z" /></MetadataListItem>
		</MetadataList>
		<ProgressBar label="Upload" value={68} hasValueLabel={true} />
		<Outline items={items} hasScrollOnClick={false} />
	</>
}
```

`Outline` accepts explicit `items`, `useOutlineFromMarkdown(markdown)`, or
`useOutlineFromDoc(doc)` from the same Markdown document used by `Markdown`.
The Markdown outline parser covers ATX and Setext headings, ignores fenced and
indented code, and strips the inline constructs rendered by this package's
Markdown vocabulary. It is not a plug-in Markdown parser.

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

## Code highlighting and copy

`CodeBlock` tokenizes shared source text and uses the same language/token
contract across targets. Web can use CSS Custom Highlight ranges when the
browser supports them; native uses colored text spans. The macOS host label
cannot compose per-token runs, so it displays a single text color. Native
scrolling is vertical only: long unwrapped lines do not horizontally scroll.
Copy uses the host clipboard implementation and calls `onCopy` only after a
successful write.

The upstream low-level helpers `applyHighlightRangesChunked`,
`applyHighlightRangesBatch`, `applyHighlightRangesFlat`, `cleanupRanges`, and
`ensureHighlightStyles` act directly on DOM ranges and CSS Custom Highlights.
They are not exported from the portable root because NativeScript has no
equivalent range API; `CodeBlock` chooses the span path on native. The portable
root does export the tokenizer functions and token types.

## Progress, status, and time

`Timestamp` absolute formats use `Intl` and an optional named time zone. Live
relative timestamps and timers update on their own intervals. Hover cards and
mark tooltips are pointer affordances; touch targets do not show them. Keep
essential status in visible or accessible labels.

Web pulse and indeterminate animations stop under
`prefers-reduced-motion`. The NativeScript and experimental macOS pulse loops
currently have no system reduced-motion subscription, so set
`isPulsing={false}` when the app applies a reduced-motion preference itself.

The [content-display demo](../packages/demos/src/ContentDisplayDemo.tsrx)
exercises these components from the shared package entry.
