# @octane-xplat/ui

> Build shared screens for your app, with platform-specific controls where
> they improve the experience.
>
> Status: `0.x` — the API surface is still moving. iOS/Android targets need
> the NativeScript toolchain (Xcode/JDK + `ns`).

Start with the [app creator](../create/README.md) when building a new app with
an agent. Xplat's target direction covers web, iOS, Android, macOS, Windows,
and Linux; this package's established implementations cover web and mobile,
with a bounded experimental macOS surface. The Windows scaffold has not yet
been run on Windows, so UI support there remains unverified; Linux renders
the DOM surface inside an experimental WebKitGTK host. See [target support](https://octane-xplat.goddardai.org/spec#choose-your-targets).

To add the UI package to an existing configured app:

```sh
pnpm add @octane-xplat/ui octane
```

`octane` is a required peer; the `@nativescript/*` peers are optional and
only needed for native targets.

This component fragment assumes `save` is your app’s action handler.

```tsx
import { HStack, Text, Pressable } from '@octane-xplat/ui'

;<HStack className="items-center gap-2">
	<Text>Hello</Text>
	<Pressable onPress={save}>
		<Text>Save</Text>
	</Pressable>
</HStack>
```

The structural stylesheet is required; default component chrome is optional:

```ts
import '@octane-xplat/ui/theme/tokens.css'
import '@octane-xplat/ui/theme/chrome.css' // optional defaults
```

`styled()` composes class names from boolean variant props.

```tsx
import { styled, Pressable, Text } from '@octane-xplat/ui'

const DangerAction = styled(Pressable, { variants: { danger: 'bg-danger' } })
export function RemoveAction() {
	return (
		<DangerAction danger onPress={() => console.log('Remove item')}>
			<Text>Remove</Text>
		</DangerAction>
	)
}
```

Links navigate to URLs or registered routes; Overlay owns a temporary surface,
and showToast sends a notification to a mounted viewport or its fallback.

```tsx
import { Link, NavLink, Overlay, Text, showToast } from '@octane-xplat/ui'

export function Actions() {
	return (
		<>
			<Link href="https://example.com">Trip website</Link>
			<NavLink route={{ name: 'home', stack: 'root', params: {} }}>Home</NavLink>
			<Overlay open={false}>
				<Text>Saved</Text>
			</Overlay>
		</>
	)
}
showToast({ body: 'Trip saved' })
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
