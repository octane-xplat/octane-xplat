# Markdown

> Render Markdown text or a baked document, then customize any part of the output.

`Markdown` turns Markdown source into formatted content — headings, lists,
tables, code, links, citations — using the shared Octane vocabulary, so the
same source renders on web and native targets. It lives at
`@octane-xplat/ui/markdown` together with the parser, document, streaming,
and plugin helpers.

```tsx
import { Markdown } from '@octane-xplat/ui/markdown'

export function Notes() {
	return <Markdown>{'# Notes\n\n- Pack the charger'}</Markdown>
}
```

The [content guide](content-display.md#markdown-documents) covers the grammar,
streaming output, the stream parser, and heading outlines. This page covers
the rendering surface: layout, links and citations, renderer overrides,
plugins, and the limits that matter when you customize.

## Feed text or a prepared document

Set `children` to raw Markdown text to parse at render time, or `data` to a
pre-parsed `MdDoc` — for example the document `xplat routes` bakes for a
`.md` route. The two sources are mutually exclusive, and `isStreaming`
applies to `children` only.

```tsx
<>
	<Markdown data={document} />
	<Markdown isStreaming>{partialSource}</Markdown>
</>
```

Documents are plain JSON — never functions or components. Validate an
externally supplied document with `assertMdDoc` before rendering it.

```ts
import { assertMdDoc } from '@octane-xplat/ui/markdown'

assertMdDoc(loadedJson) // throws on a malformed or unsupported document
```

## Control layout and density

`density="compact"` tightens block spacing for assistant-style responses, and
`headingLevelStart` shifts `#` headings to a deeper level so a document fits
the surrounding heading hierarchy. `contentWidth` caps prose width at 680
dips (or a CSS length) while tables and code blocks keep the container
width; `contentAlign="center"` centers the prose column when it is narrower
than the available space.

```tsx
<Markdown density="compact" headingLevelStart={3} contentWidth={520} contentAlign="center">
	{response}
</Markdown>
```

`display="inline"` renders a single inline run — inline code, bold, links,
citations — that sits inside surrounding text without block spacing. Inline
images have no native text attachment, so they render as their alt text
inside the run; block images render the shared `Image` component.

```tsx
import { Text } from '@octane-xplat/ui'
import { Markdown } from '@octane-xplat/ui/markdown'

export function Status() {
	return (
		<Text>
			Status: <Markdown display="inline">{'`deploying` to **prod**'}</Markdown>
		</Text>
	)
}
```

## Handle links and citations

`onLinkClick` intercepts activation on the default link renderer. Return
`false` or call `event.preventDefault()` to cancel navigation — the same
`NavigationActivationEvent` contract other press callbacks use. Custom
`link` renderers are not wrapped by `onLinkClick`; they own activation
themselves.

```tsx
<Markdown
	onLinkClick={(href, event) => {
		if (href.startsWith('internal:')) {
			event.preventDefault()
			openRoute(href)
		}
	}}
>
	{source}
</Markdown>
```

`autolink="gfm"` links bare URLs and email addresses in text; unset leaves
them literal. Destinations that fail the safety check — `javascript:`,
`vbscript:`, `data:text/html` — never become links or images and render as
literal text.

```tsx
<Markdown autolink="gfm">{'See https://example.com or mail help@example.com'}</Markdown>
```

`sources` turns `[id]` and `【id】` markers into `Citation` chips. Numbering
follows first-citation order in the text, and a marker whose id has no
source stays literal text. `citationStyle="number"` renders compact
numbered badges instead of the default labelled chips.

```tsx
<Markdown
	citationStyle="number"
	sources={{ tokyo: { title: 'Tokyo facts', url: 'https://en.wikipedia.org/wiki/Tokyo' } }}
>
	{'Population facts[tokyo].'}
</Markdown>
```

## Replace a renderer

`components` swaps the renderer for individual node kinds. Each entry
receives the same data the default renderer reads and returns the element
to mount; unset keys keep the default part. Overrides stay mounted across
streaming chunks — hooks belong inside the returned component, and render
functions should stay pure construction.

```tsx
import { CodeBlock, Link } from '@octane-xplat/ui'

const components = {
	code: (props: { code: string; language?: string }) => (
		<CodeBlock code={props.code} language={props.language} isCollapsible />
	),
	link: (props: { href: string; children?: unknown }) => (
		<Link href={props.href}>{props.children}</Link>
	),
}

export function Guide(props: { source: string }) {
	return <Markdown components={components}>{props.source}</Markdown>
}
```

The slot keys and payloads follow the reference contract: `code`
(`{code, language?, sourceLines?}`), `inlineCode` (`{children: string}`),
`math` (`{value, display, sourceLines?}`), `citation`
(`{source, number, variant}`), `link` (`{href, children}` — the sanitized
href), `heading` (`{level, children, id?, sourceLines?}` — apply the shared
`id` so outlines land), `paragraph` (`{children, sourceLines?}`), `image`
(`{src, alt, sourceLines?}` — only safe URLs), `blockquote`
(`{children, sourceLines?}`), and `hr` (`{sourceLines?}`). Supplying a
`math` renderer is what enables `$…$`/`$$…$$` parsing; the raw expression
passes through unevaluated, so the slot does not bundle a math engine.
`sourceLines` payloads arrive only while `markdownSourceLinesPlugin` is
installed (see [plugins](#plugins)).

## Match text patterns inline

`inlinePlugins` applies ordered regex matchers to parsed text nodes — code
spans, math, and other non-prose contexts are unaffected. Patterns match in
order and the first match wins on overlaps; `getEndIndex` can refine the
boundary or reject the match entirely.

```tsx
import { Text } from '@octane-xplat/ui'
import { Markdown, type MarkdownInlinePlugin } from '@octane-xplat/ui/markdown'

const mention: MarkdownInlinePlugin = {
	pattern: /@([a-z]+)/g,
	render: (match, key) => <Text key={key} weight="bold">{'@' + match[1]}</Text>,
}

export function Ping() {
	return <Markdown inlinePlugins={[mention]}>{'Ping @ada when ready'}</Markdown>
}
```

## Plugins

`plugins` takes an ordered list of `createMarkdownPlugin()` entries — the
extension protocol shared with Astryx Markdown 0.7.4. Each entry can
contribute three things: **syntax** (a tokenizer that matches a bounded
span at an ordered position and emits a typed extension node), a
**transform** (an immutable document rewrite that runs in registration
order), and **renderers** (one per extension-node name, with
decline/throw/pending fallbacks that keep the readable source text).
Extension nodes carry frozen JSON data and their source text — a document
stays serializable, and renderer functions never enter `data`.

```tsx
import { createMarkdownPlugin, Markdown, type MarkdownTokenizerInput } from '@octane-xplat/ui/markdown'

const angle = createMarkdownPlugin({
	name: 'angle',
	apiVersion: 1,
	syntax: {
		inline: [
			{
				startsWith: ['<<'],
				maxSpan: 64,
				tokenize: (input: MarkdownTokenizerInput) => {
					const end = input.source.indexOf('>>', input.offset + 2)
					return end === -1
						? { status: 'no-match' as const }
						: {
								status: 'match' as const,
								end: end + 2,
								node: {
									type: 'extension' as const,
									plugin: 'angle',
									name: 'angle',
									display: 'inline' as const,
									data: input.source.slice(input.offset + 2, end),
								},
							}
				},
			},
		],
	},
	renderers: { angle: { render: (node) => <mark>{String(node.data)}</mark>, toText: (node) => String(node.data) } },
})

export function Marked() {
	return <Markdown plugins={[angle]}>{'Tag <<important>> inline'}</Markdown>
}
```

Eight first-party helpers cover the common cases without writing a
tokenizer by hand:

- `markdownSoftBreaksPlugin` — treat single line endings as hard breaks,
  matching chat-style text.
- `createMarkdownFrontmatter({ name, parse })` — parse a leading
  frontmatter block into typed metadata and strip it from the document.
- `markdownSourceLinesPlugin` — stamp each block's 1-based source lines so
  `components` renderers receive `sourceLines` payloads.
- `createMarkdownHeadingLinks({ permalinkBaseUrl })` — give headings at
  every depth stable ids, labels, and permalink URLs.
- `createMarkdownTextTransform` — replace regex matches in text nodes with
  typed extension nodes.
- `createMarkdownFenceTransform` / `getMarkdownFenceProposal` — claim a
  language-tagged fence as semantic content with a readable fallback.
- `createMarkdownSourceDecoration` / `getMarkdownSourceDecorations` —
  attach non-semantic metadata to source ranges without changing content.
- `createMarkdownRemarkTransform` — adapt a synchronous Remark (MDAST)
  transform to this document model; output that cannot be represented
  fails closed instead of silently diverging.

```tsx
import { createMarkdownFrontmatter, Markdown, markdownSoftBreaksPlugin } from '@octane-xplat/ui/markdown'

const meta = createMarkdownFrontmatter({ name: 'meta', parse: (fields) => fields })

export function Page(props: { source: string }) {
	return <Markdown plugins={[meta.plugin, markdownSoftBreaksPlugin]}>{props.source}</Markdown>
}
```

`MarkdownPluginNodeRenderer` renders exactly one extension node the way
`Markdown` renders it — the plugin renderer inside the same failure
boundary, or the node's text projection when no renderer is available.
Use it to adopt plugin content outside a full document.

```tsx
import { MarkdownPluginNodeRenderer } from '@octane-xplat/ui/markdown'

const preview = <MarkdownPluginNodeRenderer plugins={[angle]} node={angleNode} />
```

## Documents and outlines

`parseMdDoc`, `parseMdNodes`, and `parseMdInline` produce the `MdDoc` v2
tree — a recursive, JSON-serializable document whose nodes are `type`
tagged. `outlineFromDoc` and `markdownHeadings` derive the same heading
projection the renderer uses, so an `Outline` stays in sync with the
rendered document. With `createMarkdownHeadingLinks` installed, ids,
labels, and permalink URLs come from the plugin's projection instead of
the default top-level scope.

```ts
import { outlineFromDoc, parseMdDoc } from '@octane-xplat/ui/markdown'
import { Outline } from '@octane-xplat/ui'

const document = parseMdDoc('# Guide\n\n## Setup\n\n## Usage')
const items = outlineFromDoc(document) // Outline items for 'Setup' and 'Usage'
```

## Baked routes

A `.md` file under the route directory becomes a route whose baked `MdDoc`
renders through `MarkdownScreen` — the bundle ships the document, not the
parser. Renderer and plugin configuration stay in code; baked data carries
documents only. See [route a Markdown file](navigation.md#route-a-markdown-file).

## Migrate earlier usage

- `<Markdown text={source}>` becomes `<Markdown>{source}</Markdown>` — the
  Astryx `children` convention; `data` is unchanged.
- `<Markdown isStreaming>` smooths internally. Passing text already
  smoothed by `useStreamingText` reveals twice — pass the raw accumulated
  string instead. `useStreamingText` remains the tool for non-Markdown
  text such as a typewriter `Text` label.
- Custom streaming renderers replace the root-imported incremental-parser
  sequence with `createMarkdownStreamParser`; see
  [migrate custom streaming renderers](content-display.md#migrate-custom-streaming-renderers).
- Documents are version `2`; `assertMdDoc` rejects older or malformed
  shapes instead of misrendering.

## Limits

- Inline `display` embeds text-run content only on native — view-bearing
  inline content throws rather than silently dropping, and inline images
  show their alt text. Block images render through `Image`.
- Extension nodes carry typed, frozen data. The reference's container node
  model (extension nodes that own phrasing/flow children with content
  counts) is not ported; plugins express custom structure through
  extension nodes and their renderers.
- A `math` renderer slot is not a math engine, and a semantic fence does
  not evaluate its payload — both hand data to your renderer.
- AppKit link and citation activation dispatches through accessibility
  actions; it is not OS-level pointer input. GTK and WinUI targets and
  pixel-level visual parity remain unverified.
