/** @jsxImportSource @octane-xplat/jsx */
import { useMemo, useRef } from 'octane'
import { Screen } from '../components/layout/Screen.tsrx'
import { ScrollableArea } from '../components/layout/ScrollableArea.tsrx'
import { Text } from '../components/content/Text.tsrx'
import { Heading } from '../components/content/Heading.tsrx'
import { View } from '../components/layout/View.tsrx'
import { Link } from '../components/navigation/Link.tsrx'
import { sanitizeUrl } from '../routing/safe-url'
import { Citation } from '../components/content/Citation.tsrx'
import { Table } from '../table/Table.tsrx'
import { CodeBlock } from '../components/content/CodeBlock.tsrx'
import { proportional } from '../table/column-utils'
import { mdInlineLen, mdInlineText } from './markdown-ast'
import { parseMdNodes } from './markdown-parse'
import {
	computeBoundaries,
	computeSegments,
	createMarkdownIncrementalState,
	markdownTextLength,
	parseMarkdownIncremental,
	trimStreamingArtifacts,
	type MarkdownIncrementalState,
} from './markdown-stream'

import type {
	MarkdownProps,
	MarkdownScreenProps,
	MdExtension,
	MdInline,
	MdList,
	MdNode,
	CitationSource,
	TableColumn,
} from '../props'

export type { MdDoc, MdInline, MdNode } from '../props'

const headingClass = ['text-2xl font-bold', 'text-xl font-semibold', 'text-lg font-semibold']

/** Boundary ring depth for the streaming fade — how many recently-arrived
 *  text spans animate at once before merging into settled text. */
const MAX_FADE_SPANS = 8

/** Stream fade context passed down to a block: absolute rendered-text offset
 *  where the block starts plus the current boundary ring. */
interface StreamCursor {
	boundaries: number[]
	start: number
}

/** Render one text leaf, split at stream boundaries — newest portion fades
 *  in under its own span while settled text stays a raw run. A nested `Text`
 *  inside a `Text` renders as an inline span on every platform, so it stays
 *  within the shared vocabulary; positional reconciliation is enough since
 *  segments only append. */
function SegmentedText(props: { text: string; pos: number; stream: StreamCursor; segKey: string }) {
	const segs = computeSegments(props.text, props.pos, props.stream.boundaries, props.segKey)
	if (!segs) {
		return props.text
	}

	return segs.map((seg) => (seg.fading ? <Text className="vx-md-fade">{seg.text}</Text> : seg.text))
}

/** Inline extension nodes have no default rendering — the extension system
 *  (milestone 5) supplies renderers. The fallback is the node's source text. */
function ExtensionInline(props: { node: MdExtension & { display: 'inline' } }) {
	return props.node.source ?? ''
}

function Inlines(props: {
	nodes: readonly MdInline[]
	stream?: StreamCursor
	segKey: string
	sources?: Record<string, CitationSource>
}) @{
	const out = []
	let pos = props.stream?.start ?? 0
	let seq = 0
	for (const n of props.nodes ?? []) {
		// JSX prop expressions are lazy in this renderer — every value a child
		// must see is snapshotted into a const before `pos`/`seq` advance.
		const at = pos
		const key = `${props.segKey}.${seq}`
		switch (n.type) {
			case 'inlineCode':
				out.push(<Text style={{ fontFamily: 'monospace' }}>{n.value}</Text>)

				pos += n.value.length
				break
			case 'strong':
				out.push(
					<Text className="font-bold">
						<Inlines
							sources={props.sources}
							nodes={n.children}
							stream={props.stream && { boundaries: props.stream.boundaries, start: at }}
							segKey={key}
						/>
					</Text>,
				)

				pos += mdInlineLen(n.children)
				break
			case 'delete':
				out.push(
					<Text style={{ textDecorationLine: 'line-through' }}>
						<Inlines
							sources={props.sources}
							nodes={n.children}
							stream={props.stream && { boundaries: props.stream.boundaries, start: at }}
							segKey={key}
						/>
					</Text>,
				)

				pos += mdInlineLen(n.children)
				break
			case 'emphasis':
				out.push(
					<Text style={{ fontStyle: 'italic' }}>
						<Inlines
							sources={props.sources}
							nodes={n.children}
							stream={props.stream && { boundaries: props.stream.boundaries, start: at }}
							segKey={key}
						/>
					</Text>,
				)

				pos += mdInlineLen(n.children)
				break
			case 'link': {
				const safe = sanitizeUrl(n.url)
				out.push(
					safe ? (
						<Link href={n.url}>
							<Text style={{ textDecorationLine: 'underline' }}>
								<Inlines
									sources={props.sources}
									nodes={n.children}
									stream={props.stream && { boundaries: props.stream.boundaries, start: at }}
									segKey={key}
								/>
							</Text>
						</Link>
					) : (
						<Inlines
							sources={props.sources}
							nodes={n.children}
							stream={props.stream && { boundaries: props.stream.boundaries, start: at }}
							segKey={key}
						/>
					),
				)

				pos += mdInlineLen(n.children)
				break
			}
			case 'image':
				// Inline images render as their alt text inside text runs — a
				// view inside a text run is not part of the shared inline
				// vocabulary (milestone-1 inline contract).
				out.push(n.alt)
				pos += n.alt.length
				break
			case 'citation': {
				const source = props.sources?.[n.sourceId]
				out.push(
					source ? (
						<Citation
							source={source}
							number={Object.keys(props.sources ?? {}).indexOf(n.sourceId) + 1}
							variant="label"
						/>
					) : (
						`[${n.sourceId}]`
					),
				)
				break
			}
			case 'break':
				out.push('\n')
				break
			case 'inlineMath':
				out.push(<Text style={{ fontFamily: 'monospace' }}>{n.value}</Text>)
				pos += n.value.length
				break
			case 'extension':
				out.push(<ExtensionInline node={n} />)
				pos += (n.source ?? '').length
				break
			default:
				out.push(
					props.stream ? (
						<SegmentedText text={n.value} pos={at} stream={props.stream} segKey={key} />
					) : (
						n.value
					),
				)

				pos += n.value.length
		}

		seq++
	}

	return out
}

