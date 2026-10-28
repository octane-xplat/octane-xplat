# Add an iOS material behind controls

Use this in an `.ios.tsrx` screen. `LiquidGlass` uses native glass on iOS 26+
and adaptable system material blur on iOS 13–25. The blur follows the system's
appearance; glass-only `variant`, `tint`, and effect animation settings do not
change that fallback.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
import { Pressable, Text } from '@octane-xplat/ui'
import { LiquidGlass } from '@octane-xplat/ui/ios'
import { useSignal$ } from 'octane/signals/client'

export function GlassControls() {
	const presses$ = useSignal$(0)

	return (
		<LiquidGlass className="p-4 rounded-xl">
			<Pressable
				onPress={() => {
					presses$.set(presses$.get() + 1)
				}}
			>
				<Text>Pressed {presses$.get()} times</Text>
			</Pressable>
		</LiquidGlass>
	)
}
```

Glass touch tracking defaults to `false`. This keeps ordinary child controls
out of the reported interactive-glass touch interception path. Explicit
`interactive={true}` enables UIKit's glass response on iOS 26+, but touch
delivery to child controls in that mode is not device-qualified. Prefer the
default for toolbars with buttons until the acceptance checks below pass on
your supported OS versions.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
import { Text } from '@octane-xplat/ui'
import { LiquidGlass } from '@octane-xplat/ui/ios'

export function DecorativeGlass() {
	return (
		<LiquidGlass interactive>
			<Text>Touch-responsive surface</Text>
		</LiquidGlass>
	)
}
```

Keep the effect and its ancestors fully opaque (`opacity: 1`); UIKit warns
that lower alpha can make the material disappear. The component retains
NativeScript's layout and child content host. The older-iOS fallback is
installed when the native root is created and when glass props are replayed,
so no app-side `loaded` listener or native-view mutation is needed.

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

## Acceptance on a device

The maintained [Glass demo](../../packages/demos/src/GlassDemo.ios.tsrx) includes
both default and explicitly interactive child buttons. Source and host unit
tests do **not** establish UIKit rendering or OS touch delivery.

1. Open the Glass demo on iOS 13–25. Confirm material appears behind its content
   without app-side blur code; reopen the screen and confirm it remains.
2. On iOS 26+, press “Default glass child” with real OS input. The count must
   increase once per press. Reopen the screen and repeat.
3. Press “Interactive glass child” with real OS input. Its count must also
   increase once per press. A failure leaves explicit interactive child support
   unresolved; handler dispatch alone cannot pass this check.

`LiquidGlassContainer` retains its layout-only fallback before iOS 26; it does
not merge blur surfaces on those versions.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
import { Text } from '@octane-xplat/ui'
import { LiquidGlass, LiquidGlassContainer } from '@octane-xplat/ui/ios'

export function GroupedGlass() {
	return (
		<LiquidGlassContainer spacing={8}>
			<LiquidGlass>
				<Text>One surface</Text>
			</LiquidGlass>
		</LiquidGlassContainer>
	)
}
```

API references: [UIKit visual effect content hosting](https://developer.apple.com/documentation/uikit/uivisualeffectview),
[system material](https://developer.apple.com/documentation/uikit/uiblureffect/style/systemmaterial),
[glass interaction](https://developer.apple.com/documentation/uikit/uiglasseffect/isinteractive).
