# `@octane-xplat/lottie`

Lottie animations for Octane xplat apps: `lottie-web`'s svg renderer on
web and a vendored fork of `@nativescript-community/ui-lottie` on native
(`src/vendor/ui-lottie` submodule — the leaf _is_ the plugin via
`nativescript.platforms`, so no separate plugin install).

```sh
pnpm add @octane-xplat/lottie
```

```tsx
import { Lottie } from '@octane-xplat/lottie'

;<Lottie
	src="https://example.com/anim.json" // native also takes ~/, res://, .lottie/.zip, or raw JSON
	autoPlay // default true
	loop // default false — a finite play is the shared contract
	fit="contain" // 'contain' | 'cover' | 'fill'
	onLoaded={(e) => console.log(e.duration)}
	onEnded={() => console.log('done')}
	bind={(h) => (handle = h)} // play/pause/stop/seekTo(0..1)/setSpeed + .native
/>
```

`data` (an inline animation object) wins over `src` when both are given.
Controlled `playing`/`progress`/`speed` props are optional — unset, the
animation is uncontrolled and the `bind` handle still drives it. Progress
is always normalized 0..1 and durations are milliseconds on every target
(the iOS plugin natively reports seconds; the leaf normalizes).

Per-target limits — including the expression/CSP boundary on web — are
recorded in [known limits](../../docs/known-limits.md). Exercised by
[`LottieDemo`](../demos/src/LottieDemo.tsrx).

This is a git submodule checkout: after cloning run
`git submodule update --init` before building the workspace.
