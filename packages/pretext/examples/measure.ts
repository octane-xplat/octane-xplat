import {
	layout,
	layoutWithLines,
	prepare,
	prepareWithSegments,
} from '../src/index.js'
import {
	layoutNextRichInlineLineRange,
	materializeRichInlineLineRange,
	prepareRichInline,
} from '../src/rich-inline.js'

const paragraph = 'Pretext measures a paragraph before the screen lays it out.'
const font = '16px system-ui'
const prepared = prepare(paragraph, font)
const summary = layout(prepared, 220, 24)
console.log(`${summary.lineCount} lines, ${summary.height}px tall`)

const measuredLines = layoutWithLines(prepareWithSegments(paragraph, font), 220, 24)
console.log(measuredLines.lines.map((line) => line.text).join('\n'))

const rich = prepareRichInline([
	{ text: 'Hello ', font },
	{ text: '@Maya', font: '700 14px system-ui', break: 'never' },
	{ width: 20 },
])
const range = layoutNextRichInlineLineRange(rich, 220)

if (range) {
	console.log(materializeRichInlineLineRange(rich, range).fragments)
}
