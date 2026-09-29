# @octane-xplat/ui

> Build shared screens for your app, with platform-specific controls where
> they improve the experience.
>
> Status: `0.x` — the API surface is still moving. iOS/Android targets need
> the NativeScript toolchain (Xcode/JDK + `ns`).

Start with the [app creator](../create/README.md) when building a new app with
an agent. xplat's five-target direction covers web, iOS, Android, macOS, and
Windows; this package's established implementations cover web and mobile,
with a bounded experimental macOS surface. Windows is not runnable in this
checkout. See [target support](https://octane-xplat.goddardai.org/spec#choose-your-targets).

To add the UI package to an existing configured app:

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
route tables), sheet/overlay/toast services, and the theme stylesheet:

```ts
import '@octane-xplat/ui/theme/tokens.css'
```

Docs:

- [Building screens](https://octane-xplat.goddardai.org/primitives) — the element vocabulary
- [Styling screens](https://octane-xplat.goddardai.org/styling) — classes, tokens, runtime styles
- [Moving between screens](https://octane-xplat.goddardai.org/navigation) — routes and links
- [Known limits](https://octane-xplat.goddardai.org/known-limits) — broken/platform-bound seams, version-stamped

For agents: [llms.txt](https://octane-xplat.goddardai.org/llms.txt) indexes the docs; `llms-full.txt` inlines every guide.

Rules for consumers:

- Static styles = `className`; dynamic styles = `style` objects.
- One element vocabulary per file — platform divergence happens at file
  boundaries (`*.web`, `.mobile`, `.ios`, `.android`, and the unsuffixed native default), not inside JSX.
- No DOM globals in shared code; use `@octane-xplat/platform` for device
  capabilities.
