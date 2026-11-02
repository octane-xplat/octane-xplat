/** @jsxImportSource @octane-xplat/jsx */
import { useMemo, useRef } from 'octane'
import { Screen } from '../components/layout/Screen.tsrx'
import { ScrollableArea } from '../components/layout/ScrollableArea.tsrx'
import { Text } from '../components/content/Text.tsrx'
import { Heading } from '../components/content/Heading.tsrx'
import { View } from '../components/layout/View.tsrx'
import { Blockquote } from '../components/content/Blockquote.tsrx'
import { Image } from '../components/media/Image.tsrx'
import { Code } from '../components/content/Code.tsrx'
import { CodeBlock } from '../components/content/CodeBlock.tsrx'
import { ListMarkerScope } from '../components/collections/ListMarkerScope.tsrx'
import { MdRowList, MdRowItem, MdCheckList, MdCheckItem } from './markdown-list.tsrx'
import { useTranslator } from '../internal/platform/internationalization'
import {
	Table,
	TableBody,
	TableCell,
	TableHeader,
	TableHeaderCell,
	TableRow,
} from '../table/Table.tsrx'
import { sanitizeUrl } from '../routing/safe-url'
import { mdInlineLen, mdInlineText } from './markdown-ast'
import { parseMdInline, parseMdNodes } from './markdown-parse'
import {
	computeBoundaries,
	computeSegments,
	createMarkdownIncrementalState,
	markdownTextLength,
	parseMarkdownIncremental,
	trimStreamingArtifacts,
	type MarkdownIncrementalState,
} from './markdown-stream'
import { projectMdHeadings } from '../components/collections/outline-utils'
import {
	MdBreak,
	MdCitation,
	MdDelete,
	MdEmphasis,
	MdFadeRun,
	MdInlineImage,
	MdInlineRoot,
	MdLinkRun,
	MdParagraph,
	MdStrong,
} from './markdown-inline.tsrx'
import {
	parseCssDuration,
	useStreamingText,
} from '../components/content/use-streaming-text.tsrx'
import { useTheme } from '../theme/use-theme.tsrx'

import type {
	MarkdownInlinePlugin,
	MarkdownProps,
	MarkdownScreenProps,
	MarkdownComponents,
	MdInline,
	MdList,
	MdNode,
	MdTable,
	CitationSource,
	NavigationActivationEvent,
} from '../props'

export type { MdDoc, MdInline, MdNode } from '../props'

// ---------------------------------------------------------------------------
// Reference-matched defaults (Astryx Markdown 0.7.4)
// ---------------------------------------------------------------------------

const DEFAULT_CONTENT_WIDTH = 680

/** Per-block-type margin pairs [start, end] — upstream spacing tokens. */
const SPACING: Record<string, { d: readonly [number, number]; c: readonly [number, number] }> = {
	headingMajor: { d: [24, 12], c: [16, 8] },
	headingMinor: { d: [16, 8], c: [12, 4] },
	paragraph: { d: [12, 12], c: [4, 4] },
	code: { d: [16, 16], c: [8, 8] },
	blockquote: { d: [16, 16], c: [8, 8] },
	list: { d: [12, 12], c: [4, 4] },
	table: { d: [16, 16], c: [8, 8] },
	hr: { d: [24, 24], c: [12, 12] },
	image: { d: [12, 12], c: [8, 8] },
}

function blockSpacing(node: MdNode, compact: boolean): readonly [number, number] {
	const slot =
		node.type === 'heading'
			? node.depth <= 3
				? 'headingMajor'
				: 'headingMinor'
			: node.type === 'paragraph' || node.type === 'extension'
				? 'paragraph'
				: node.type === 'code' || node.type === 'math'
					? 'code'
					: node.type === 'thematicBreak'
						? 'hr'
						: node.type
	const s = SPACING[slot] ?? SPACING.paragraph
	return compact ? s.c : s.d
}

/** Collapsed-seam margins — upstream relies on CSS margin collapsing; a
 *  computed marginTop per block gives the identical geometry on hosts
 *  without collapsing (native) and on web. */
