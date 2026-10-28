# @octane-xplat/motion

Declarative numeric motion for Octane UI on web, iOS, Android, and the experimental macOS host. Use
`motion.View`, `motion.Row`, or `motion.Pressable` with `initial`, `animate`,
and `transition`, or `drag` with numeric translation bounds. Bound motion
values update hosts without rendering each frame.

```sh
pnpm add @octane-xplat/motion
```

```tsx
import { motion } from '@octane-xplat/motion'
import { Text } from '@octane-xplat/ui'

export function MovingCard() {
	return (
		<motion.View
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.3 }}
			drag="x"
			dragConstraints={{ left: 0, right: 120 }}
		>
			<Text>Drag the packing card</Text>
		</motion.View>
	)
}
```

iOS and Android apps using `drag` must install `@nativescript-community/gesturehandler`
and call its `install()` before creating the root. Web does not require this
optional peer. See [drag setup](../../docs/app/animation-gestures.md#drag-a-component).

```ts
// bootstrap.mobile.ts — before Application.run or creating Page/Frame roots.
import { install } from '@nativescript-community/gesturehandler'

install()
```

See the [motion guide](../../docs/app/animation-gestures.md) and the maintained
[MotionDemo](examples/MotionDemo.tsrx); [PresenceDemo](examples/PresenceDemo.tsrx)
covers retained exits. The [compatibility record](UPSTREAM.md) defines the
supported subset and differences from `@octanejs/motion`.

Add `layout` to animate a resize when a prop changes:

```tsx
import { motion } from '@octane-xplat/motion'

export function LayoutCard({ expanded }: { expanded: boolean }) {
	return <motion.View layout style={{ width: expanded ? 240 : 120, height: 80 }} />
}
```

For movement between components and crossfading content, follow the
[shared-element guide](../../docs/app/animation-gestures.md#move-an-element-between-components).

Generate declarations with `pnpm exec turbo run typegen --filter=@octane-xplat/motion`;
run DOM/engine and universal lifecycle tests with
`pnpm exec turbo run test test:native --filter=@octane-xplat/motion`.
Native compilation and object-driver tests are not physical-device evidence.

macOS has [package-boundary acceptance and focused native-channel checks](UPSTREAM.md#macos-package-boundary),
plus layout and shared-handoff geometry checks in `test:macos-runtime`.
Its source and published imports are checked separately from real AppKit runtime
assertions. Live OS preference changes, broader lifecycle acceptance and input
behavior remain unqualified.
