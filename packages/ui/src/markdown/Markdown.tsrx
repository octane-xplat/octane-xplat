/** @jsxImportSource @octane-xplat/jsx */
import { useMemo, useRef } from 'octane'
import { Screen } from '../components/layout/Screen'
import { ScrollableArea } from '../components/layout/ScrollableArea'
import { Text } from '../components/content/Text'
import { Heading } from '../components/content/Heading'
import { View } from '../components/layout/View'
import { Link } from '../components/navigation/Link'
import { sanitizeUrl } from '../routing/safe-url'
import { Citation } from '../components/content/Citation'
import { Table } from '../table/Table'
import { CodeBlock } from '../components/content/CodeBlock'
import { proportional } from '../table/column-utils'
import { mdInlineLen, parseMdNodes } from './markdown-parse'
import {
	computeBoundaries,
	computeSegments,
	createMarkdownIncrementalState,
	markdownTextLength,
	parseMarkdownIncremental,
	type MarkdownIncrementalState,
} from './markdown-stream'

import type {
	MarkdownProps,
	MarkdownScreenProps,
	MdInline,
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

function CitedText(props: { text: string; sources: Record<string, CitationSource> }) @{
	const parts = props.text.split(/(\[[a-zA-Z0-9_-]+\])/g)

	<>
		{parts.map((part) => {
			const id = part.slice(1, -1)
			const source = part.startsWith('[') ? props.sources[id] : undefined
			return source ? (
				<Citation
					source={source}
					number={Object.keys(props.sources).indexOf(id) + 1}
					variant="label"
				/>
			) : (
				part
			)
		})}
	</>
}

function Inlines(props: {
	nodes: MdInline[]
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
		switch (n.t) {
			case 'code':
				out.push(<Text style={{ fontFamily: 'monospace' }}>{n.text}</Text>)

				pos += n.text.length
				break
			case 'bold':
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
			case 'strike':
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
			case 'em':
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
			case 'link':
				out.push(
					sanitizeUrl(n.href) ? (
						<Link href={n.href}>
							<Text style={{ textDecorationLine: 'underline' }}>{n.text}</Text>
						</Link>
					) : (
						<Text>{n.text}</Text>
					),
				)

				pos += n.text.length
				break
			default:
				out.push(
					props.sources ? (
						<CitedText text={n.text} sources={props.sources} />
					) : props.stream ? (
						<SegmentedText text={n.text} pos={at} stream={props.stream} segKey={key} />
					) : (
						n.text
					),
				)

				pos += n.text.length
		}

		seq++
	}

	return out
}

function MarkdownTable(props: {
	node: Extract<MdNode, { t: 'table' }>
	sources?: Record<string, CitationSource>
}) @{
	const columns: TableColumn[] = props.node.header.map((cell, index) => ({
		key: String(index),
		header: <Inlines nodes={cell} sources={props.sources} segKey={`th${index}`} />,
		width: proportional(1),
		align:
			props.node.align[index] === 'right'
				? 'end'
				: props.node.align[index] === 'center'
					? 'center'
					: 'start',
		renderCell: (row) => (
			<Inlines
				nodes={row[String(index)] as MdInline[]}
				sources={props.sources}
				segKey={`td${index}`}
			/>
		),
	}))

	const data = props.node.rows.map((row, index) => ({
		id: String(index),
		...Object.fromEntries(row.map((cell, i) => [String(i), cell])),
	}))

	<Table data={data} columns={columns} idKey="id" />
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

		if (prevStreaming.current !== streaming) {
			incRef.current = undefined
			prevStreaming.current = streaming
		}

		let nodes: MdNode[]
		if (props.data) {
			nodes = props.data.children ?? []
		} else if (streaming) {
			incRef.current ??= createMarkdownIncrementalState()
			nodes = parseMarkdownIncremental(text, incRef.current)
		} else {
			incRef.current = undefined
			nodes = parseMdNodes(text)
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
	}, [props.data, props.text, props.isStreaming, props.fadeIn])

	const blockStream = (i: number): StreamCursor | undefined =>
		view.fade ? { boundaries: view.boundaries, start: view.offsets[i] } : undefined

	<View className={props.density === 'compact' ? 'gap-2' : 'gap-3'}>
		{view.nodes.map((node, i) => {
			switch (node.t) {
				case 'h':
					return (
						<Heading
							level={
								Math.min(6, node.depth + (props.headingLevelStart ?? 1) - 1) as
									| 1
									| 2
									| 3
									| 4
									| 5
									| 6
							}
							className={
								headingClass[Math.min(6, node.depth + (props.headingLevelStart ?? 1) - 1) - 1] ??
								'font-semibold'
							}
						>
							<Inlines
								sources={props.sources}
								nodes={node.children}
								stream={blockStream(i)}
								segKey={`h${i}`}
							/>
						</Heading>
					)
				case 'p':
					return (
						<Text>
							<Inlines
								sources={props.sources}
								nodes={node.children}
								stream={blockStream(i)}
								segKey={`p${i}`}
							/>
						</Text>
					)
				case 'code':
					return <CodeBlock code={node.text} language={node.lang} />
				case 'table':
					return <MarkdownTable node={node} sources={props.sources} />
				case 'list': {
					let itemOffset = view.offsets[i]
					return node.items.map((item, j) => {
						const start = itemOffset
						itemOffset += mdInlineLen(item)
						return (
							<Text>
								{node.checked?.[j] != null
									? node.checked[j]
										? '☑ '
										: '☐ '
									: node.ordered
										? `${j + 1}. `
										: '• '}
								<Inlines
									sources={props.sources}
									nodes={item}
									stream={blockStream(i) && { boundaries: view.boundaries, start }}
									segKey={`l${i}.${j}`}
								/>
							</Text>
						)
					})
				}
				case 'quote':
					return (
						<Text className="text-muted" style={{ fontStyle: 'italic' }}>
							<Inlines
								sources={props.sources}
								nodes={node.children}
								stream={blockStream(i)}
								segKey={`q${i}`}
							/>
						</Text>
					)
				case 'hr':
					return <View style={{ height: 1, backgroundColor: 'var(--color-border)' }} />
				default:
					return null
			}
		})}
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