function MarkdownTable(props: {
	node: Extract<MdNode, { type: 'table' }>
	sources?: Record<string, CitationSource>
}) @{
	const [header, ...rows] = props.node.children
	const columns: TableColumn[] = (header?.children ?? []).map((cell, index) => ({
		key: String(index),
		header: <Inlines nodes={cell.children} sources={props.sources} segKey={`th${index}`} />,
		width: proportional(1),
		align:
			props.node.align[index] === 'right'
				? 'end'
				: props.node.align[index] === 'center'
					? 'center'
					: 'start',
		renderCell: (row) => (
			<Inlines
				nodes={row[String(index)] as readonly MdInline[]}
				sources={props.sources}
				segKey={`td${index}`}
			/>
		),
	}))

	const data = rows.map((row, index) => ({
		id: String(index),
		...Object.fromEntries(row.children.map((cell, i) => [String(i), cell.children])),
	}))

	<Table data={data} columns={columns} idKey="id" />
}

function ListItems(props: {
	node: MdList
	stream?: StreamCursor
	segKey: string
	sources?: Record<string, CitationSource>
	depth: number
	headingLevelStart?: 1 | 2 | 3 | 4 | 5 | 6
}) @{
	const items = []
	for (const [j, item] of props.node.children.entries()) {
		const marker =
			item.checked != null
				? item.checked
					? '☑ '
					: '☐ '
				: props.node.ordered
					? `${(props.node.start ?? 1) + j}${props.node.delimiter ?? '.'} `
					: '• '
		// An item's first paragraph stays inline with the marker; deeper blocks
		// render as their own blocks under it.
		const [first, ...rest] = item.children
		items.push(
			<View style={{ paddingLeft: props.depth > 0 ? 16 : 0 }}>
				<Text>
					{marker}
					{first?.type === 'paragraph' ? (
						<Inlines
							sources={props.sources}
							nodes={first.children}
							stream={props.stream}
							segKey={`${props.segKey}.${j}`}
						/>
					) : null}
				</Text>
				{rest.length > 0 || (first != null && first.type !== 'paragraph') ? (
					<Blocks
						nodes={first != null && first.type !== 'paragraph' ? item.children : rest}
						sources={props.sources}
						segKey={`${props.segKey}.${j}`}
						depth={props.depth + 1}
						headingLevelStart={props.headingLevelStart}
					/>
				) : null}
			</View>,
		)
	}

	return items
}

function Blocks(props: {
	nodes: readonly MdNode[]
	stream?: StreamCursor
	segKey: string
	sources?: Record<string, CitationSource>
	depth: number
	headingLevelStart?: 1 | 2 | 3 | 4 | 5 | 6
}) @{
	const blocks = []
	for (const [i, node] of props.nodes.entries()) {
		const segKey = `${props.segKey}.${i}`
		switch (node.type) {
			case 'heading':
				blocks.push(
					<Heading
						level={
							Math.min(6, node.depth + (props.headingLevelStart ?? 1) - 1) as 1 | 2 | 3 | 4 | 5 | 6
						}
						className={
							headingClass[Math.min(6, node.depth + (props.headingLevelStart ?? 1) - 1) - 1] ??
							'font-semibold'
						}
					>
						<Inlines
							sources={props.sources}
							nodes={node.children}
							stream={props.stream}
							segKey={segKey}
						/>
					</Heading>,
				)
				break
			case 'paragraph':
				blocks.push(
					<Text>
						<Inlines
							sources={props.sources}
							nodes={node.children}
							stream={props.stream}
							segKey={segKey}
						/>
					</Text>,
				)
				break
			case 'code':
				blocks.push(<CodeBlock code={node.value} language={node.lang ?? undefined} />)
				break
			case 'math':
				blocks.push(<CodeBlock code={node.value} />)
				break
			case 'table':
				blocks.push(<MarkdownTable node={node} sources={props.sources} />)
				break
			case 'list':
				blocks.push(
					<ListItems
						node={node}
						sources={props.sources}
						segKey={segKey}
						depth={props.depth}
						stream={props.stream}
						headingLevelStart={props.headingLevelStart}
					/>,
				)
				break
			case 'blockquote':
				blocks.push(
					<View style={{ paddingLeft: 12, borderLeftWidth: 2, borderColor: 'var(--color-border)' }}>
						<Blocks
							nodes={node.children}
							sources={props.sources}
							segKey={segKey}
							depth={props.depth + 1}
							headingLevelStart={props.headingLevelStart}
						/>
					</View>,
				)
				break
			case 'thematicBreak':
				blocks.push(<View style={{ height: 1, backgroundColor: 'var(--color-border)' }} />)
				break
			case 'image':
				blocks.push(
					<Text className="text-muted" style={{ fontStyle: 'italic' }}>
						{node.alt}
					</Text>,
				)
				break
			case 'extension':
				// Block extension nodes have no default rendering until the
				// extension system lands (milestone 5); show the source text.
				blocks.push(node.source != null ? <Text>{node.source}</Text> : null)
				break
			default:
				blocks.push(null)
		}
	}

	return blocks
}

