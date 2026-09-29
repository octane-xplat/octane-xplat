# @octane-xplat/motion

Declarative numeric motion for Octane UI on web, iOS, and Android. Use
`motion.View`, `motion.Row`, or `motion.Pressable` with `initial`, `animate`,
and `transition`. Bound motion values update hosts without rendering each frame.

See the [motion guide](../../docs/animation-gestures.md) and maintained
[MotionDemo](examples/MotionDemo.tsrx). Use the [PresenceDemo](examples/PresenceDemo.tsrx) for retained exits.
The [compatibility record](UPSTREAM.md)
defines the supported subset and differences from `@octanejs/motion`.

Build with `pnpm --filter @octane-xplat/motion build`; run DOM/engine tests with
`pnpm --filter @octane-xplat/motion test` and universal lifecycle tests with
`pnpm --filter @octane-xplat/motion exec vitest run --config vitest.native.config.mts`.
Native compilation and object-driver tests are not physical-device evidence.