function seamStyle(nodes: readonly MdNode[], i: number, compact: boolean) {
	if (i === 0) return undefined
	const prevEnd = blockSpacing(nodes[i - 1], compact)[1]
	const start = blockSpacing(nodes[i], compact)[0]
	return { marginTop: Math.max(prevEnd, start) }
}

/** Bullet markers cycle disc/circle/square; ordered markers cycle
 *  decimal/lower-alpha/lower-roman (spec AST-061 DEC-6). */
const BULLET_MARKERS = ['disc', 'circle', 'square'] as const
const NUMBER_MARKERS = ['decimal', 'lower-alpha', 'lower-roman'] as const

/** Read a Markdown fence info string the way the reference renders it:
 *  `diff` layers over plaintext, `diff-<lang>` over `<lang>`. */
function parseFenceLanguage(info: string | undefined): { language: string; isDiff: boolean } {
	const value = (info ?? '').trim()
	if (value === 'diff') return { language: 'plaintext', isDiff: true }
	const layered = /^diff-(.+)$/.exec(value)
	if (layered) return { language: layered[1], isDiff: true }
	return { language: value || 'plaintext', isDiff: false }
}

/** Table column floors, in `ch` — content-derived readable floors matching
 *  the reference's TABLE_COLUMN_* tuning. */
const TABLE_COLUMN_MIN_CH = 4
const TABLE_COLUMN_MAX_CH = 24
const TABLE_COLUMN_TARGET_LINES = 2
const TABLE_HEADER_ONE_LINE_MAX_CH = 20

function computeTableColumnMinWidths(node: MdTable): number[] {
	const [header, ...rows] = node.children
	if (header == null) return []
	return header.children.map((cell, colIdx) => {
		const headerLen = mdInlineLen(cell.children)
		let maxLen = headerLen
		for (const row of rows) {
			const rowCell = row.children[colIdx]
			if (rowCell != null) {
				const len = mdInlineLen(rowCell.children)
				if (len > maxLen) maxLen = len
			}
		}
		const bodyFloor = Math.ceil(maxLen / TABLE_COLUMN_TARGET_LINES)
		const headerFloor = Math.min(headerLen, TABLE_HEADER_ONE_LINE_MAX_CH)
		return Math.min(TABLE_COLUMN_MAX_CH, Math.max(TABLE_COLUMN_MIN_CH, bodyFloor, headerFloor))
	})
}

// ---------------------------------------------------------------------------
// Streaming fade
// ---------------------------------------------------------------------------

interface StreamCursor {
	boundaries: number[]
	start: number
	/** Ambient color token for fade runs on native (opacity channel absent). */
	runColor?: string
}

/** Split one text run at stream boundaries into keyed settled/fade segments
 *  (Astryx `wrapTextWithFade` + `computeSegments` key contract). */
function SegmentedText(props: { text: string; pos: number; stream: StreamCursor; segKey: string }) {
	const segs = computeSegments(props.text, props.pos, props.stream.boundaries, props.segKey)
	if (!segs) return props.text
	return (
		<span key={`wrap-${props.segKey}`}>
			{segs.map((seg) =>
				seg.fading ? (
					<MdFadeRun key={seg.key} runColor={props.stream.runColor}>
						{seg.text}
					</MdFadeRun>
				) : (
					<span key={seg.key}>{seg.text}</span>
				),
			)}
		</span>
	)
}

// ---------------------------------------------------------------------------
// Shared render context (threaded like the reference's cursor/citation ctx)
// ---------------------------------------------------------------------------

interface RenderCtx {
	stream?: StreamCursor
	onLinkClick?: (href: string, event: NavigationActivationEvent) => void | false
	citations?: {
		sources: Record<string, CitationSource>
		numberMap: Map<string, number>
		nextNumber: number
		style: 'label' | 'number'
	}
	inlinePlugins?: MarkdownInlinePlugin[]
	components?: Partial<MarkdownComponents>
	headingIds?: ReadonlyMap<MdNode, string>
	headingLevelStart?: 1 | 2 | 3 | 4 | 5 | 6
	listDepth: number
}

