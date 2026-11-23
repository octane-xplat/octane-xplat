# Measure and lay out text with Pretext

> Add a text-layout tool to an existing Xplat app.

Install the adapter from your Xplat app directory:

```sh
bun add @octane-xplat/pretext
```

## Measure a paragraph

Follow the [text measurement example](../../examples/text/measure.ts) for the complete code.

`prepare()` measures text once for a font. `layout()` reuses those measurements to calculate the line count and height for a width and line height. Keep the font and line height in sync with the style you use to display the paragraph.

```ts
import { layout, prepare } from '@octane-xplat/pretext'

const prepared = prepare('A paragraph that wraps across lines.', '16px system-ui')
const result = layout(prepared, 220, 24)
console.log(`${result.lineCount} lines, ${result.height}px tall`)
```

The returned height is useful when a list needs each row's height before it appears on screen. Call `prepare()` again only when the text or font changes; when the available width changes, call `layout()` again with the same prepared value.

```ts
import { layout, prepare } from '@octane-xplat/pretext'

const message = 'A saved message can be measured at several widths.'
const paragraph = prepare(message, '16px system-ui')
const firstSize = layout(paragraph, 260, 24)
const narrowSize = layout(paragraph, 180, 24)
console.log(firstSize, narrowSize)
```

## Paint the lines Pretext chose

`prepareWithSegments()` and `layoutWithLines()` return the line text as well as the height. Use them when you want to draw each line yourself or need the chosen line breaks for a custom view.

```ts
import { layoutWithLines, prepareWithSegments } from '@octane-xplat/pretext'

const paragraph = prepareWithSegments('Draw each measured line yourself.', '16px system-ui')
const { lines } = layoutWithLines(paragraph, 220, 24)
console.log(lines.map((line) => line.text).join('\n'))
```

The `lines` array contains the text in display order. Draw each entry at the next line-height position when you need to preserve Pretext's exact breaks.

```ts
import { layoutWithLines, prepareWithSegments } from '@octane-xplat/pretext'

const prepared = prepareWithSegments('Draw each measured line yourself.', '16px system-ui')
const { lines } = layoutWithLines(prepared, 220, 24)
const drawText = (text: string, x: number, y: number) => console.log(text, x, y)
for (const [index, line] of lines.entries()) {
	drawText(line.text, 0, index * 24)
}
```

Replace `drawText` with the drawing call provided by your canvas or native view. If you instead put the original paragraph in a text view, that view may wrap it differently because each platform uses its own fonts and shaping engine.

## Lay out mixed text and inline objects

Use the `@octane-xplat/pretext/rich-inline` entry point when text uses different fonts or includes inline boxes such as images, mentions, or chips. Each text item carries a canvas font string; a box carries its measured width in pixels.

```ts
import {
	layoutNextRichInlineLineRange,
	materializeRichInlineLineRange,
	prepareRichInline,
} from '@octane-xplat/pretext/rich-inline'

const prepared = prepareRichInline([
	{ text: 'Hello ', font: '16px system-ui' },
	{ text: '@Maya', font: '700 14px system-ui', break: 'never' },
	{ width: 20 },
])
const range = layoutNextRichInlineLineRange(prepared, 220)
if (range) {
	console.log(materializeRichInlineLineRange(prepared, range).fragments)
}
```

## What the adapter measures

The package selects a measurement engine for each target: web uses Canvas, iOS uses UIKit, Android uses `Paint`, macOS uses AppKit, Linux uses GTK/Pango, and Windows uses a XAML `TextBlock`. Use the same call on each target; the installed platform leaf supplies its native widths.

```ts
import { prepare } from '@octane-xplat/pretext'

const prepared = prepare('Hello across platforms.', '500 16px system-ui')
```

## Font strings and language segmentation

The native font parser accepts absolute CSS font sizes in `px` or `pt`, common numeric or named weights, and the first family in the font stack. Resolve relative sizes such as `em` or `calc()` before calling Pretext. Android and Windows map weights to coarser native choices; platform font availability can also change the result.

```ts
import { prepare } from '@octane-xplat/pretext'

const body = prepare('Body text', '400 16px Inter')
const caption = prepare('Caption', 'italic 12pt "Avenir Next"')
```

Native targets install an `Intl.Segmenter` polyfill when the package is imported. Pretext uses it to choose word breaks in Thai, Lao, Khmer, Myanmar, and other Southeast Asian scripts written without spaces:

```ts
import { prepare } from '@octane-xplat/pretext'

const prepared = prepare('ภาษาไทยไม่มีช่องว่าง', '16px system-ui')
console.log(prepared)
```

See [Pretext's caveats](https://github.com/chenglou/pretext/blob/main/README.md#caveats) for language segmentation and browser-measurement details. macOS, Linux, and Windows hosts are experimental in Octane Xplat; the adapter includes target implementations, while each app still needs its normal host and runtime qualification.
