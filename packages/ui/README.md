# @octane-xplat/ui

> Cross-platform primitives for Octane xplat — one element vocabulary that
> renders to the DOM on web and NativeScript views on iOS/Android.
>
> Status: `0.x` — the API surface is still moving. iOS/Android targets need
> the NativeScript toolchain (Xcode/JDK + `ns`).

```sh
pnpm add @octane-xplat/ui octane
```

`octane` is a required peer; the `@nativescript/*` peers are optional and
only needed for native targets.

```tsx
import { Row, Text, Pressable } from '@octane-xplat/ui'

;<Row className="items-center gap-2">
	<Text>Hello</Text>
	<Pressable onPress={save}>
		<Text>Save</Text>
	</Pressable>
</Row>
```

The package also ships `styled()`, layout stacks, routing (`Link`, `NavLink`,
route tables), overlay/toast/modal services, and the theme stylesheet:

```ts
import '@octane-xplat/ui/theme/tokens.css'
```

Docs:

- [Building screens](https://octane-xplat.goddardai.org/primitives) — the element vocabulary
- [Styling screens](https://octane-xplat.goddardai.org/styling) — classes, tokens, runtime styles
- [Moving between screens](https://octane-xplat.goddardai.org/navigation) — routes and links

Rules for consumers:

- Static styles = `className`; dynamic styles = `style` objects.
- One element vocabulary per file — platform divergence happens at file
  boundaries (`*.web`/`.native`/`.ios`/`.android`), not inside JSX.
- No DOM globals in shared code; use `@octane-xplat/platform` for device
  capabilities.