function citationNumber(ctx: NonNullable<RenderCtx['citations']>, sourceId: string): number {
	let num = ctx.numberMap.get(sourceId)
	if (num == null) {
		num = ctx.nextNumber++
		ctx.numberMap.set(sourceId, num)
	}
	return num
}

// ---------------------------------------------------------------------------
// Legacy inline-plugin matching (ported from Markdown.tsx 0.7.4)
// ---------------------------------------------------------------------------

type InlineSegment =
	| { type: 'text'; content: string }
	| { type: 'plugin'; element: unknown; matchLength: number }

function applyInlinePlugins(text: string, plugins: MarkdownInlinePlugin[]): InlineSegment[] {
	interface RawMatch {
		start: number
		end: number
		match: RegExpMatchArray
		plugin: MarkdownInlinePlugin
	}
	const allMatches: RawMatch[] = []
	for (const plugin of plugins) {
		plugin.pattern.lastIndex = 0
		let m: RegExpExecArray | null
		while ((m = plugin.pattern.exec(text)) !== null) {
			let end: number
			if (plugin.getEndIndex) {
				const result = plugin.getEndIndex(text, m)
				if (result === false) continue
				end = result
			} else {
				end = m.index + m[0].length
			}
			allMatches.push({ start: m.index, end, match: m, plugin })
		}
	}
	allMatches.sort((a, b) => a.start - b.start)
	const resolved: RawMatch[] = []
	let lastEnd = 0
	for (const m of allMatches) {
		if (m.start >= lastEnd) {
			resolved.push(m)
			lastEnd = m.end
		}
	}
	if (resolved.length === 0) return [{ type: 'text', content: text }]
	const segments: InlineSegment[] = []
	let cursor = 0
	for (let i = 0; i < resolved.length; i++) {
		const m = resolved[i]
		if (m.start > cursor) segments.push({ type: 'text', content: text.slice(cursor, m.start) })
		segments.push({
			type: 'plugin',
			element: m.plugin.render(m.match, `plugin-${i}`),
			matchLength: m.end - m.start,
		})
		cursor = m.end
	}
	if (cursor < text.length) segments.push({ type: 'text', content: text.slice(cursor) })
	return segments
}

// ---------------------------------------------------------------------------
// Inline renderer
// ---------------------------------------------------------------------------

