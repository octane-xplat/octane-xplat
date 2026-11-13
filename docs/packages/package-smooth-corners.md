# @octane-xplat/smooth-corners

> Exact-match smooth corners for Octane xplat — one generated curve (Rosenfeld continuous, Figma squircle, superellipse, clothoid) painted natively with optional child clipping on web, iOS, Android, and macOS

Give a panel a smooth corner curve while letting badges and other children extend beyond its edges by default. Use this when ordinary
rounded corners do not give the shape you want. Implementations exist for web,
iOS, Android, and experimental macOS AppKit.

[Generated API reference](https://octane-xplat.goddardai.org/api-smooth-corners).

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

The panel should have a continuous outline. Its children remain visible beyond the panel’s edges.
Check it at the sizes used by your app; an empty or unmeasured host has no
useful shape to display.

## Clip an image or other content

Add `overflow: hidden` to the panel’s class when its children should stay inside the smooth outline. This clips the background and descendants to the same curve; the component’s own shadow stays outside. Removing the rule restores visible overflow.

```css
.trip-card {
  overflow: hidden;
}
```

**Breaking change:** earlier versions always clipped children. Add the rule above to thumbnails and other panels that relied on that behavior.

## Platform boundaries

The package shares curve generation, but native clipping and shadows have
different limits. Android elevation cannot express custom shadow direction or
spread; request it through `android.elevation`, separately from `shadow`.
Use an inner shared layout component when arranging children across targets.
Source implementations do not establish pixel parity or device input behavior. Native Windows and GTK are explicitly unsupported.

See the [public prop declarations](https://github.com/octane-xplat/octane-xplat/blob/main/packages/smooth-corners/src/props.ts)
for curve and per-corner options, and [styling screens](https://octane-xplat.goddardai.org/styling)
for the surrounding layout.

## Arrange content and set a border

Use an inner shared layout for rows, columns, and gaps. The wrapper owns its outline and parent placement; it has no flex-container convenience props. Border colors accept CSS hex, comma-separated `rgb()`/`rgba()`, and `transparent`. Four- and eight-digit hex use CSS alpha-last ordering on every supported target.

```tsx
import { SmoothCorners } from '@octane-xplat/smooth-corners'
import { Text, View } from '@octane-xplat/ui'

export function BorderedCard() {
  return (
    <SmoothCorners corners={24} border={{ width: 2, color: '#2563eb80' }}>
      <View style={{ display: 'flex', flexDirection: 'row', gap: 8 }}>
        <Text>Kyoto</Text>
        <Text>3 nights</Text>
      </View>
    </SmoothCorners>
  )
}
```

## Choose a shadow

Android elevation is an explicit platform option. Its value is a height in logical pixels; Android chooses the shadow's direction, color, and softness. The `android` option is ignored on other targets.

```tsx
import { SmoothCorners } from '@octane-xplat/smooth-corners'

export function ElevatedCard() {
  return <SmoothCorners corners={24} android={{ elevation: 8 }} />
}
```

On web, iOS, and AppKit macOS, `shadow` follows the generated silhouette and accepts color, opacity, offsets, blur, and spread. Native engines determine blur appearance; this is not a pixel-parity guarantee. Passing `shadow` on Android throws instead of substituting elevation. Choose it in a platform-specific screen or component.

```tsx
// A web, iOS or AppKit component leaf.
import { SmoothCorners } from '@octane-xplat/smooth-corners'

export function ShadowedCard() {
  return (
    <SmoothCorners
      corners={24}
      shadow={{ color: '#000000', opacity: 0.25, blur: 8, offsetY: 4, spread: 2 }}
    />
  )
}
```

## Valid inputs and unsupported hosts

Radii, border widths, blur, and elevation must be finite and non-negative. Smoothing is between 0 and 1; the superellipse exponent is at least 2. Opacity is between 0 and 1. Offsets and spread may be negative but must be finite. Invalid values throw `RangeError`; unsupported color syntax throws `TypeError`. Oversized valid radii are fitted to the available box.

```tsx
import { SmoothCorners } from '@octane-xplat/smooth-corners'

export function MixedCard() {
  return (
    <SmoothCorners
      corners={{
        topLeft: { radius: 32, curve: 'squircle', smoothing: 0.6 },
        bottomRight: { radius: 24, curve: 'superellipse', exponent: 4 },
      }}
      style={{ width: 240, height: 120, overflow: 'hidden' }}
    />
  )
}
```

Native Windows and GTK do not have supported adapters and throw when rendered. A browser or desktop webview uses the web implementation. Keep unsupported native hosts out of the screen's import/render path with platform component leaves.

**Breaking changes:** use a CSS property object for `style`, move row/column arrangement into an inner layout, replace named border/shadow colors with portable color syntax, and replace Android `shadow` with `android.elevation`. Native Windows now reports unsupported instead of drawing ordinary corners.
