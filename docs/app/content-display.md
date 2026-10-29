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
} from '@octane-xplat/ui'
import { useOutlineFromMarkdown } from '@octane-xplat/ui/markdown'

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

`Markdown` and its document helpers live at `@octane-xplat/ui/markdown` —
the package root keeps general UI only. `Markdown` renders either a `data`
prop — the `MdDoc` AST that `xplat routes` bakes from `marked` at codegen
(no parser in the bundle) — or a `text` prop of raw Markdown parsed at
runtime. Set exactly one: the sources are mutually exclusive, and
`isStreaming`/`fadeIn` apply to `text` only.

```tsx
import { Markdown } from '@octane-xplat/ui/markdown'

export function ReleaseNotes() {
	return <Markdown text={'# Release notes\n\n- Faster lists'} />
}
```

The runtime parser is a deliberately small, dependency-free subset covering
what the `MdDoc` AST can express: ATX and Setext headings, paragraphs, fenced
code (` ``` ` and `~~~`; an unclosed fence runs to end of input), flat
ordered/unordered lists, blockquotes, and horizontal rules; inline code spans,
`**`/`__` bold, `*`/`_` emphasis, `[text](href)` links, and images reduced to
their alt text. Tables render through `Table`, code fences through `CodeBlock`,
and task lists show read-only checked/unchecked markers. Strikethrough uses
`~~text~~`. HTML blocks, indented code, reference-style links, and nested block
structure remain outside this subset.

```tsx
<Markdown text={'| Task | Status |\n| --- | --- |\n| Review | **Ready** |\n\n- [x] Parser\n- [ ] Stories\n\n~~Old plan~~'} />
```

Use `density="compact"` for shorter gaps and `headingLevelStart={3}` to shift
`#` headings to level 3, `##` to level 4, up to level 6. A `sources` map turns
known `[id]` markers into labelled `Citation` links; unknown markers stay as
text. This composes the public Citation component. Source numbers follow the map's
key order; keep sources in first-citation order. Text with `sources` renders
settled rather than using the streaming fade.

```tsx
<Markdown
	text={'# Tokyo\n\nPopulation facts[tokyo].'}
	density="compact"
	headingLevelStart={3}
	sources={{ tokyo: { title: 'Tokyo facts', url: 'https://en.wikipedia.org/wiki/Tokyo' } }}
/>
```

### Streaming text

To smooth bursts of incoming text before displaying them, use
`useStreamingText`. Pass the whole accumulated string each time. `natural`
reveals 10 UTF-16 units per 50 ms, `fast` reveals 4 per 8 ms, and `instant`
returns all text. Finished streams settle immediately. Emoji clusters stay
whole where `Intl.Segmenter` is available; other runtimes protect surrogate
pairs. Browser reduced-motion preferences skip the reveal; native media-query
support does not currently expose that preference.

```tsx
import { Markdown, useStreamingText } from '@octane-xplat/ui/markdown'

export function AssistantResponse({ text, streaming }: { text: string; streaming: boolean }) {
	const displayed = useStreamingText(text, streaming, { speed: 'fast' })
	return <Markdown text={displayed} isStreaming={streaming} />
}
```

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

For a custom renderer, use the parser at `@octane-xplat/ui/markdown`.
Pass only each new chunk to `append`, and render the returned document with
`<Markdown data={document} />`. Call `finish` when the stream ends: it parses
unfinished markup literally, just like a full parse. After finishing, call
`reset` before appending another message.

```ts
import { createMarkdownStreamParser, outlineFromDoc } from '@octane-xplat/ui/markdown'

const parser = createMarkdownStreamParser()
parser.append('# Release notes\n\n')
const document = parser.append('Hello **world')
const headings = outlineFromDoc(document)
const finalDocument = parser.finish()
parser.reset()
```

The result is a readable `MdDoc` v1 object, shared with baked routes. Its block
and inline nodes use `t` to identify their kind. Treat returned nodes as
immutable: settled blocks can be shared between snapshots. Each parser owns
one independent stream; an empty append returns the current snapshot.

```ts
import { parseMdDoc, type MdDoc } from '@octane-xplat/ui/markdown'

const document: MdDoc = parseMdDoc('# Hello')
// { kind: 'octane-xplat/md', v: 1,
//   children: [{ t: 'h', depth: 1, children: [{ t: 'text', text: 'Hello' }] }] }
const headings = document.children.filter((block) => block.t === 'h')
```

### Migrate custom streaming renderers

Replace the root-imported `createMarkdownIncrementalState` /
`parseMarkdownIncremental` sequence with `createMarkdownStreamParser` at
`/markdown`. Cache fields, `trimStreamingArtifacts`, `computeBoundaries`,
`computeSegments`, `markdownTextLength`, `MdTextSegment`, and
`SYNC_TOKENIZE_THRESHOLD` are private. Cumulative-source integrations should
append the new suffix, or reset and append the replacement source after an edit.

```ts
import { createMarkdownStreamParser } from '@octane-xplat/ui/markdown'

const parser = createMarkdownStreamParser()
let previous = ''

function update(source: string) {
	if (!source.startsWith(previous)) {
		parser.reset()
		previous = ''
	}
	const document = parser.append(source.slice(previous.length))
	previous = source

	return document
}
```

Syntax utilities also live at `/markdown`. `SyntaxToken` uses line-relative,
inclusive-start/exclusive-end UTF-16 offsets; `CodeToken` and `CodeTokenizer`
use absolute source offsets, including newlines. Custom tokenizers must use
one of the exported `SyntaxTokenType` names. The conversion splits tokens
that cross line boundaries; unknown languages return no highlighted tokens.

```ts
import { flatTokensToLines, tokenize, type CodeTokenizer } from '@octane-xplat/ui/markdown'

const custom: CodeTokenizer = (code) => [{ type: 'comment', start: 0, end: code.length }]

const lines = flatTokensToLines(custom('hello', 'text'), 'hello')
const highlighted = tokenize('const ready = true', 'typescript')
```

> Runtime evidence: convergence (every-character chunking → identical AST as
> the full parse), withholding, and settled-block reference stability are
> covered by `packages/ui/src/markdown-stream.test.ts` and
> `markdown-stream.mobile.test.ts` (web + native-rendered suites). The fade
> animation itself is web CSS and unverified on native targets.

## Outline from Markdown or a rendered tree

The portable derivations work on every target: `useOutlineFromMarkdown` and
`useOutlineFromDoc` from `@octane-xplat/ui/markdown`. Tree discovery is platform-specific
and split into two hooks, one per mechanism. On web, `useOutlineFromDOM` —
imported from `@octane-xplat/ui/web`, not the root — reads h1–h6 elements
inside a container and keeps the item list current with `MutationObserver`:

```tsx
import { View, Heading, Outline } from '@octane-xplat/ui'
import { useOutlineFromDOM } from '@octane-xplat/ui/web'
import { useRef } from 'octane'

export function WebExample() {
	const root = useRef(null)
	const items = useOutlineFromDOM(root)

	return (
		<>
			<View
				ref={(el) => {
					root.current = el
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

On iOS/Android, `useOutlineFromView` snapshots the bound NativeScript view
tree and collects `Heading` items. Import it from
`@octane-xplat/ui/nativescript`. The snapshot does not observe later tree
changes, so derive items from the same document when headings can change:

```tsx
import { View, Heading, Outline } from '@octane-xplat/ui'
import { useOutlineFromView } from '@octane-xplat/ui/nativescript'
import { useRef } from 'octane'

export function Example() {
	const root = useRef(null)
	const items = useOutlineFromView(root)

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

AppKit now has a renderer-backed heading snapshot path. Check its capability:
older or missing hosts still report unsupported. The hook accepts a native
root, a ref object, or a ScrollableArea handle. It reads heading IDs, current
plain/rich text and levels in native view order once after the root is bound,
and recollects when a render exposes a different root. It does not observe
later heading mutations. Native discovery and packaged consumers remain
unqualified; capability presence is not a runtime pass.

```tsx
import { useRef } from 'octane'
import { Heading, Outline, ScrollableArea, type ScrollableAreaHandle } from '@octane-xplat/ui'
import { getOutlineFromViewCapabilities, useOutlineFromView } from '@octane-xplat/ui/macos'
export function Guide() {
	const content = useRef<ScrollableAreaHandle | null>(null)
	const items = useOutlineFromView(content)
	return <>
		<ScrollableArea ref={content} height={200}><Heading id="intro" level={1}>Introduction</Heading></ScrollableArea>
		{getOutlineFromViewCapabilities().isSupported ? <Outline items={items} hasScrollOnClick={false} /> : null}
	</>
}
```

Explicit heading IDs are retained. Unnamed headings receive unique slugs;
generated IDs avoid authored IDs, and repeated authored IDs keep the first
entry. Generated IDs describe this snapshot and are not written onto native
views. Use portable document data when content changes independently of the
root. AppKit navigation uses current native targets separately from this snapshot;
native behavior still needs qualification.

```tsx
import { Heading } from '@octane-xplat/ui'
export function GuideHeadings() {
	return <><Heading id="intro" level={1}>Introduction</Heading><Heading id="setup" level={2}>Setup</Heading></>
}
```

Use the same document as the rendered content to keep the portable outline in
sync:

```tsx
import { Outline } from '@octane-xplat/ui'
import { useOutlineFromDoc } from '@octane-xplat/ui/markdown'

export function MacOutline(props: { doc: Parameters<typeof useOutlineFromDoc>[0] }) {
	const items = useOutlineFromDoc(props.doc)

	return <Outline items={items} hasScrollOnClick={false} />
}
```

AppKit Outline now has a native navigation source path. Pass the raw native
viewport through scrollContainerRef when the outline sits outside the content;
otherwise it uses its nearest enclosing scroll view. Heading activation seeks
to its current top minus offset, clamped to the document range. Scroll spy
updates uncontrolled selection from current positions; activeId disables it.
Reduced motion requests an immediate seek. hasScrollOnClick=false keeps
selection/navigation callbacks while letting the app own scrolling.

```tsx
import { useCallback, useRef } from 'octane'
import { Heading, Outline, ScrollableArea, type HostElement, type ScrollableAreaHandle } from '@octane-xplat/ui'
export function NavigableGuide() {
	const scroll = useRef<HostElement | null>(null)
	const bind = useCallback((handle: ScrollableAreaHandle | null) => { scroll.current = handle?.native ?? null }, [])
	return <>
		<ScrollableArea ref={bind} height={200}><Heading id="intro" level={1}>Introduction</Heading></ScrollableArea>
		<Outline items={[{ id: 'intro', label: 'Introduction', level: 1 }]} scrollContainerRef={scroll} offset={24} />
	</>
}
```

The renderer must provide current native heading targets. Hidden, detached,
foreign-window and nested-scroller targets do not move the wrong viewport.
Navigation callbacks balance on replacement, user live-scroll interruption or
disposal. Bounds changes delay completion until 150 ms of quiet; this timer
fallback does not prove AppKit animation completion. Native geometry/order,
seek/animation/scroll spy, OS input, VoiceOver and packaging remain unqualified.
Prefer explicit IDs for headings whose text changes after a snapshot.

```tsx
import { Outline } from '@octane-xplat/ui'
export function ControlledContents({ active, setActive }: { active: string; setActive: (id: string) => void }) {
	return <Outline items={[{ id: 'intro', label: 'Introduction', level: 1 }]}
		activeId={active} onActiveIdChange={setActive} hasScrollOnClick={false} />
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
equivalent range API; `CodeBlock` chooses the span path on native. The `@octane-xplat/ui/markdown` entrypoint exports the tokenizer
functions and token types.

```ts
import { tokenize } from '@octane-xplat/ui/markdown'

const tokens = tokenize('const ready = true', 'typescript')
console.log(tokens)
```

## Progress, status, and time

`Meter` is a gauge of a quantity within a known range — disk used, battery
level, a rating — not task progress (use `ProgressBar` for that). Assistive
technology reports the meter role with the clamped range and value; `valueLabel`
supplies a human-readable reading such as "6 GB of 10 GB used". The range is
`minValue`/`maxValue`; the older `max` name still works as an alias.

```tsx
import { Meter } from '@octane-xplat/ui'

export function Example() {
	return (
		<Meter
			value={6}
			minValue={0}
			maxValue={10}
			accessibilityLabel="Storage used"
			valueLabel="6 GB of 10 GB used"
		/>
	)
}
```

`Timestamp` absolute formats use `Intl` and an optional named time zone. Live
relative timestamps and timers update on their own intervals. Hover cards and
mark tooltips are pointer affordances; touch targets do not show them. Keep
essential status in visible or accessible labels. An ISO timestamp value must
include `Z` or a UTC offset; numeric values name Unix seconds or milliseconds
with `valueUnit`. `Timer.startTimeMs` is Unix milliseconds, while
`autoThresholdSeconds` is a duration in seconds.

```tsx
import { Timestamp, Timer } from '@octane-xplat/ui'

export function Example() {
	const createdAtMs = Date.now()
	const startedAtMs = Date.now()

	return (
		<>
			<Timestamp
				value="2026-10-01T12:00:00Z"
				format="date_time"
				tooltipEntries={[{ timezoneID: 'UTC', format: 'full', label: 'UTC' }]}
			/>
			<Timestamp value="2026-10-01T12:00:00Z" format="relative" isLive />
			<Timestamp value={createdAtMs} valueUnit="unix-milliseconds" />
			<Timer startTimeMs={startedAtMs} format="clock" />
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