function Inlines(props: {
	nodes: readonly MdInline[]
	segKey: string
	ctx: RenderCtx
}): unknown @{
	const out = []
	let pos = props.ctx.stream?.start ?? 0
	let seq = 0
	const streamOf = (at: number, runColor?: string): StreamCursor | undefined =>
		props.ctx.stream && {
			boundaries: props.ctx.stream.boundaries,
			start: at,
			runColor: runColor ?? props.ctx.stream.runColor,
		}
	for (const n of props.nodes ?? []) {
		const at = pos
		const key = `${props.segKey}.${seq}`
		switch (n.type) {
			case 'text': {
				if (props.ctx.inlinePlugins && props.ctx.inlinePlugins.length > 0) {
					const segments = applyInlinePlugins(n.value, props.ctx.inlinePlugins)
					if (!(segments.length === 1 && segments[0].type === 'text')) {
						let segPos = at
						for (const seg of segments) {
							if (seg.type === 'text') {
								out.push(
									props.ctx.stream ? (
										<SegmentedText text={seg.content} pos={segPos} stream={streamOf(segPos)!} segKey={key} />
									) : (
										seg.content
									),
								)
								segPos += seg.content.length
							} else {
								out.push(seg.element)
								segPos += seg.matchLength
							}
						}
						pos += n.value.length
						break
					}
				}
				out.push(
					props.ctx.stream ? (
						<SegmentedText text={n.value} pos={at} stream={streamOf(at)!} segKey={key} />
					) : (
						n.value
					),
				)
				pos += n.value.length
				break
			}
			case 'strong':
				out.push(
					<MdStrong>
						<Inlines nodes={n.children} ctx={{ ...props.ctx, stream: streamOf(at) }} segKey={key} />
					</MdStrong>,
				)
				pos += mdInlineLen(n.children)
				break
			case 'emphasis':
				out.push(
					<MdEmphasis>
						<Inlines nodes={n.children} ctx={{ ...props.ctx, stream: streamOf(at) }} segKey={key} />
					</MdEmphasis>,
				)
				pos += mdInlineLen(n.children)
				break
			case 'delete':
				out.push(
					<MdDelete>
						<Inlines nodes={n.children} ctx={{ ...props.ctx, stream: streamOf(at, '--color-text-secondary') }} segKey={key} />
					</MdDelete>,
				)
				pos += mdInlineLen(n.children)
				break
			case 'inlineCode': {
				const Comp = props.ctx.components?.inlineCode as any
				out.push(Comp ? <Comp>{n.value}</Comp> : <Code>{n.value}</Code>)
				pos += n.value.length
				break
			}
			case 'inlineMath': {
				const Comp = props.ctx.components?.math as any
				if (Comp == null) {
					out.push(
						props.ctx.stream ? (
							<SegmentedText text={`$${n.value}$`} pos={at} stream={streamOf(at)!} segKey={key} />
						) : (
							`$${n.value}$`
						),
					)
				} else {
					out.push(<Comp value={n.value} display="inline" />)
				}
				pos += n.value.length
				break
			}
			case 'link': {
				const safe = sanitizeUrl(n.url)
				const kids = (
					<Inlines nodes={n.children} ctx={{ ...props.ctx, stream: streamOf(at, '--color-text-accent') }} segKey={key} />
				)
				if (safe == null) {
					out.push(kids)
				} else {
					const Comp = props.ctx.components?.link as any
					out.push(
						Comp ? (
							<Comp href={safe}>{kids}</Comp>
						) : (
							<MdLinkRun href={safe} onLinkClick={props.ctx.onLinkClick}>
								{kids}
							</MdLinkRun>
						),
					)
				}
				pos += mdInlineLen(n.children)
				break
			}
			case 'image': {
				const safe = sanitizeUrl(n.url)
				const Comp = props.ctx.components?.image as any
				out.push(
					safe == null ? (
						`[${n.alt}]`
					) : Comp ? (
						<Comp src={safe} alt={n.alt} />
					) : (
						<MdInlineImage src={safe} alt={n.alt} />
					),
				)
				pos += n.alt.length
				break
			}
			case 'citation': {
				pos += 1
				const cctx = props.ctx.citations
				if (!cctx) {
					out.push(`[${n.sourceId}]`)
					break
				}
				const num = citationNumber(cctx, n.sourceId)
				const source = cctx.sources[n.sourceId] ?? { title: n.sourceId }
				const variant = cctx.style === 'number' ? 'number' : 'label'
				const Comp = props.ctx.components?.citation as any
				out.push(
					Comp ? (
						<Comp source={source} number={num} variant={variant} />
					) : (
						<MdCitation source={source} number={num} variant={variant} />
					),
				)
				break
			}
			case 'break':
				pos += 1
				out.push(<MdBreak />)
				break
			case 'extension':
				out.push(
					props.ctx.stream ? (
						<SegmentedText text={n.source ?? ''} pos={at} stream={streamOf(at)!} segKey={key} />
					) : (
						(n.source ?? '')
					),
				)
				pos += (n.source ?? '').length
				break
			default:
				out.push(
					props.ctx.stream ? (
						<SegmentedText text={(n as any).value ?? ''} pos={at} stream={streamOf(at)!} segKey={key} />
					) : (
						((n as any).value ?? '')
					),
				)
				pos += ((n as any).value ?? '').length
		}
		seq++
	}
	return out
}

// ---------------------------------------------------------------------------
// Block renderer
// ---------------------------------------------------------------------------

