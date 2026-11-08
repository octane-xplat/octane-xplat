/** Unified-diff line classification for `CodeBlock isDiff`, ported from
 *  @astryxdesign/core 0.7.4 `CodeBlock/tokenizer.ts` (Meta Platforms, MIT).
 *  Behavior must match the reference exactly: glyph column split, hunk/file
 *  header detection, and the `--- `/`+++ ` look-ahead. */

export type DiffLineKind = 'added' | 'removed' | 'header' | 'context'

/**
 * Split a diff into the glyph column and the code the base language sees:
 * every added, removed, or space-led context line loses its first character
 * (the `+`, `-`, or space); a context line with no leading space keeps all
 * of it; header lines contribute an empty line so offsets stay per line.
 */
export function splitDiffLines(lines: readonly string[]): {
  kinds: DiffLineKind[]
  glyphs: string[]
  content: string[]
} {
  const kinds: DiffLineKind[] = []
  const glyphs: string[] = []
  const content: string[] = []
  const fileHeaders = fileHeaderLines(lines)

  lines.forEach((line, index) => {
    const kind = diffLineKind(line, { isFileHeader: fileHeaders.has(index) })

    kinds.push(kind)
    if (kind === 'header') {
      glyphs.push('')
      content.push('')
    } else if (kind === 'context' && !line.startsWith(' ')) {
      // A context line without its leading space (an unindented diff, or
      // an empty line) has no glyph: the marker column is empty and the
      // whole line is code.
      glyphs.push('')
      content.push(line)
    } else {
      glyphs.push(line.slice(0, 1))
      content.push(line.slice(1))
    }
  })

  return { kinds, glyphs, content }
}

/**
 * Classify one line of a unified diff by its first character: `+` added,
 * `-` removed, `@@` header, anything else context. A `--- ` line (with its
 * space) directly followed by a `+++ ` line and then an `@@` line is a file
 * header (both lines), wherever it occurs; every other `---`/`+++` line is
 * removed or added, so a removed line that starts with `--` — `---i;`
 * included — is never misread. The glyph is part of the text and is never
 * removed.
 */
export function diffLineKind(
  line: string,
  { isFileHeader = false }: { isFileHeader?: boolean } = {},
): DiffLineKind {
  if (line.startsWith('@@') || isFileHeader) {
    return 'header'
  }

  if (line.startsWith('+')) {
    return 'added'
  }

  if (line.startsWith('-')) {
    return 'removed'
  }

  return 'context'
}

/**
 * The indexes of the `--- `/`+++ ` lines (unified-diff form, with the space)
 * that form a file header directly before an `@@`; `---i;` is a change.
 */
export function fileHeaderLines(lines: readonly string[]): Set<number> {
  const headers = new Set<number>()

  for (let i = 0; i + 2 < lines.length; i++) {
    if (
      lines[i].startsWith('--- ') &&
      lines[i + 1].startsWith('+++ ') &&
      lines[i + 2].startsWith('@@')
    ) {
      headers.add(i)
      headers.add(i + 1)
    }
  }

  return headers
}
