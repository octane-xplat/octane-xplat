# @octane-xplat/smooth-corners

Clip a panel and its contents to a smooth corner curve. Use this when ordinary
rounded corners do not give the shape you want. Implementations exist for web,
iOS, Android, and experimental macOS AppKit.

## Shape a panel

In a [configured Xplat app](https://octane-xplat.goddardai.org/toolchain#create-and-run),
install the package:

```sh
bun add @octane-xplat/smooth-corners
```

Put the component in a `.tsx` or `.tsrx` screen. The `corners` prop owns the
shape; CSS `border-radius` on this component is ignored:

```tsx
import { SmoothCorners } from '@octane-xplat/smooth-corners'
import { Text } from '@octane-xplat/ui'

export function TripCard() {
	return (
		<SmoothCorners className="trip-card" corners={{ radius: 24, curve: 'continuous' }}>
			<Text>Weekend in Kyoto</Text>
		</SmoothCorners>
	)
}
```

Add the size and background to the app stylesheet so the shape has visible
space to occupy:

```css
.trip-card {
	width: 280px;
	height: 120px;
	background-color: #dbeafe;
}
```

The panel should have a continuous outline and clip content at its corners.
Check it at the sizes used by your app; an empty or unmeasured host has no
useful shape to display.

## Platform boundaries

The package shares curve generation, but native clipping and shadows have
different limits. Android elevation cannot express custom shadow direction or
spread; flex-container props on this wrapper apply only to web and AppKit.
Use an inner shared layout component when arranging children across targets.
Source implementations do not establish pixel parity or device input behavior.

See the [public prop declarations](https://github.com/octane-xplat/octane-xplat/blob/main/packages/smooth-corners/src/props.ts)
for curve and per-corner options, and [styling screens](https://octane-xplat.goddardai.org/styling)
for the surrounding layout.