function MarkdownTable(props: { node: MdTable; ctx: RenderCtx }): unknown @{
	const colMinWidths = computeTableColumnMinWidths(props.node)
	const [header, ...rows] = props.node.children
	const cellCtx = props.ctx.components?.inlineCode
		? props.ctx
		: {
				...props.ctx,
				components: {
					...props.ctx.components,
					// Inline code inside a cell keeps its token whole — the same
					// override point the reference reserves inside tables.
					inlineCode: (p: { children?: unknown }) => (
						<Code style={{ wordBreak: 'normal' }}>{p.children}</Code>
					),
				} as Partial<MarkdownComponents>,
			}
	const cellAlign = (i: number) =>
		props.node.align[i] === 'center'
			? ('center' as const)
			: props.node.align[i] === 'right'
				? ('end' as const)
				: undefined

	<View style={{ maxWidth: '100%' }} className="vx-md-table">
		<Table dividers="grid" textOverflow="wrap" style={{ borderWidth: 1, borderColor: 'var(--color-border)', borderStyle: 'solid' }}>
			<TableHeader>
				<TableRow>
					{header?.children.map((h, i) => (
						<TableHeaderCell
							style={{
								minWidth: `${colMinWidths[i]}ch`,
								boxSizing: 'content-box',
								maxWidth: 'none',
								overflow: 'visible',
								overflowWrap: 'break-word',
								wordBreak: 'normal',
								textOverflow: 'clip',
								whiteSpace: 'normal',
								padding: 8,
								...(cellAlign(i) != null ? { textAlign: cellAlign(i) } : {}),
							}}
						>
							<Inlines nodes={h.children} ctx={cellCtx} segKey={`th${i}`} />
						</TableHeaderCell>
					))}
				</TableRow>
			</TableHeader>
			<TableBody>
				{rows.map((row, i) => (
					<TableRow>
						{row.children.map((cell, j) => (
							<TableCell
								style={{
									boxSizing: 'content-box',
									maxWidth: 'none',
									overflow: 'visible',
									overflowWrap: 'break-word',
									wordBreak: 'normal',
									padding: 8,
									...(cellAlign(j) != null ? { textAlign: cellAlign(j) } : {}),
								}}
							>
								<Inlines nodes={cell.children} ctx={cellCtx} segKey={`tr${i}c${j}`} />
							</TableCell>
						))}
					</TableRow>
				))}
			</TableBody>
		</Table>
	</View>
}

function ListItems(props: {
	node: MdList
	segKey: string
	ctx: RenderCtx
	contentWidth: number | string | null
	contentAlign: 'start' | 'center'
	compact: boolean
}): unknown @{
	const node = props.node
	const isTaskList =
		node.children.length > 0 && node.children.every((item) => item.checked != null)

	const t = useTranslator()
	const itemContent = (item: MdList['children'][number], j: number) => {
		const first = item.children[0]
		const isInline = item.children.length === 1 && first?.type === 'paragraph'
		return isInline ? (
			<Inlines nodes={first.children} ctx={props.ctx} segKey={`${props.segKey}.${j}`} />
		) : (
			<Blocks
				nodes={item.children}
				segKey={`${props.segKey}.${j}`}
				ctx={{ ...props.ctx, listDepth: props.ctx.listDepth + 1 }}
				contentWidth={props.contentWidth}
				contentAlign={props.contentAlign}
				compact={props.compact}
			/>
		)
	}
	const itemText = (item: MdList['children'][number]): string => {
		const firstParagraph = item.children.find((b) => b.type === 'paragraph') as
			| { children: readonly MdInline[] }
			| undefined
		return firstParagraph != null
			? mdInlineText(firstParagraph.children)
			: t('@astryx.markdown.taskList')
	}

	if (isTaskList) {
		const checkedValues = node.children
			.map((item, i) => ({ item, key: `task-${i}` }))
			.filter(({ item }) => item.checked)
			.map(({ key }) => key)
		return (
			<MdCheckList value={checkedValues} label={t('@astryx.markdown.taskList')}>
				{node.children.map((item, i) => (
					<MdCheckItem
						value={`task-${i}`}
						label={itemContent(item, i)}
						textLabel={itemText(item)}
					/>
				))}
			</MdCheckList>
		)
	}

	return (
		// Rows reach one spacing-2 inset past the container line on each side,
		// like the reference's `blockIndent` on the list itself.
		<MdRowList ordered={node.ordered} start={node.start} style={{ marginLeft: -8, marginRight: -8 }}>
			{node.children.map((item, j) => {
				// A task item beside plain items keeps its own checked state: it
				// shows a read-only checkbox where its marker would be, named by
				// its text (FR23).
				const task =
					item.checked == null
						? undefined
						: { isChecked: item.checked, label: itemText(item) }
				return (
					<ListMarkerScope
						marker={(node.ordered ? NUMBER_MARKERS : BULLET_MARKERS)[props.ctx.listDepth % 3]}
						task={task}
					>
						<MdRowItem index={j} label={itemContent(item, j)} />
					</ListMarkerScope>
				)
			})}
		</MdRowList>
	)
}

