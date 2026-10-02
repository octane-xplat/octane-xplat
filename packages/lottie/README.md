# `@octane-xplat/lottie`

```sh
pnpm add @octane-xplat/lottie
```

Lottie animations for Octane xplat apps: `lottie-web`'s svg renderer on
web and a vendored fork of `@nativescript-community/ui-lottie` on native
(`src/vendor/ui-lottie` submodule — the leaf _is_ the plugin via
`nativescript.platforms`, so no separate plugin install).

```tsx
import { Lottie } from '@octane-xplat/lottie'

export function Preview() {
	return (
		<Lottie
			src="https://example.com/anim.json"
			autoPlay
			loop
			fit="contain"
			onLoaded={(event) => console.log(event.duration)}
			onEnded={() => console.log('Done')}
		/>
	)
}
```

`data` (an inline animation object) wins over `src` when both are given.
Controlled `playing`/`progress`/`speed` props are optional — unset, the
animation is uncontrolled and the `ref` handle still drives it. Progress
is always normalized 0..1 and durations are milliseconds on every target
(the iOS plugin natively reports seconds; the leaf normalizes).

```tsx
import { Lottie } from '@octane-xplat/lottie'

// animation is a parsed Lottie JSON object loaded by your app.
export function Animation({ animation }: { animation: object }) {
	return (
		<Lottie
			data={animation}
			playing={false}
			progress={0.5}
			speed={1}
			ref={(handle) => {
				handle.seekTo(0.5)
				console.log(handle.duration())
			}}
		/>
	)
}
```

Per-target limits — including the expression/CSP boundary on web — are
recorded in [known limits](../../docs/verify/known-limits.md). Exercised by
[`LottieDemo`](../demos/src/LottieDemo.tsrx).

This is a git submodule checkout: after cloning run
`git submodule update --init` before building the workspace.
