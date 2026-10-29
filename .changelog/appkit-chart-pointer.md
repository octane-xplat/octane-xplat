### Hover, drag and click native macOS charts

On experimental AppKit, an interactive `Chart` now follows the pointer like it
does on web. Hovering moves the tooltip and crosshair, dragging calls
`onScrub`, and clicking calls `onPress` with the point under the pointer
instead of the chart's center. Real pointer behavior has not yet been checked
on a running Mac.

```tsx
import { Chart } from '@octane-xplat/charts'

export function StepsChart() {
	return <Chart type="line" width={320} height={200} tooltip crosshair accessibilityLabel="Steps per day"
		data={[{ name: 'Steps', values: [{ x: 1, y: 4200 }, { x: 2, y: 6100 }] }]} />
}
```

See [respond to pointing and tapping](https://github.com/octane-xplat/octane-xplat/blob/main/packages/charts/README.md#respond-to-pointing-and-tapping).