/** Renders a markdown doc with the shared vocabulary — Text blocks on every
 *  platform. `data` is the AST the codegen baked into routes.gen.data (or a
 *  doc built programmatically); `text` parses at runtime, with `isStreaming`
 *  enabling incremental parsing + withheld partial constructs for growing
 *  chat-style input. */
export function Markdown(props: MarkdownProps): unknown @{
	// Octane re-runs reactive slots rather than the whole body, so every piece
	// derived from the current props lives inside this one memo: the parsed
	// blocks, the fade boundary ring, and each block's absolute rendered-text
	// offset.
	const incRef = useRef<MarkdownIncrementalState | undefined>(undefined)
	const prevLenRef = useRef(0)
	const boundariesRef = useRef<number[]>([])
	const prevTextRef = useRef('')
	const prevStreaming = useRef<boolean | undefined>(undefined)

	const view = useMemo(() => {
		const streaming = props.isStreaming === true && props.data == null
		const fade = streaming && props.fadeIn !== false
		const text = props.data ? '' : (props.text ?? '')
		const sourceIds = props.sources == null ? undefined : new Set(Object.keys(props.sources))

		if (prevStreaming.current !== streaming) {
			incRef.current = undefined
			prevStreaming.current = streaming
		}

		let nodes: MdNode[]
		if (props.data) {
			nodes = [...props.data.children]
		} else if (streaming) {
			incRef.current ??= createMarkdownIncrementalState()
			// Withhold trailing incomplete constructs — same layering as the
			// reference component, which trims before the incremental parse.
			nodes = parseMarkdownIncremental(trimStreamingArtifacts(text), incRef.current, {
				sourceIds,
			})
		} else {
			incRef.current = undefined
			nodes = parseMdNodes(text, { sourceIds })
		}

		// Fade bookkeeping: a boundary is pushed at the previous rendered
		// length each time the text grows; segments split text leaves at
		// boundaries. Reset when the input is replaced rather than appended.
		if (!text.startsWith(prevTextRef.current)) {
			boundariesRef.current = []
			prevLenRef.current = 0
		}

		prevTextRef.current = text
		const boundaries = fade
			? computeBoundaries(boundariesRef.current, prevLenRef.current, MAX_FADE_SPANS)
			: []

		boundariesRef.current = boundaries

		const offsets: number[] = new Array(nodes.length)
		let acc = 0
		for (let i = 0; i < nodes.length; i++) {
			offsets[i] = acc
			acc += markdownTextLength([nodes[i]])
		}

		prevLenRef.current = acc

		return { nodes, boundaries, offsets, fade }
	}, [props.data, props.text, props.isStreaming, props.fadeIn, props.sources])

	const blockStream = (i: number): StreamCursor | undefined =>
		view.fade ? { boundaries: view.boundaries, start: view.offsets[i] } : undefined

	<View className={props.density === 'compact' ? 'gap-2' : 'gap-3'}>
		{view.nodes.map((node, i) => (
			<Blocks
				nodes={[node]}
				sources={props.sources}
				segKey={`b${i}`}
				depth={0}
				stream={blockStream(i)}
				headingLevelStart={props.headingLevelStart}
			/>
		))}
	</View>
}

/** Route screen for `.md` files — the codegen emits specs with this as
 *  `screen`, so a markdown file in the route dir is a route end-to-end.
 *  Receives baked data like any route (`props.data`). */
export function MarkdownScreen(props: MarkdownScreenProps): unknown @{
	<Screen className="vx-app">
		<ScrollableArea padding={4}>
			{props.data != null ? <Markdown data={props.data} /> : null}
		</ScrollableArea>
	</Screen>
}
