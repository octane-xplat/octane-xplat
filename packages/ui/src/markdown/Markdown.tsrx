/** @jsxImportSource @octane-xplat/jsx */
import { useMemo, useRef } from 'octane'
import { Screen } from '../components/layout/Screen.tsrx'
import { ScrollableArea } from '../components/layout/ScrollableArea.tsrx'
import { Text } from '../components/content/Text.tsrx'
import { Heading } from '../components/content/Heading.tsrx'
import { View } from '../components/layout/View.tsrx'
import { Blockquote } from '../components/content/Blockquote.tsrx'
import { Image } from '../components/media/Image.tsrx'
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
import { mdInlineLen, mdInlineText, mdDoc } from './markdown-ast'
import { parseMdInline, parseMdNodes } from './markdown-parse'
import {
  applyMarkdownTransforms,
  getMarkdownExtensionRenderer,
  markdownExtensionText,
  prepareMarkdownPlugins,
  reportMarkdownPluginFailure,
  type MdPluginEntry,
  type PreparedMarkdownPlugins,
} from './markdown-plugins'

import { getMarkdownFenceProposal, projectMarkdownHeadingLinks } from './markdown-plugin-helpers'
import { MdSourceLines } from './markdown-source-lines.tsrx'
import {
  mdBodyFontFamily,
  mdBodyFontSize,
  mdBodyLineHeight,
  mdBorderColor,
  mdImageRadius,
  mdTextPrimary,
} from './markdown-tokens'
import { useClipboard } from '../internal/platform/use-clipboard.tsrx'
import { useContainerReveal } from '../components/layout/use-container-reveal.tsrx'
import { Button } from '../components/actions/Button.tsrx'
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
  MdCodeRun,
  MdCitation,
  MdDelete,
  MdEmphasis,
  MdFadeRun,
  MdInlineImage,
  MdInlineRoot,
  MdLinkRun,
  MdParagraph,
  MdStrong,
  MdTextRun,
} from './markdown-inline.tsrx'

import { parseCssDuration, useStreamingText } from '../components/content/use-streaming-text.tsrx'
import { useTheme } from '../theme/use-theme.tsrx'

