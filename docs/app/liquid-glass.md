# Add an iOS material behind controls

> Put native glass or blur behind controls, and lay out the controls directly inside it.

Use `LiquidGlass` in an `.ios.tsrx` screen. UIKit renders glass on iOS 26+ and system material blur on earlier supported iOS versions. Mason measures and positions the children. The material is one layout box: ordinary `className` and `style` control its size, margins, padding, borders, positioning and child layout.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
import { Pressable, Text } from '@octane-xplat/ui'
import { LiquidGlass } from '@octane-xplat/ui/ios'
import { useSignal$ } from 'octane/signals/client'

export function GlassControls() {
  const presses$ = useSignal$(0)

  return (
    <LiquidGlass className="p-4 rounded-xl">
      <Pressable onPress={() => presses$.set(presses$.get() + 1)}>
        <Text>Pressed {presses$.get()} times</Text>
      </Pressable>
    </LiquidGlass>
  )
}
```

## Lay out centered content

The default display is block, so children flow vertically. Set `display: 'flex'` on the glass itself to center an icon. Its fixed dimensions and child alignment use the same box. An inner layout wrapper or separate glass background sibling is unnecessary.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
import { Image } from '@octane-xplat/ui'
import { LiquidGlass } from '@octane-xplat/ui/ios'

export function GlassIcon({ icon }: { icon: string }) {
  return (
    <LiquidGlass
      style={{
        width: 72,
        height: 48,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
      }}
    >
      <Image src={icon} alt="" style={{ width: 24, height: 24 }} />
    </LiquidGlass>
  )
}
```

Classes can select flex or grid too. Padding and borders reduce the space available to children once. A block box fills its available width; use `width: 'max-content'` when its width should follow the content. Percentages and minimum/maximum sizes use the parent box just as they do for other Mason containers.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
import { Text } from '@octane-xplat/ui'
import { LiquidGlass } from '@octane-xplat/ui/ios'

export function GlassLabel({ label }: { label: string }) {
  return (
    <LiquidGlass className="p-4 rounded-xl" style={{ width: 'max-content', maxWidth: '100%' }}>
      <Text>{label}</Text>
    </LiquidGlass>
  )
}
```

Use the glass's own `overflow` to clip its content. On iOS 26+, circular border radii shape the material; `overflow: 'hidden'` also clips children. The native content host has no second padding, border or independent layout style. Elliptical material corners and earlier-system material corner shaping remain gaps in this integration.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
import { Image } from '@octane-xplat/ui'
import { LiquidGlass } from '@octane-xplat/ui/ios'

export function ClippedGlass({ image }: { image: string }) {
  return (
    <LiquidGlass style={{ width: 120, height: 80, borderRadius: 16, overflow: 'hidden' }}>
      <Image src={image} alt="" style={{ width: 120, height: 80 }} />
    </LiquidGlass>
  )
}
```

## Configure the material

Glass touch tracking defaults to `false`. Keep that default for ordinary child controls. Explicit interactive glass enables UIKit's touch response on iOS 26+; child input in that mode requires OS-input qualification on your supported systems. The blur fallback follows system appearance; glass-only variant, tint and animation settings do not alter it.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
import { Text } from '@octane-xplat/ui'
import { LiquidGlass } from '@octane-xplat/ui/ios'

export function DecorativeGlass() {
  return (
    <LiquidGlass interactive variant="clear" tint="#88aaff" className="p-4 rounded-xl">
      <Text>Touch-responsive surface</Text>
    </LiquidGlass>
  )
}
```

Keep the material and its ancestors at `opacity: 1`; UIKit warns that lower alpha can hide or alter effects. The older-system blur is installed at native creation and property replay, including remounts. Apps need no `loaded` listener or imperative blur setup.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
import { Text } from '@octane-xplat/ui'
import { LiquidGlass } from '@octane-xplat/ui/ios'

export function MaterialCard() {
  return (
    <LiquidGlass className="p-4 rounded-xl">
      <Text>Material card</Text>
    </LiquidGlass>
  )
}
```

## Group glass surfaces

`LiquidGlassContainer` also uses one Mason box and defaults to block. Select flex or grid on the container to arrange its glass children. Its `spacing` controls the distance over which UIKit groups nearby effects; use layout `gap` to space the boxes. Before iOS 26, the container provides layout without merging the blur surfaces.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
import { Text } from '@octane-xplat/ui'
import { LiquidGlass, LiquidGlassContainer } from '@octane-xplat/ui/ios'

export function GroupedGlass() {
  return (
    <LiquidGlassContainer spacing={12} className="flex flex-row gap-2">
      <LiquidGlass className="p-3 rounded-xl">
        <Text>Back</Text>
      </LiquidGlass>
      <LiquidGlass className="p-3 rounded-xl">
        <Text>Next</Text>
      </LiquidGlass>
    </LiquidGlassContainer>
  )
}
```

## Use a different surface on other platforms

LiquidGlass is an iOS-specific material. A web or Android platform leaf can reuse the layout choices with its own surface styling; that does not promise matching glass rendering. On web, `View` defaults to block, so select flex explicitly for the same centering behavior.

```tsx
/** @jsxImportSource @octane-xplat/jsx/dom */
import { Image, View } from '@octane-xplat/ui'

export function WebIconSurface({ icon }: { icon: string }) {
  return (
    <View
      style={{
        width: 72,
        height: 48,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Image src={icon} alt="" style={{ width: 24, height: 24 }} />
    </View>
  )
}
```

## Acceptance on a device

The maintained [Glass demo](../../packages/demos/src/GlassDemo.ios.tsrx) centers a changing glyph directly inside the material and includes both default and explicitly interactive child buttons. Source and object tests do not establish material appearance or OS touch delivery.

1. On an older supported iOS version, confirm that blur appears without app-side setup. Reopen the screen and check again.
2. On iOS 26+, change the glyph size and hide/reveal it. It must stay centered in the same glass box.
3. Press each child button with real OS input, reopen the screen, and repeat. Each count must increase once per press. Handler dispatch alone cannot qualify input; a failure leaves that interaction mode unresolved.
4. Check grouped effects on the supported OS versions. Numeric geometry and a supported UIKit hierarchy do not establish the appearance of merged material.

API references: [UIKit visual effect content hosting](https://developer.apple.com/documentation/uikit/uivisualeffectview), [system material](https://developer.apple.com/documentation/uikit/uiblureffect/style/systemmaterial), [glass interaction](https://developer.apple.com/documentation/uikit/uiglasseffect/isinteractive).
