# @octane-xplat/motion

Declarative numeric motion for Octane UI on web, iOS, and Android. Use
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

Native apps using `drag` must install `@nativescript-community/gesturehandler`
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

Build with `pnpm --filter @octane-xplat/motion build`; run DOM/engine tests with
`pnpm --filter @octane-xplat/motion test` and universal lifecycle tests with
`pnpm --filter @octane-xplat/motion exec vitest run --config vitest.native.config.mts`.
Native compilation and object-driver tests are not physical-device evidence.