function Blocks(props: {
	nodes: readonly MdNode[]
	segKey: string
	ctx: RenderCtx
	contentWidth: number | string | null
	contentAlign: 'start' | 'center'
	compact: boolean
	margin?: { marginTop: number } | undefined
}): unknown @{
	const proseStyle = () => ({
		...(props.contentWidth != null ? { maxWidth: props.contentWidth } : {}),
		...(props.contentAlign === 'center' ? { alignSelf: 'center' } : {}),
	})
	const blockAlignStyle = () => (props.contentAlign === 'center' ? { alignSelf: 'center' } : {})

	const blocks = []
	for (const [i, node] of props.nodes.entries()) {
		const segKey = `${props.segKey}.${i}`
		const margin = props.margin !== undefined ? props.margin : seamStyle(props.nodes, i, props.compact)
		switch (node.type) {
			case 'heading': {
				const level = Math.min(6, node.depth + (props.ctx.headingLevelStart ?? 1) - 1) as
					| 1 | 2 | 3 | 4 | 5 | 6
				const kids = <Inlines nodes={node.children} ctx={props.ctx} segKey={segKey} />
				const headingId = props.ctx.headingIds?.get(node)
				const Comp = props.ctx.components?.heading as any
				blocks.push(
					Comp ? (
						<Comp level={level} id={headingId}>{kids}</Comp>
					) : (
						<Heading level={level} id={headingId} style={{ ...margin, ...proseStyle() } as never}>
							{kids}
						</Heading>
					),
				)
				break
			}
			case 'paragraph': {
				const kids = <Inlines nodes={node.children} ctx={props.ctx} segKey={segKey} />
				const Comp = props.ctx.components?.paragraph as any
				blocks.push(
					Comp ? (
						<Comp>{kids}</Comp>
					) : (
						<MdParagraph style={{ ...margin, ...proseStyle() } as never}>{kids}</MdParagraph>
					),
				)
				break
			}
			case 'code': {
				const legacyLanguage = node.lang ?? 'plaintext'
				const fence = parseFenceLanguage(node.lang ?? legacyLanguage)
				const diffLanguage = fence.isDiff
					? fence.language.match(/^\w*/)?.[0] || 'plaintext'
					: undefined
				const language = diffLanguage ?? legacyLanguage
				const Comp = props.ctx.components?.code as any
				blocks.push(
					Comp ? (
						<Comp code={node.value} language={legacyLanguage} />
					) : (
						<View
							className="vx-md-codeblock"
							style={{ ...margin, ...blockAlignStyle(), maxWidth: '100%' } as never}
						>
							<CodeBlock
								code={node.value}
								language={language}
								isDiff={fence.isDiff}
								isCollapsible
								isWrapped
								width="100%"
							/>
						</View>
					),
				)
				break
			}
			case 'math': {
				const Comp = props.ctx.components?.math as any
				blocks.push(
					Comp ? (
						<Comp value={node.value} display="block" />
					) : (
						<MdParagraph style={margin as never}>{`$$${node.value}$$`}</MdParagraph>
					),
				)
				break
			}
			case 'table':
				blocks.push(
					<View style={{ ...margin, ...blockAlignStyle(), maxWidth: '100%' } as never}>
						<MarkdownTable node={node} ctx={props.ctx} />
					</View>,
				)
				break
			case 'list':
				blocks.push(
					<View style={{ ...margin, ...proseStyle() } as never}>
						<ListItems node={node} segKey={segKey} ctx={props.ctx} contentWidth={props.contentWidth} contentAlign={props.contentAlign} compact={props.compact} />
					</View>,
				)
				break
			case 'blockquote': {
				const kids = (
					<Blocks
						nodes={node.children}
						segKey={segKey}
						ctx={props.ctx}
						contentWidth={props.contentWidth}
						contentAlign={props.contentAlign}
						compact={props.compact}
					/>
				)
				const Comp = props.ctx.components?.blockquote as any
				blocks.push(
					Comp ? (
						<Comp>{kids}</Comp>
					) : (
						<Blockquote style={{ ...margin, ...proseStyle() } as never}>{kids}</Blockquote>
					),
				)
				break
			}
			case 'thematicBreak': {
				const Comp = props.ctx.components?.hr as any
				blocks.push(
					Comp ? (
						<Comp />
					) : (
						<View
							style={{
								...margin,
								height: 1,
								borderTopWidth: 1,
								borderTopColor: 'var(--color-border)',
							} as never}
						/>
					),
				)
				break
			}
			case 'image': {
				const safe = sanitizeUrl(node.url)
				const Comp = props.ctx.components?.image as any
				blocks.push(
					safe == null ? (
						<MdParagraph style={margin as never}>{`[${node.alt}]`}</MdParagraph>
					) : Comp ? (
						<Comp src={safe} alt={node.alt} />
					) : (
						<View style={margin as never}>
							<Image
								src={safe}
								alt={node.alt}
								style={{ maxWidth: '100%', borderRadius: 'var(--radius-element, 4px)' }}
							/>
						</View>
					),
				)
				break
			}
			case 'extension':
				// Extension renderers land with the extension system; until then
				// the source text is the fallback, wrapped like a paragraph.
				blocks.push(
					<MdParagraph style={{ ...margin, ...proseStyle() } as never}>
						{node.source ?? ''}
					</MdParagraph>,
				)
				break
			default:
				blocks.push(null)
		}
	}
	return blocks
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/** Renders markdown with the shared vocabulary — recursive block tree,
 *  tappable inline runs, renderer overrides, streaming fade. Exactly one
 *  source: `children` (raw source, Astryx convention) or `data` (a baked
 *  `MdDoc` — baked routes skip the parser). */
export function Markdown(props: MarkdownProps): unknown @{
	const incRef = useRef<MarkdownIncrementalState | undefined>(undefined)
	const prevLenRef = useRef(0)
	const boundariesRef = useRef<number[]>([])
	const prevTextRef = useRef('')

	const compact = props.density === 'compact'
	const align = props.contentAlign === 'center' ? 'center' : 'start'
	const contentWidth = props.contentWidth === undefined ? DEFAULT_CONTENT_WIDTH : props.contentWidth
	const contentWidthValue = contentWidth ? contentWidth : null
	const hasMathRenderer = props.components?.math != null
	const streaming = props.isStreaming === true && props.data == null
	const sourceText = props.data ? '' : typeof props.children === 'string' ? props.children : ''

	// Bursty chunks drain through a steady character reveal before parsing
	// (the reference's internal useStreamingText call): raw markup never
	// reaches the renderer mid-token and the reveal pace matches the theme.
	const smoothedText = useStreamingText(sourceText, streaming)

	// Fade-span budget: spans needed = ceil(fade duration / reveal tick), the
	// reference's boundary-ring formula over the same motion tokens.
	const { token } = useTheme()
	const maxSpans = useMemo(() => {
		const duration = parseCssDuration(token('--duration-fast-max')) ?? 230
		const base = parseCssDuration(token('--duration-fast-min'))
		const tickMs = base != null ? Math.max(4, Math.round(base / 10)) : 50
		return Math.min(Math.ceil(duration / tickMs), 12)
	}, [token])

	const view = useMemo(() => {
		const sourceIds = props.sources == null ? undefined : new Set(Object.keys(props.sources))
		const options = { sourceIds, autolink: props.autolink, math: hasMathRenderer }

		let nodes: MdNode[]
		let inlineNodes: MdInline[]
		const inline = props.display === 'inline'
		if (props.data) {
			nodes = [...props.data.children]
			inlineNodes = []
		} else if (streaming && smoothedText === '') {
			// A cleared stream resets the incremental cache like the reference.
			incRef.current = undefined
			nodes = []
			inlineNodes = []
		} else if (inline) {
			const input = streaming ? trimStreamingArtifacts(smoothedText, options) : smoothedText
			incRef.current = undefined
			inlineNodes = parseMdInline(input, options)
			nodes = []
		} else if (streaming) {
			incRef.current ??= createMarkdownIncrementalState()
			nodes = parseMarkdownIncremental(
				trimStreamingArtifacts(smoothedText, options),
				incRef.current,
				options,
			)
			inlineNodes = []
		} else {
			incRef.current = undefined
			nodes = parseMdNodes(smoothedText, options)
			inlineNodes = []
		}

		if (!smoothedText.startsWith(prevTextRef.current)) {
			boundariesRef.current = []
			prevLenRef.current = 0
		}
		prevTextRef.current = smoothedText
		const boundaries = streaming
			? computeBoundaries(boundariesRef.current, prevLenRef.current, maxSpans)
			: []
		boundariesRef.current = boundaries

		const offsets: number[] = new Array(nodes.length)
		let acc = 0
		for (let i = 0; i < nodes.length; i++) {
			offsets[i] = acc
			acc += markdownTextLength([nodes[i]])
		}
		prevLenRef.current = inline ? mdInlineLen(inlineNodes) : acc

		const headingIds = inline ? undefined : projectMdHeadings(nodes).ids
		return { nodes, inlineNodes, boundaries, offsets, fade: streaming, headingIds }
	}, [props.data, smoothedText, streaming, props.sources, props.display, props.autolink, hasMathRenderer, maxSpans])

	const ctxBase: RenderCtx = {
		onLinkClick: props.onLinkClick,
		citations:
			props.sources == null
				? undefined
				: {
						sources: props.sources,
						numberMap: new Map(),
						nextNumber: 1,
						style: props.citationStyle === 'number' ? 'number' : 'label',
					},
		inlinePlugins: props.inlinePlugins,
		components: props.components,
		headingIds: view.headingIds,
		headingLevelStart: props.headingLevelStart,
		listDepth: 0,
	}

	if (props.display === 'inline') {
		return (
			<MdInlineRoot>
				<Inlines
					nodes={view.inlineNodes}
					ctx={{
						...ctxBase,
						stream: view.fade ? { boundaries: view.boundaries, start: 0 } : undefined,
					}}
					segKey="i"
				/>
			</MdInlineRoot>
		)
	}

	<View
		id={props.id}
		testID={props.testID}
		accessibilityRole={props.accessibilityRole ?? 'document'}
		className={props.className}
		style={{
			width: '100%',
			maxWidth: '100%',
			minWidth: 0,
			overflowWrap: 'break-word',
			...(contentWidthValue != null
				? {
						'--vx-md-content-width':
							typeof contentWidthValue === 'number'
								? `${contentWidthValue}px`
								: contentWidthValue,
					}
				: {}),
			fontFamily: 'var(--font-family-body, inherit)',
			color: 'var(--color-text-primary, inherit)',
			lineHeight: 'var(--text-body-leading, 1.4286)',
			fontSize: 'var(--text-body-size, 14px)',
			...(props.style as object),
		}}
	>
		{view.nodes.map((node, i) => (
			<Blocks
				nodes={[node]}
				segKey={`b${i}`}
				ctx={{
					...ctxBase,
					stream: view.fade
						? { boundaries: view.boundaries, start: view.offsets[i] }
						: undefined,
				}}
				contentWidth={contentWidthValue}
				contentAlign={align}
				compact={compact}
				margin={seamStyle(view.nodes, i, compact)}
			/>
		))}
	</View>
}

/** Route screen for `.md` files — the codegen emits specs with this as
 *  `screen`, so a markdown file in the route dir is a route end-to-end. */
export function MarkdownScreen(props: MarkdownScreenProps): unknown @{
	<Screen className="vx-app">
		<ScrollableArea padding={4}>
			{props.data != null ? <Markdown data={props.data} /> : null}
		</ScrollableArea>
	</Screen>
}
