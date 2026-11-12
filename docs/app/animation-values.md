# Animate sizes, units, and clipping

> Resize a card or animate its crop with the same Motion values used for movement.

Start with a [working Motion component](animation-gestures.md#animate-a-component).
This guide covers web, iOS, and Android. Expanded style targets are explicitly
unsupported on experimental desktop hosts; their existing numeric transform
and opacity support is unchanged. Native clipping needs a Mason-backed host,
such as `motion.View`.

## Make a crop open

In a screen component, give the host a measured size and supply both clip
endpoints. This card opens from a rounded crop into its full rectangle. The
content stays mounted, so a video inside can keep playing.

```tsx
import { motion } from '@octane-xplat/motion'
import { Text } from '@octane-xplat/ui'

export function OpeningCrop({ open }: { open: boolean }) {
  return <motion.View
    style={{ width: 240, height: 160, boxSizing: 'border-box' }}
    initial={{ clipPath: 'inset(20% 10% round 16px)' }}
    animate={{ clipPath: open ? 'inset(0% round 0px)' : 'inset(20% 10% round 16px)' }}
    transition={{ duration: 0.3 }}
  >
    <Text>The crop changes; this content stays mounted.</Text>
  </motion.View>
}
```

Motion writes native clipping through Mason's `style.clipPath`. Mason owns the
mask and reapplies it during layout and background redraw, including a resize.
Keep that ownership: do not install an app-owned native mask or wrap private
layout/background methods. A crop controls the visible region; it does not
change the content's layout size.

```tsx
import { motion } from '@octane-xplat/motion'

<motion.View
  style={{ width: 240, height: 160 }}
  initial={{ clipPath: 'circle(40px at 60px 80px)' }}
  animate={{ clipPath: 'circle(120px at 120px 80px)' }}
/>
```

Native geometry and ownership checks do not prove the appearance of every
embedded video surface. Qualify the actual media host on each target before
shipping. This work does not establish pixel parity, physical-device frame
pacing, or hardware video-surface clipping on Android.

## Choose a property and unit

The registry accepts the original seven channels plus the following styles.
It rejects unregistered properties instead of silently ignoring them.

| Group | Target names |
| --- | --- |
| Movement and visibility | `x`, `y`, `rotate`, `scale`, `scaleX`, `scaleY`, `opacity` |
| Dimensions | `width`, `height`, `minWidth`, `minHeight`, `maxWidth`, `maxHeight` |
| Positioned offsets | `top`, `right`, `bottom`, `left` |
| Spacing | `paddingTop/Right/Bottom/Left`, `marginTop/Right/Bottom/Left`, `rowGap`, `columnGap` |
| Borders | `borderTop/Right/Bottom/LeftWidth`, `borderTopLeftRadius`, `borderTopRightRadius`, `borderBottomLeftRadius`, `borderBottomRightRadius` |
| Compound paint and crop | `borderRadius`, `boxShadow`, `clipPath` |

Lengths accept numbers, `px`, `dip`, `%`, `vw`, `vh`, `em`, and `rem`. Numbers,
`px`, and `dip` all mean logical units: CSS pixels on web and DIP on native.
They never mean Android physical pixels. Border widths and gaps do not accept percentages. Rotation accepts numbers in degrees,
plus `deg`, `rad`, and `turn`. Scale and opacity require numbers.

```tsx
import { motion } from '@octane-xplat/motion'

<motion.View
  style={{ width: 240, height: 160, boxSizing: 'border-box' }}
  initial={{ x: '12px', rotate: '0turn', width: 240 }}
  animate={{ x: '50%', rotate: '0.25turn', width: '300dip' }}
/>
```

Mixed lengths resolve before interpolation. `x` percentages use the host's width;
`y` uses its height. Layout lengths use the containing parent's relevant size;
vertical padding and margin percentages follow CSS and use parent width.
For layout percentages, use an explicitly sized parent: web currently requires
an inline dimension; native accepts an explicit parent dimension or the root
viewport. Native percentage layout also requires that parent to have zero padding and border widths; use resolved absolute values for inset parents. Indefinite or cyclic references fail rather than guessing. Animated
web dimensions require `boxSizing: 'border-box'`; offsets require a positioned
host.

```tsx
import { motion } from '@octane-xplat/motion'
import { View } from '@octane-xplat/ui'

<View style={{ width: 400, height: 300, position: 'relative' }}>
  <motion.View
    style={{ position: 'absolute', height: 100, boxSizing: 'border-box' }}
    initial={{ width: '100px', left: 0 }}
    animate={{ width: '50%', left: '10%' }}
  />
</View>
```

Viewport units use the browser viewport or native root. Font units need a
resolved font size (`em` on the host, `rem` on the root); native requires those
sizes to be explicitly available. Missing metrics produce an error. Measured
references are observed during playback. A changed reference retargets from
the displayed sample, keeps the logical completion promise pending, and uses
the remaining tween duration. Physical springs retain sample velocity.

```tsx
import { motion } from '@octane-xplat/motion'

<motion.View
  style={{ width: 240, height: 160, fontSize: 16 }}
  initial={{ x: '0em' }}
  animate={{ x: '3em' }}
  transition={{ type: 'spring', stiffness: 180, damping: 26 }}
/>
```

`auto`, intrinsic sizing keywords, `calc()`, `var()`, CSS named colors, inset
shadows, and arbitrary CSS strings are outside this API. Use measured numbers
for intrinsic destinations. Relative destinations cannot repeat or use inertia;
use a numeric progress value or resolved absolute lengths for those cases.
Do not combine radius shorthand and corner longhands in one target.

## Match both ends of a compound value

A **compound value** contains several animated numbers. Matching structures
interpolate each numeric slot on the existing Motion clock. Radius shorthand
accepts one to four lengths and an optional `/` elliptical-radius section.
Shadows need matching lists of outset shadows, each with two to four lengths
and an explicit `rgba()` color. Shadow lengths accept logical absolute lengths and font units; percentages and viewport units are excluded. Negative radius/blur overshoot is clamped when
serializing the displayed sample.

```tsx
import { motion } from '@octane-xplat/motion'

<motion.View
  initial={{ borderRadius: '12px 24px / 8px 16px', boxShadow: '0px 2px 4px 0px rgba(0,0,0,0.2)' }}
  animate={{ borderRadius: '0px', boxShadow: '0px 12px 24px 0px rgba(0,0,0,0.4)' }}
/>
```

Clips support `inset()`, `circle()`, `ellipse()`, `polygon()`, and quoted SVG
`path()` data. Basic-shape lengths use the host's local border box; inset and
polygon percentages use their coordinate's axis. Circle percentage radii use
the normalized diagonal; ellipse radii use their respective axes. Paths use
local logical coordinates, without a `viewBox` or automatic scaling. A resize
changes a percentage shape, but a numeric path keeps its authored coordinates.

```tsx
import { motion } from '@octane-xplat/motion'

<motion.View
  style={{ width: 200, height: 100 }}
  initial={{ clipPath: 'polygon(0% 0%, 80% 0%, 100% 100%, 0% 100%)' }}
  animate={{ clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)' }}
/>
```

Both endpoints must use the same shape type and fill rule. Polygons must have
the same point count. Paths normalize relative coordinates and shorthand
commands, then require matching command topology, subpaths, closure, and arc
flags. Motion does not invent correspondence between unrelated paths.
`url()`, geometry-box suffixes, keyword positions, and external SVG references
are rejected. `none` cannot interpolate to a shape; use a full-box shape as the
open endpoint, or explicitly snap with a zero-duration tween.

```tsx
import { motion } from '@octane-xplat/motion'

<motion.View
  initial={{ clipPath: 'path("M0 0 L100 0 L100 80 L0 80 Z")' }}
  animate={{ clipPath: 'path("M10 0 L90 0 L90 80 L10 80 Z")' }}
  transition={{ duration: 0.3 }}
/>
```

## Bind a crop to progress

A `MotionValue<string>` can drive a registered property. `useTransform` can
produce string ranges or mapper results; its returned value is read-only.
Drive the source value, rather than calling `set` or `animate` on the derived
handle. These subscriptions update hosts without a component render per frame.

```tsx
import { motion, useMotionValue, useTransform } from '@octane-xplat/motion'
import { Button } from '@octane-xplat/ui'

export function ControlledCrop() {
  const progress$ = useMotionValue(0)
  const clip$ = useTransform(progress$, [0, 1], ['inset(20% round 16px)', 'inset(0% round 0px)'])
  return <>
    <motion.View style={{ width: 240, height: 160, clipPath: clip$ }} />
    <Button onPress={() => { void progress$.animate(1, { duration: 0.3 }) }}>Open</Button>
    <Button onPress={() => { void progress$.animate(0, { type: 'spring', stiffness: 200, damping: 30 }) }}>Close</Button>
  </>
}
```

Keep one writer per property. A binding cannot share its property with
`animate`, gesture targets, or built-in drag. A relative string value shared
across hosts must resolve identically; otherwise use separate values per host.
For compound springs, internal slot velocities continue on interruption, while
`getVelocity()` returns zero for a multi-slot value. Use a numeric progress
value when a gesture needs one meaningful release velocity.

```tsx
import { motion, useMotionValue } from '@octane-xplat/motion'

export function RelativeMove() {
  const x$ = useMotionValue('0px')
  return <motion.View style={{ width: 240, height: 160, x: x$ }} />
  // A handler can call x$.animate('50%', { duration: 0.3 }).
}
```

## Handle rejection and cleanup

`MotionTargetError` provides `code`, `property`, `value`, `reason`, and `platform`.
Imperative playback rejects invalid destinations before replacing the active
run. Declarative setup errors throw. Later binding or reference errors call
`onMotionError` (or log if no handler is supplied) and preserve the last valid
host sample. Fix the value or missing reference before restarting playback.
Host removal stops work, removes observers/subscriptions, and restores styles
still owned by Motion; a newer external style owner is retained.

```tsx
import { motion } from '@octane-xplat/motion'

<motion.View
  style={{ width: 240, height: 160 }}
  initial={{ clipPath: 'inset(10%)' }}
  animate={{ clipPath: 'inset(0%)' }}
  onMotionError={(error) => console.error(error.code, error.property, error.reason)}
/>
```

New style targets and unit-containing targets use JavaScript playback on all
supported platforms. Eligible existing numeric transform/opacity tweens can
still use platform acceleration. Several compound slots share one frame
request, but layout properties can trigger layout every frame. Start with
transforms and clipping for a video transition; measure the actual device before
choosing a performance-sensitive layout animation.

## Expand a video thumbnail

The maintained [VideoCropSurface](../../packages/motion/examples/VideoCropSurface.tsrx)
example combines one progress value, derived transform/clip values, the shared
pan owner, reduced motion, and cleanup. Copy it and
[its geometry helper](../../packages/motion/examples/video-geometry.ts) into your
app, replacing the relative Motion import with `@octane-xplat/motion`.
Measure all rectangles in one untransformed window plane. `thumbnailImage` is
the complete image mapping beneath the thumbnail crop; `thumbnailClip` is only
the visible part. `media` is the contain-fit image rectangle inside `overlay`.
All image mappings must preserve the same media aspect ratio.

```ts
import type { VideoGeometrySpec } from './video-geometry'

const geometry: VideoGeometrySpec = {
  overlay: { x: 0, y: 0, width: 400, height: 800 },
  media: { x: 0, y: 200, width: 400, height: 400 },
  thumbnailImage: { x: 20, y: 40, width: 120, height: 120 },
  thumbnailClip: { x: 20, y: 60, width: 120, height: 80 },
  radius: 16,
}
```

Mount the surface in a window-aligned overlay and position the player at
`media` inside it. Keep the player mounted through the close animation. The
example reports `onClosed` only for the current completed close; an interrupted
close cannot remove a reopened player. Replace `geometry` after a resize to
preserve the displayed image/crop at an intermediate progress value.

```tsx
import { Video } from '@octane-xplat/video'
import { VideoCropSurface } from './VideoCropSurface.tsrx'

<VideoCropSurface geometry={geometry} onControls={(controls) => controls?.open()} onClosed={() => console.log('Closed')}>
  <Video src={videoUrl} controls={false} style={{ position: 'absolute', left: geometry.media.x, top: geometry.media.y, width: geometry.media.width, height: geometry.media.height }} />
</VideoCropSurface>
```

The example disables layout projection on the crop host because the app's
geometry model already owns its transform. Pan updates use window positions,
so scaling the host does not change the drag's coordinate space. Cancellation
returns to the last completed endpoint with zero release velocity. Test opening,
reversal, drag cancellation, resize, and removal with the actual player. Geometry
unit tests establish crop containment and resize continuity; they do not
establish the video's rendered appearance or OS touch behavior.
