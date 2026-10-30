# @octane-xplat/motion

Declarative numeric motion for Octane UI on web, iOS, Android, and the experimental macOS host. Use
`motion.View`, `motion.Row`, or `motion.Pressable` with `initial`, `animate`,
and `transition`, or `drag` with numeric translation bounds. Bound motion
values update hosts without rendering each frame.

```sh
bun add @octane-xplat/motion
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
		>
			<Text>Packing card</Text>
		</motion.View>
	)
}
```

The card should fade into view. To add dragging, first complete native gesture
setup below.

iOS and Android apps using `drag` must install `@nativescript-community/gesturehandler`
and call its `install()` before creating the root. Web does not require this
optional peer. See [drag setup](https://octane-xplat.goddardai.org/animation-gestures#drag-a-component).

```ts
// bootstrap.mobile.ts — before Application.run or creating Page/Frame roots.
import { install } from '@nativescript-community/gesturehandler'

install()
```

See the [motion guide](https://octane-xplat.goddardai.org/animation-gestures) and the maintained
[MotionDemo](https://github.com/octane-xplat/octane-xplat/blob/main/packages/motion/examples/MotionDemo.tsrx); [PresenceDemo](https://github.com/octane-xplat/octane-xplat/blob/main/packages/motion/examples/PresenceDemo.tsrx)
covers retained exits. The [compatibility record](https://github.com/octane-xplat/octane-xplat/blob/main/packages/motion/UPSTREAM.md) defines the
supported subset and differences from `@octanejs/motion`.

Imperative inertia continues a value using a release velocity. Put this hook
inside a `.tsx` or `.tsrx` component; call `release` when the gesture ends:

```tsx
import { useMotionValue } from '@octane-xplat/motion'

export function useHorizontalRelease() {
	const x = useMotionValue(0)
	const release = (velocity: number) => x.animate(x.get(), {
		type: 'inertia', velocity, min: 0, max: 120, power: 0.5, timeConstant: 280,
	})
	return { x, release }
}
```

Add `layout` to animate a resize when a prop changes:

```tsx
import { motion } from '@octane-xplat/motion'

export function LayoutCard({ expanded }: { expanded: boolean }) {
	return <motion.View layout style={{ width: expanded ? 240 : 120, height: 80 }} />
}
```

For movement between components and crossfading content, follow the
[shared-element guide](https://octane-xplat.goddardai.org/animation-gestures#move-an-element-between-components).

Generate declarations with `bun run turbo run typegen --filter=@octane-xplat/motion`;
run DOM/engine and universal lifecycle tests with
`bun run turbo run test test:native --filter=@octane-xplat/motion`.
Native compilation and object-driver tests are not physical-device evidence.

macOS has [package-boundary acceptance and focused native-channel checks](https://github.com/octane-xplat/octane-xplat/blob/main/packages/motion/UPSTREAM.md#macos-package-boundary),
plus layout and shared-handoff geometry checks in `test:macos-runtime`.
Its source and published imports are checked separately from real AppKit runtime
assertions. Live OS preference changes, broader lifecycle acceptance and input
behavior remain unqualified.


Combine layout projection with drag when surrounding content can move during the
gesture. The host keeps its position through layout moves and resumes layout
animation after release.

```tsx
<motion.View layout drag="x" dragMomentum={false} style={{ width: 100, height: 80 }} />
```

See [dragging through layout changes](https://octane-xplat.goddardai.org/animation-gestures#keep-dragging-through-layout-changes).
