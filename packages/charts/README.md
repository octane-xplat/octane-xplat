# @octane-xplat/charts

Show a small dataset as a line, area, bar, pie, or scatter chart. The package
provides shared chart data and interaction props with web, iOS/Android, and
experimental macOS AppKit implementations.

## Show a bar chart

Start with a [configured Xplat app](https://octane-xplat.goddardai.org/toolchain#create-and-run),
then install from its directory:

```sh
bun add @octane-xplat/charts
```

Put this component in a `.tsx` or `.tsrx` screen. Each series has a name and
an array of `{ x, y }` values; bars use category names for `x`:

```tsx
import { Chart } from '@octane-xplat/charts'

export function PackingChart() {
	return (
		<Chart
			type="bar"
			width={320}
			height={220}
			accessibilityLabel="Packed items by bag: carry-on 4, day bag 2"
			data={[
				{
					name: 'Packed items',
					values: [
						{ x: 'Carry-on', y: 4 },
						{ x: 'Day bag', y: 2 },
					],
				},
			]}
		/>
	)
}
```

The screen should show two bars, with Carry-on twice the height of Day bag.
Keep a text summary available for readers who cannot use the chart. If the
chart is blank, check that its container has nonzero size and the dataset is
not empty.

## Choose the data shape

Bar and pie charts use category labels. Line, area, and scatter charts use
numbers or dates on the horizontal axis. Use the exported types to check data
before passing it to a chart:

```ts
import type { SeriesSpec } from '@octane-xplat/charts'

const progress: SeriesSpec[] = [
	{
		name: 'Items packed',
		values: [
			{ x: 1, y: 2 },
			{ x: 2, y: 5 },
			{ x: 3, y: 6 },
		],
	},
]
```

## Respond to pointing and tapping

Add `tooltip` or `crosshair` to show the value under the pointer, `onScrub` to
follow it, and `onPress` to react when someone picks a datum. On web and macOS
AppKit, hovering moves the cursor, dragging scrubs and clicking presses the
point under the pointer. On iOS and Android, touching and dragging scrubs and
tapping presses.

```tsx
import { useState } from 'octane'
import { Chart, type ChartHit } from '@octane-xplat/charts'

export function StepsChart() {
	const [picked, setPicked] = useState<ChartHit | null>(null)
	return (
		<Chart
			type="line"
			width={320}
			height={200}
			tooltip
			crosshair
			onPress={setPicked}
			accessibilityLabel={picked ? `Picked ${picked.y} steps` : 'Steps per day'}
			data={[{ name: 'Steps', values: [{ x: 1, y: 4200 }, { x: 2, y: 6100 }, { x: 3, y: 5300 }] }]}
		/>
	)
}
```

AppKit hover, drag and click coordinates come from source that has not yet
been checked on a running Mac.

The shared geometry uses D3 and SVG. This does not establish identical font
metrics, assistive-technology behavior, or OS input on every host. Check the
[target limits](https://octane-xplat.goddardai.org/known-limits) and run the
chart on the targets you ship. Exact options live in the
[public prop declarations](https://github.com/octane-xplat/octane-xplat/blob/main/packages/charts/src/props.ts).