import type {
  MarkdownInlinePlugin,
  MarkdownProps,
  MarkdownScreenProps,
  MarkdownComponents,
  MdExtension,
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
  if (i === 0) {
    return undefined
  }

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
  if (value === 'diff') {
    return { language: 'plaintext', isDiff: true }
  }

  const layered = /^diff-(.+)$/.exec(value)
  if (layered) {
    return { language: layered[1], isDiff: true }
  }

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
  if (header == null) {
    return []
  }

  return header.children.map((cell, colIdx) => {
    const headerLen = mdInlineLen(cell.children)
    let maxLen = headerLen
    for (const row of rows) {
      const rowCell = row.children[colIdx]
      if (rowCell != null) {
        const len = mdInlineLen(rowCell.children)
        if (len > maxLen) {
          maxLen = len
        }
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
  if (!segs) {
    return <MdTextRun text={props.text} />
  }

  // Native FormattedString runs are flat siblings — a Span cannot host
  // children, so the segments emit text-carrying runs directly.
  return segs.map((seg) =>
    seg.fading ? (
      <MdFadeRun key={seg.key} runColor={props.stream.runColor}>
        {seg.text}
      </MdFadeRun>
    ) : (
      <MdTextRun key={seg.key} text={seg.text} />
    ),
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
  plugins?: PreparedMarkdownPlugins
  headingIds?: ReadonlyMap<MdNode, string>
  headingLabels?: ReadonlyMap<MdNode, string>
  permalinkUrls?: ReadonlyMap<MdNode, string>
  headingLevelStart?: 1 | 2 | 3 | 4 | 5 | 6
  listDepth: number
}

/** The 1-based inclusive source lines a block carries while the
 *  `markdownSourceLinesPlugin` is installed; `undefined` otherwise. */
function blockSourceLines(
  ctx: RenderCtx,
  node: MdNode,
): { readonly start: number; readonly end: number } | undefined {
  if (ctx.plugins?.sourceLines !== true) {
    return undefined
  }

  const start = node.position?.start.line
  const end = node.position?.end.line
  return start != null && end != null ? { start, end } : undefined
}

// ---------------------------------------------------------------------------
// Plugin node rendering (extension protocol boundary semantics)
// ---------------------------------------------------------------------------

/**
 * Per-extension-node failure boundary — the reference's
 * `MarkdownErrorBoundary`/`MarkdownNodePendingBoundary` pair. A renderer that
 * throws lands in `@catch`; one that suspends (`use(promise)`) sits in
 * `@pending` until it settles; both show the caller's readable fallback.
 */
function MdPluginBoundary(props: { fallback: unknown; children?: unknown }): unknown @{
  @try {
    <>{props.children}</>
  } @pending {
    <>{props.fallback}</>
  } @catch (error) {
    <>{props.fallback}</>
  }
}

/** Numeric identities for the boundary reset keys — the reference retries a
 *  failed boundary when the node or its renderer changes
 *  (`resetKey`/`resetRenderer`), which a keyed remount expresses here. */
const pluginBoundaryIds = new WeakMap<object, number>()
let nextPluginBoundaryId = 0
function pluginBoundaryId(value: object): number {
  let id = pluginBoundaryIds.get(value)
  if (id == null) {
    id = ++nextPluginBoundaryId
    pluginBoundaryIds.set(value, id)
  }

  return id
}

/**
 * Render an extension node through its plugin renderer — synchronous throws
 * and missing renderers take the fallback immediately; everything else is
 * wrapped in the node boundary so a throw or pending promise inside the
 * rendered subtree also resolves to the fallback. The boundary is keyed on
 * the node and renderer identities, so a new node or a changed renderer
 * retries after a failure instead of sticking on the fallback.
 */
function renderMdPluginNode(
  prepared: PreparedMarkdownPlugins | undefined,
  node: MdExtension,
  fallback: unknown,
): unknown {
  const renderer = getMarkdownExtensionRenderer(prepared, node)
  if (renderer == null) {
    return fallback
  }

  let rendered: unknown
  try {
    rendered = renderer.render({ node })
  } catch (error) {
    reportMarkdownPluginFailure(node.plugin, 'render', error)
    return fallback
  }

  return (
    <MdPluginBoundary
      key={`${pluginBoundaryId(node)}-${pluginBoundaryId(renderer.render)}`}
      fallback={fallback}
    >
      {rendered}
    </MdPluginBoundary>
  )
}

/** The copy-link feedback window — the reference's COPY_FEEDBACK_MS. */
const COPY_FEEDBACK_MS = 1500

/**
 * Heading-permalink copy button — `createMarkdownHeadingLinks`'s rendered
 * half (the reference's HeadingLinksRenderer). The heading stays an incoming
 * fragment target; the ghost `#` copies the canonical permalink URL and
 * flips to a check with a live announcement for the feedback window. The
 * control reveals on container hover/focus (staying mounted and tabbable)
 * while a hidden `#` probe reserves its slot, so the heading's layout never
 * shifts — the reference's `isLayoutPreserved` reveal.
 */
function MdHeadingPermalink(props: {
  url: string
  label: string
  children?: unknown
}): unknown @{
  const t = useTranslator()
  const copiedLabel = t('@astryx.markdownHeadingLinks.copied')
  const copyLabel = t('@astryx.markdownHeadingLinks.copy').replace('{heading}', props.label)
  const { copy, isCopied } = useClipboard({
    announce: copiedLabel,
    resetAfterMs: COPY_FEEDBACK_MS,
  })

  const { getContainerProps, getContentRevealProps } = useContainerReveal()
  return (
    <View
      className="vx-md-heading-links"
      {...getContainerProps()}
      style={{ flexDirection: 'row', alignItems: 'baseline', minWidth: 0, maxWidth: '100%' }}
    >
      {props.children}
      <View
        className="vx-md-heading-permalink-slot"
        style={{ position: 'relative', flexShrink: 0, marginInlineStart: 6 }}
      >
        <Text accessible={false} style={{ visibility: 'hidden' }}>
          #
        </Text>
        <Button
          variant="ghost"
          size="sm"
          isIconOnly
          label={isCopied ? copiedLabel : copyLabel}
          clickAction={() => {
            void copy(props.url)
          }}
          {...getContentRevealProps()}
          style={{ position: 'absolute', insetBlockStart: '50%', transform: 'translateY(-50%)' }}
        >
          {isCopied ? '✓' : '#'}
        </Button>
      </View>
    </View>
  )
}

/** Syntax entries must keep their identity across chunk updates when the
 *  plugin list's syntax identity is unchanged — otherwise every memo
 *  downstream of parse options re-parses a document the caller did not
 *  change. Mirrors the reference's useStableMarkdownSyntaxEntries. */
function useStableMdSyntaxEntries(
  prepared: PreparedMarkdownPlugins | undefined,
): PreparedMarkdownPlugins | undefined {
  const prevRef = useRef<PreparedMarkdownPlugins | undefined>(undefined)
  if (
    prepared !== prevRef.current &&
    (prepared == null ||
      prevRef.current == null ||
      prepared.syntaxIdentity !== prevRef.current.syntaxIdentity)
  ) {
    prevRef.current = prepared
  }

  return prevRef.current
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
        if (result === false) {
          continue
        }

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

  if (resolved.length === 0) {
    return [{ type: 'text', content: text }]
  }

  const segments: InlineSegment[] = []
  let cursor = 0
  for (let i = 0; i < resolved.length; i++) {
    const m = resolved[i]
    if (m.start > cursor) {
      segments.push({ type: 'text', content: text.slice(cursor, m.start) })
    }

    segments.push({
      type: 'plugin',
      element: m.plugin.render(m.match, `plugin-${i}`),
      matchLength: m.end - m.start,
    })

    cursor = m.end
  }

  if (cursor < text.length) {
    segments.push({ type: 'text', content: text.slice(cursor) })
  }

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
                    <SegmentedText
                      text={seg.content}
                      pos={segPos}
                      stream={streamOf(segPos)!}
                      segKey={key}
                    />
                  ) : (
                    <MdTextRun text={seg.content} />
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
            <MdTextRun text={n.value} />
          ),
        )

        pos += n.value.length
        break
      }
      case 'strong':
        out.push(
          <MdStrong>
            <Inlines
              nodes={n.children}
              ctx={{ ...props.ctx, stream: streamOf(at) }}
              segKey={key}
            />
          </MdStrong>,
        )

        pos += mdInlineLen(n.children)
        break
      case 'emphasis':
        out.push(
          <MdEmphasis>
            <Inlines
              nodes={n.children}
              ctx={{ ...props.ctx, stream: streamOf(at) }}
              segKey={key}
            />
          </MdEmphasis>,
        )

        pos += mdInlineLen(n.children)
        break
      case 'delete':
        out.push(
          <MdDelete>
            <Inlines
              nodes={n.children}
              ctx={{ ...props.ctx, stream: streamOf(at) }}
              segKey={key}
            />
          </MdDelete>,
        )

        pos += mdInlineLen(n.children)
        break
      case 'inlineCode': {
        const Comp = props.ctx.components?.inlineCode as any
        out.push(Comp ? <Comp>{n.value}</Comp> : <MdCodeRun>{n.value}</MdCodeRun>)
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
              <MdTextRun text={`$${n.value}$`} />
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
          <Inlines
            nodes={n.children}
            ctx={{ ...props.ctx, stream: streamOf(at, '--color-text-accent') }}
            segKey={key}
          />
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
            <MdTextRun text={`[${n.alt}]`} />
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
          out.push(<MdTextRun text={`[${n.sourceId}]`} />)
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
      case 'extension': {
        const fallbackText = n.source ?? markdownExtensionText(props.ctx.plugins, n)
        const fallback = props.ctx.stream ? (
          <SegmentedText text={fallbackText} pos={at} stream={streamOf(at)!} segKey={key} />
        ) : (
          <MdTextRun text={fallbackText} />
        )

        out.push(renderMdPluginNode(props.ctx.plugins, n, fallback))
        pos += fallbackText.length
        break
      }
      default:
        out.push(
          props.ctx.stream ? (
            <SegmentedText
              text={(n as any).value ?? ''}
              pos={at}
              stream={streamOf(at)!}
              segKey={key}
            />
          ) : (
            <MdTextRun text={(n as any).value ?? ''} />
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
            <MdCodeRun style={{ wordBreak: 'normal' }}>{p.children}</MdCodeRun>
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
    <Table
      dividers="grid"
      textOverflow="wrap"
      style={{ borderWidth: 1, borderColor: mdBorderColor(), borderStyle: 'solid' }}
    >
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
              <Text style={cellAlign(i) != null ? ({ textAlign: cellAlign(i) } as never) : undefined}>
                <formattedstring>
                  <Inlines nodes={h.children} ctx={cellCtx} segKey={`th${i}`} />
                </formattedstring>
              </Text>
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
                <Text
                  style={
                    cellAlign(j) != null ? ({ textAlign: cellAlign(j) } as never) : undefined
                  }
                >
                  <formattedstring>
                    <Inlines nodes={cell.children} ctx={cellCtx} segKey={`tr${i}c${j}`} />
                  </formattedstring>
                </Text>
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
  const isTaskList = node.children.length > 0 && node.children.every((item) => item.checked != null)

  const t = useTranslator()
  const itemContent = (item: MdList['children'][number], j: number) => {
    const first = item.children[0]
    const isInline = item.children.length === 1 && first?.type === 'paragraph'
    return isInline ? (
      // Runs need a text host on native — bare spans inside a view fold to
      // text-only children, which AppKit's spike rejects outright.
      <Text>
        <formattedstring>
          <Inlines nodes={first.children} ctx={props.ctx} segKey={`${props.segKey}.${j}`} />
        </formattedstring>
      </Text>
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
    <MdRowList
      ordered={node.ordered}
      start={node.start}
      style={{ marginLeft: -8, marginRight: -8 }}
    >
      {node.children.map((item, j) => {
        // A task item beside plain items keeps its own checked state: it
        // shows a read-only checkbox where its marker would be, named by
        // its text (FR23).
        const task =
          item.checked == null ? undefined : { isChecked: item.checked, label: itemText(item) }

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
    const margin =
      props.margin !== undefined ? props.margin : seamStyle(props.nodes, i, props.compact)

    const sl = blockSourceLines(props.ctx, node)
    switch (node.type) {
      case 'heading': {
        const level = Math.min(6, node.depth + (props.ctx.headingLevelStart ?? 1) - 1) as
          | 1
          | 2
          | 3
          | 4
          | 5
          | 6

        const kids = (
          <formattedstring>
            <Inlines nodes={node.children} ctx={props.ctx} segKey={segKey} />
          </formattedstring>
        )
        const headingId = props.ctx.headingIds?.get(node)
        const permalinkUrl = props.ctx.permalinkUrls?.get(node)
        const Comp = props.ctx.components?.heading as any
        const rendered = Comp ? (
          <Comp level={level} id={headingId} sourceLines={sl}>
            {kids}
          </Comp>
        ) : (
          <Heading level={level} id={headingId} style={{ ...margin, ...proseStyle() } as never}>
            {kids}
          </Heading>
        )

        blocks.push(
          <MdSourceLines lines={sl}>
            {permalinkUrl != null ? (
              <MdHeadingPermalink
                url={permalinkUrl}
                label={props.ctx.headingLabels?.get(node) ?? headingId ?? ''}
              >
                {rendered}
              </MdHeadingPermalink>
            ) : (
              rendered
            )}
          </MdSourceLines>,
        )

        break
      }
      case 'paragraph': {
        const kids = <Inlines nodes={node.children} ctx={props.ctx} segKey={segKey} />
        const Comp = props.ctx.components?.paragraph as any
        blocks.push(
          <MdSourceLines lines={sl}>
            {Comp ? (
              <Comp sourceLines={sl}>{kids}</Comp>
            ) : (
              <MdParagraph style={{ ...margin, ...proseStyle() } as never}>{kids}</MdParagraph>
            )}
          </MdSourceLines>,
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
        const fallback = Comp ? (
          <Comp code={node.value} language={legacyLanguage} sourceLines={sl} />
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
        )

        // A semantic-fence transform proposes an extension node in place of
        // this code block; its renderer may decline (null/boolean →
        // fallback), throw, or suspend — all land on the same fallback.
        const proposal = getMarkdownFenceProposal(node)
        if (proposal != null) {
          const renderer = getMarkdownExtensionRenderer(props.ctx.plugins, proposal.node)
          if (renderer != null) {
            let rendered: unknown
            let failed = false
            try {
              rendered = renderer.render({ node: proposal.node })
            } catch (error) {
              reportMarkdownPluginFailure(proposal.node.plugin, 'render', error)
              failed = true
            }

            blocks.push(
              <MdSourceLines lines={sl}>
                {failed || rendered == null || typeof rendered === 'boolean' ? (
                  fallback
                ) : (
                  <MdPluginBoundary
                    key={`fence-${pluginBoundaryId(proposal.node)}-${pluginBoundaryId(renderer.render)}`}
                    fallback={fallback}
                  >
                    {rendered}
                  </MdPluginBoundary>
                )}
              </MdSourceLines>,
            )

            break
          }
        }

        blocks.push(<MdSourceLines lines={sl}>{fallback}</MdSourceLines>)
        break
      }
      case 'math': {
        const Comp = props.ctx.components?.math as any
        blocks.push(
          <MdSourceLines lines={sl}>
            {Comp ? (
              <Comp value={node.value} display="block" sourceLines={sl} />
            ) : (
              <MdParagraph style={margin as never}>
                <MdTextRun text={`$$${node.value}$$`} />
              </MdParagraph>
            )}
          </MdSourceLines>,
        )

        break
      }
      case 'table':
        blocks.push(
          <MdSourceLines lines={sl}>
            <View style={{ ...margin, ...blockAlignStyle(), maxWidth: '100%' } as never}>
              <MarkdownTable node={node} ctx={props.ctx} />
            </View>
          </MdSourceLines>,
        )

        break
      case 'list':
        blocks.push(
          <MdSourceLines lines={sl}>
            <View style={{ ...margin, ...proseStyle() } as never}>
              <ListItems
                node={node}
                segKey={segKey}
                ctx={props.ctx}
                contentWidth={props.contentWidth}
                contentAlign={props.contentAlign}
                compact={props.compact}
              />
            </View>
          </MdSourceLines>,
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
          <MdSourceLines lines={sl}>
            {Comp ? (
              <Comp sourceLines={sl}>{kids}</Comp>
            ) : (
              <Blockquote style={{ ...margin, ...proseStyle() } as never}>{kids}</Blockquote>
            )}
          </MdSourceLines>,
        )

        break
      }
      case 'thematicBreak': {
        const Comp = props.ctx.components?.hr as any
        blocks.push(
          <MdSourceLines lines={sl}>
            {Comp ? (
              <Comp sourceLines={sl} />
            ) : (
              <View
                style={
                  {
                    ...margin,
                    height: 1,
                    borderTopWidth: 1,
                    borderTopColor: mdBorderColor(),
                  } as never
                }
              />
            )}
          </MdSourceLines>,
        )

        break
      }
      case 'image': {
        const safe = sanitizeUrl(node.url)
        const Comp = props.ctx.components?.image as any
        blocks.push(
          <MdSourceLines lines={sl}>
            {safe == null ? (
              <MdParagraph style={margin as never}>
                <MdTextRun text={`[${node.alt}]`} />
              </MdParagraph>
            ) : Comp ? (
              <Comp src={safe} alt={node.alt} sourceLines={sl} />
            ) : (
              <View style={margin as never}>
                <Image
                  src={safe}
                  alt={node.alt}
                  style={{ maxWidth: '100%', borderRadius: mdImageRadius() }}
                />
              </View>
            )}
          </MdSourceLines>,
        )

        break
      }
      case 'extension': {
        // The reference wraps every block extension in its own div with
        // paragraph spacing and prose width/align; the readable fallback
        // is the node's source (or its plugin's text projection).
        const fallback = node.source ?? markdownExtensionText(props.ctx.plugins, node)
        blocks.push(
          <MdSourceLines lines={sl}>
            <View style={{ ...margin, ...proseStyle() } as never}>
              {renderMdPluginNode(props.ctx.plugins, node, fallback)}
            </View>
          </MdSourceLines>,
        )

        break
      }
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

  // Ordered plugin list — prepared once per list instance (WeakMap-cached by
  // the protocol); a malformed entry reports once and degrades to no plugins.
  const preparedPlugins = useMemo(() => {
    if (props.plugins == null || props.plugins.length === 0) {
      return undefined
    }

    try {
      return prepareMarkdownPlugins(props.plugins)
    } catch (error) {
      reportMarkdownPluginFailure('plugin-list', 'transform', error)
      return undefined
    }
  }, [props.plugins])

  const syntaxPlugins = useStableMdSyntaxEntries(preparedPlugins)

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
    // Syntax-only entries drive the parse so plugin transforms never run
    // twice; the full prepared list applies them below with the right
    // finality, matching the reference's split.
    const options = {
      sourceIds,
      autolink: props.autolink,
      math: hasMathRenderer,
      plugins: syntaxPlugins?.syntaxEntries,
    }

    const extensionText = (n: MdExtension) => markdownExtensionText(preparedPlugins, n)

    let nodes: MdNode[]
    let inlineNodes: MdInline[]
    const inline = props.display === 'inline'
    if (props.data) {
      // A baked document is already transformed; entries only supply the
      // renderers its extension nodes resolve against.
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
      const parsed = parseMdInline(input, options)
      const transformed = applyMarkdownTransforms(
        mdDoc([{ type: 'paragraph', children: parsed }]),
        preparedPlugins,
        input,
        !streaming,
        'inline',
      )

      const paragraph = transformed.children[0]
      inlineNodes = paragraph?.type === 'paragraph' ? [...paragraph.children] : parsed
      nodes = []
    } else if (streaming) {
      incRef.current ??= createMarkdownIncrementalState()
      const input = trimStreamingArtifacts(smoothedText, options)
      nodes = applyMarkdownTransforms(
        parseMarkdownIncremental(input, incRef.current, options),
        preparedPlugins,
        input,
        false,
        'block',
      ).children as MdNode[]

      inlineNodes = []
    } else {
      incRef.current = undefined
      nodes = applyMarkdownTransforms(
        mdDoc(parseMdNodes(smoothedText, options)),
        preparedPlugins,
        smoothedText,
        true,
        'block',
      ).children as MdNode[]

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
      const node = nodes[i]
      acc += node.type === 'extension' ? extensionText(node).length : markdownTextLength([node])
    }

    prevLenRef.current = inline ? mdInlineLen(inlineNodes, extensionText) : acc

    // The heading-links module owns all-depth heading identity once
    // installed; otherwise the root-only outline projection allocates ids.
    const headingLinks = inline
      ? undefined
      : projectMarkdownHeadingLinks(mdDoc(nodes), preparedPlugins)

    const headingIds = inline ? undefined : (headingLinks?.ids ?? projectMdHeadings(nodes).ids)
    return {
      nodes,
      inlineNodes,
      boundaries,
      offsets,
      fade: streaming,
      headingIds,
      headingLabels: headingLinks?.labels,
      permalinkUrls: headingLinks?.permalinkUrls,
    }
  }, [
    props.data,
    smoothedText,
    streaming,
    props.sources,
    props.display,
    props.autolink,
    hasMathRenderer,
    maxSpans,
    preparedPlugins,
    syntaxPlugins,
  ])

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
    plugins: preparedPlugins,
    headingIds: view.headingIds,
    headingLabels: view.headingLabels,
    permalinkUrls: view.permalinkUrls,
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
              typeof contentWidthValue === 'number' ? `${contentWidthValue}px` : contentWidthValue,
          }
        : {}),
      fontFamily: mdBodyFontFamily(),
      color: mdTextPrimary(),
      lineHeight: mdBodyLineHeight(),
      fontSize: mdBodyFontSize(),
      ...(props.style as object),
    }}
  >
    {view.nodes.map((node, i) => (
      <Blocks
        nodes={[node]}
        segKey={`b${i}`}
        ctx={{
          ...ctxBase,
          stream: view.fade ? { boundaries: view.boundaries, start: view.offsets[i] } : undefined,
        }}
        contentWidth={contentWidthValue}
        contentAlign={align}
        compact={compact}
        margin={seamStyle(view.nodes, i, compact)}
      />
    ))}
  </View>
}

/**
 * Renders exactly one Markdown extension node the way `Markdown` renders it
 * inline — the reference's `MarkdownPluginNodeRenderer`: the plugin's own
 * renderer inside the same failure boundary, or the node's `toText`/`source`
 * projection when no renderer is available. No wrapper element is added.
 */
export function MarkdownPluginNodeRenderer(props: {
  plugins: readonly MdPluginEntry[]
  node: MdExtension
}): unknown @{
  const prepared = useMemo(() => {
    try {
      return prepareMarkdownPlugins(props.plugins)
    } catch (error) {
      reportMarkdownPluginFailure('plugin-list', 'transform', error)
      return undefined
    }
  }, [props.plugins])

  const fallback = <>{props.node.source ?? markdownExtensionText(prepared, props.node)}</>
  return <>{renderMdPluginNode(prepared, props.node, fallback)}</>
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
