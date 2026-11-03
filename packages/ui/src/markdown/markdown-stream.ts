// Streaming Markdown parsing and fade-in segmentation for growing text —
// the `text` prop grows in chunks (chat/AI output), often ending
// mid-construct.
//
// The incremental machinery lives in markdown-parse.ts, ported from Meta
// Platforms' Astryx Markdown (MIT, v0.7.4): settled-prefix boundary scan,
// incomplete-construct trims, loose-list seam merge, and option/link-
// definition invalidation. This module adds the doc-level stream wrapper
// and the fade boundary/segment helpers, also ported from Astryx
// (streaming.ts) and kept DOM-free.

import {
  parseMarkdownIncremental,
  parseMdDoc,
  createMarkdownIncrementalState,
  trimStreamingArtifacts,
  type MarkdownIncrementalState,
} from './markdown-parse.ts'

import { mdDoc, mdInlineLen } from './markdown-ast.ts'
import type { MdDoc, MdNode, MdParseOptions } from './markdown-ast.ts'

export { createMarkdownIncrementalState, parseMarkdownIncremental, trimStreamingArtifacts }
export type { MarkdownIncrementalState }
export { getIncrementalParseWork } from './markdown-parse.ts'
export type { IncrementalWork } from './markdown-parse.ts'

// ---------------------------------------------------------------------------
// Fade-in segmentation — boundary tracking over rendered text length
// ---------------------------------------------------------------------------

/** One piece of a text run split at stream boundaries. `key` is stable for
 *  the segment's lifetime so the fade span mounts once; `fading` marks
 *  segments that arrived after the oldest tracked boundary. */
export interface MdTextSegment {
  key: string
  text: string
  fading: boolean
}

/**
 * Push the previous rendered length onto the boundary ring when output grew.
 * The ring caps at `maxSpans`; evicted boundaries merge into settled text.
 */
export function computeBoundaries(
  prevBoundaries: number[],
  prevRenderedLen: number,
  maxSpans: number,
): number[] {
  if (prevBoundaries.length === 0 || prevRenderedLen > prevBoundaries[prevBoundaries.length - 1]) {
    const next = [...prevBoundaries, prevRenderedLen]
    while (next.length > maxSpans) {
      next.shift()
    }

    return next
  }

  return prevBoundaries
}

/**
 * Split one text run at the stream boundaries it crosses. Returns null when
 * the whole run is settled (no splitting needed). Segment keys never change
 * once created — `settled-{nodeKey}` for pre-boundary text and
 * `fade-{nodeKey}-b{offset}` per boundary span — so a fading span stays
 * mounted until it merges into the settled segment.
 */
export function computeSegments(
  content: string,
  startOffset: number,
  boundaries: number[],
  nodeKey: string | number,
): MdTextSegment[] | null {
  const endOffset = startOffset + content.length
  if (boundaries.length === 0 || endOffset <= boundaries[0]) {
    return null
  }

  const segments: MdTextSegment[] = []
  let pos = startOffset

  if (pos < boundaries[0]) {
    segments.push({
      key: `settled-${nodeKey}`,
      text: content.slice(0, boundaries[0] - startOffset),
      fading: false,
    })

    pos = boundaries[0]
  }

  for (let i = 0; i < boundaries.length; i++) {
    const bStart = boundaries[i]
    const bEnd = i + 1 < boundaries.length ? boundaries[i + 1] : endOffset
    if (bStart >= endOffset || bEnd <= pos) {
      continue
    }

    const lo = Math.max(bStart, pos)
    const hi = Math.min(bEnd, endOffset)
    if (lo >= hi) {
      continue
    }

    segments.push({
      key: `fade-${nodeKey}-b${bStart}`,
      text: content.slice(lo - startOffset, hi - startOffset),
      fading: true,
    })

    pos = hi
  }

  return segments.length > 0 ? segments : null
}

/** Total rendered text length of a node list — the cursor metric fade
 *  boundaries are computed against. */
export function markdownTextLength(nodes: readonly MdNode[]): number {
  let n = 0
  for (const node of nodes) {
    switch (node.type) {
      case 'heading':
      case 'paragraph':
        n += mdInlineLen(node.children)
        break
      case 'table':
        for (const row of node.children) {
          for (const cell of row.children) {
            n += mdInlineLen(cell.children)
          }
        }

        break
      case 'code':
      case 'math':
        n += node.value.length
        break
      case 'blockquote':
        n += markdownTextLength(node.children)
        break
      case 'list':
        for (const item of node.children) {
          n += markdownTextLength(item.children)
        }

        break
      case 'image':
        n += node.alt.length
        break
      case 'extension':
        n += (node.source ?? '').length
        break
      default:
        break
    }
  }

  return n
}

/** One logical Markdown stream. Results are MdDoc v2 snapshots; treat shared
 * nodes as immutable. append() takes only the new chunk, never cumulative text. */
export interface MarkdownStreamParser {
  /** Feeds the next source chunk and returns the current document snapshot. */
  append(chunk: string): MdDoc
  /** Clear all source and cached blocks; return an empty document. */
  reset(): MdDoc
  /** Parse the complete source literally, including unfinished markup.
   * Idempotent; append after finish throws until reset is called. */
  finish(): MdDoc
}

/** Create an independent stream with private incremental parsing state. */
export function createMarkdownStreamParser(options?: MdParseOptions): MarkdownStreamParser {
  let state = createMarkdownIncrementalState()
  let source = ''
  let finished = false
  let document: MdDoc = mdDoc([])
  return {
    append(chunk) {
      if (finished) {
        throw new Error('Markdown stream is finished; call reset() before append().')
      }

      if (chunk === '') {
        return document
      }

      source += chunk
      // Incomplete trailing constructs are withheld before the incremental
      // parse so intermediate snapshots show no raw markup.
      const trimmed = trimStreamingArtifacts(source, { math: options?.math === true })
      document = parseMarkdownIncremental(trimmed, state, options)

      return document
    },
    reset() {
      state = createMarkdownIncrementalState()
      source = ''
      finished = false
      document = mdDoc([])
      return document
    },
    finish() {
      if (!finished) {
        document = parseMdDoc(source, options)
        finished = true
      }

      return document
    },
  }
}
