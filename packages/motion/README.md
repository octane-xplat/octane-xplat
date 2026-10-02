# @octane-xplat/motion

Declarative numeric motion for Octane UI on web, iOS, and Android. Use
`motion.View`, `motion.Row`, or `motion.Pressable` with `initial`, `animate`,
and `transition`, or `drag` with numeric translation bounds. Bound motion values update hosts without rendering each frame.

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

See the [motion guide](../../docs/app/animation-gestures.md) and maintained
[MotionDemo](examples/MotionDemo.tsrx). Use the [PresenceDemo](examples/PresenceDemo.tsrx) for retained exits.
The [compatibility record](UPSTREAM.md)
defines the supported subset and differences from `@octanejs/motion`.

Build with `pnpm --filter @octane-xplat/motion build`; run DOM/engine tests with
`pnpm --filter @octane-xplat/motion test` and universal lifecycle tests with
`pnpm --filter @octane-xplat/motion exec vitest run --config vitest.native.config.mts`.
Native compilation and object-driver tests are not physical-device evidence.

Native consumers must install `@nativescript-community/gesturehandler` and call
its `install()` before creating the root. See [drag setup](../../docs/app/animation-gestures.md#drag-a-component). Web does not require this optional peer.

```ts
// bootstrap.mobile.ts — before Application.run or creating Page/Frame roots.
import { install } from '@nativescript-community/gesturehandler'

install()
```
