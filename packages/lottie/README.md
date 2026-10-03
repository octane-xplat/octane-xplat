# `@octane-xplat/lottie`

```sh
pnpm add @octane-xplat/lottie
```

Lottie animations for Octane xplat apps: `lottie-web`'s SVG renderer on web,
the vendored `@nativescript-community/ui-lottie` engine on iOS and Android,
and Airbnb Lottie 4.6.1's AppKit view on macOS. The mobile plugin is a git
submodule (`src/vendor/ui-lottie`) registered through `nativescript.platforms`.
AppKit compiles its pinned Swift source as part of the app's native leaf build;
apps do not add another engine dependency.

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

On AppKit, use inline `data`, raw JSON in `src`, an absolute JSON file path,
or a `file://` or HTTPS URL. Relative paths, `~/`/`res://` bundle aliases,
HTTP URLs, `.lottie`/`.zip` archives, and external image assets are not
supported. See [the platform limits](../../docs/app/primitives.md#lottie-animations)
and [the investigation record](../../docs/notes/lottie-appkit-investigation.md)
for the complete boundary and runtime evidence.

```tsx
import { Lottie } from '@octane-xplat/lottie'

export function InlineAnimation({ animation }: { animation: object }) {
	return <Lottie data={animation} autoPlay loop={false} fit="contain" />
}
```

Per-target limits — including the expression/CSP boundary on web — are
recorded in [known limits](../../docs/verify/known-limits.md). Exercised by
[`LottieDemo`](../demos/src/LottieDemo.tsrx).

This is a git submodule checkout: after cloning run
`git submodule update --init` before building the workspace.
