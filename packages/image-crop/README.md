# Inline image crop selection

`@octane-xplat/image-crop` selects a rectangle inline on web, iOS, Android, and macOS (AppKit).
It uses Octane Xplat primitives and shared geometry. It returns selection
coordinates; it does not produce a cropped image file or open a modal.

## Install and use

```sh
pnpm add @octane-xplat/image-crop
```

Use the existing Octane Xplat renderer setup; no extra NativeScript plugin or
CSS pipeline is required. Supply the source's decoded, oriented natural size
and a viewport in CSS pixels (web), DIPs (iOS/Android), or points (AppKit).

For AppKit, use the existing `xplatMacOS` compiler setup; the `macos` package
condition supplies source for that renderer. macOS image sources support base64
data URIs and local paths/file URLs. Remote URLs are not loaded by the AppKit
renderer; download them separately and supply a local source. Desktop WebView
apps use the web implementation.

```tsx
import { useState } from 'octane'
import { ImageCrop, toNaturalCrop } from '@octane-xplat/image-crop'
import type { Crop } from '@octane-xplat/image-crop'

export function PhotoSelection() {
  const [crop, setCrop] = useState<Crop>({
    unit: '%', x: 25, y: 25, width: 50, height: 50,
  })
  return <ImageCrop
    src="https://example.com/photo.jpg" alt="Photo to crop"
    imageWidth={1600} imageHeight={1200} width={400} height={300}
    crop={crop} aspect={4 / 3} minWidth={40} ruleOfThirds
    onChange={(_, percent) => setCrop(percent)}
    onComplete={(pixel) => {
      const natural = toNaturalCrop(pixel,
        { width: 400, height: 300 }, { width: 1600, height: 1200 })
      console.log(natural)
    }}
  />
}
```

Replace the example URL and dimensions with your source. Keep hook-calling
components in `.tsx` or `.tsrx` inside your renderer include glob.
[The maintained demo](https://github.com/octane-xplat/octane-xplat/blob/main/packages/image-crop/examples/selection.tsrx) uses a bundled image.

## Coordinates and control

The contract follows react-image-crop's crop shape and callback pair:
`onChange(pixelCrop, percentCrop)` and `onComplete(pixelCrop, percentCrop)`.
Store either callback argument and pass it back as `crop`. The widget does not
hold a separate visible selection when the controlled prop stays unchanged.

`px` means displayed-image pixels / DIPs, not natural source pixels. `%` means
percent of the contained image's width for x/width and height for y/height.
Letterbox margins are excluded. `containFrame(viewSize, naturalSize)` gives the
image rectangle; pass its width and height to `toNaturalCrop`. Use
`fromNaturalCrop` for the reverse mapping. A 1600×1200 source displayed at
400×300 maps `{x:100,y:75,width:200,height:150,unit:'px'}` to natural pixels
`{x:400,y:300,width:800,height:600,unit:'px'}`.

Drag the interior to move and any of eight handles to resize. `aspect` is
width/height. Minimum and optional maximum dimensions always use displayed
pixels, including for a percent crop. Image bounds and maximums take precedence
when a minimum cannot fit. Invalid controlled coordinates are constrained for
rendering without emitting a callback. Side handles with an aspect expand the
other axis around its midpoint; corners keep the opposite corner fixed.

`disabled` blocks gestures. `ruleOfThirds` draws non-interactive guide lines.
Completion fires on gesture end, not cancellation. Cancellation keeps the last
controlled selection. A layout change during a gesture aborts that gesture.

## Boundaries and verification

V1 assumes centered contain-fit and requires known natural dimensions; it does
not decode orientation or discover source dimensions. It does not implement
keyboard nudging, drawing a new rectangle outside the selection, circular
crops, or the full react-image-crop API. Small selections can have overlapping
24-pixel handle hit regions; choose minimum dimensions suitable for your UI.

Producing pixels is a separate concern: use canvas on web or ImageSource
operations on native, with the natural coordinates from `toNaturalCrop`.
Neither output path is implemented by this leaf.

From the monorepo root:

```sh
pnpm --filter @octane-xplat/image-crop test
pnpm --filter @octane-xplat/image-crop typecheck
pnpm --filter @octane-xplat/image-crop build
pnpm probe doctor
pnpm probe run packages/image-crop/examples/selection.tsrx --target web --deps @octane-xplat/image-crop
pnpm probe run packages/image-crop/tests/selection.macos.tsrx --target macos --deps @octane-xplat/image-crop
```

The mounted probe checks handles and records geometry. It does not establish
OS touch hit-testing or visual pixel parity. Geometry tests cover conversion,
letterboxing, movement, aspect resizing, and constraints.

The maintained AppKit integration test checks all eight resize handles, interior
movement, aspect and min/max bounds, cancellation, disabled callbacks, source
scaling, input-transparent guides, and window resizing. It uses renderer pan
dispatch and AppKit hit-testing; OS mouse input remains separately unverified.
