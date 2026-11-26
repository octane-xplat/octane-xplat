import { layoutWithLines, measureLineStats, prepareWithSegments } from '@octane-xplat/pretext'
import type { PreparedTextWithSegments } from '@octane-xplat/pretext'

interface PreparedParagraph {
  text: string
  separator: string
  segments: PreparedTextWithSegments
}

export function prepareBalancedText(text: string, font: string): PreparedParagraph[] {
  const parts = text.split(/(\r\n|[\n\r])/)
  const paragraphs: PreparedParagraph[] = []

  for (let index = 0; index < parts.length; index += 2) {
    const paragraph = parts[index]!
    paragraphs.push({
      text: paragraph,
      separator: parts[index + 1] ?? '',
      segments: prepareWithSegments(paragraph, font),
    })
  }

  return paragraphs
}

function lineWidthVariance(lines: readonly { width: number }[]): number {
  const average = lines.reduce((sum, line) => sum + line.width, 0) / lines.length
  return lines.reduce((sum, line) => sum + (line.width - average) ** 2, 0)
}

function balanceParagraph({ text, segments }: PreparedParagraph, width: number): string {
  const { lineCount } = measureLineStats(segments, width)
  if (lineCount < 2 || lineCount > 6) return text

  // Find the narrowest measure that retains the original line count.
  let lower = 0
  for (let index = 0; index < segments.widths.length; index++) {
    lower = Math.max(lower, segments.widths[index]!)
  }
  if (lower >= width) return text

  let upper = width
  while (upper - lower > 0.5) {
    const middle = (upper + lower) / 2
    if (measureLineStats(segments, middle).lineCount === lineCount) {
      upper = middle
    } else {
      lower = middle
    }
  }

  const original = layoutWithLines(segments, width, 1).lines
  const balanced = layoutWithLines(segments, upper, 1).lines
  if (balanced.some((line) => line.end.graphemeIndex !== 0)) return text
  if (lineWidthVariance(balanced) >= lineWidthVariance(original)) return text

  return balanced.map((line) => line.text.replace(/ +$/, '')).join('\n')
}

export function wrapBalancedText(paragraphs: readonly PreparedParagraph[], width: number): string {
  return paragraphs
    .map(
      (paragraph) =>
        (Number.isFinite(width) && width > 0
          ? balanceParagraph(paragraph, width)
          : paragraph.text) + paragraph.separator,
    )
    .join('')
}
