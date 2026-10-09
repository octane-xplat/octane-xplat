# `@octane-xplat/effects`

Platform view-effect shaders for Octane xplat apps — applied to a whole
rendered subtree, not drawn onto it. iOS uses SwiftUI stitchable Metal
shaders (iOS 17+) through `@nativescript/swift-ui`; Android uses AGSL
`RuntimeShader`.

```sh
pnpm add @octane-xplat/effects
```

There is no root export — import the platform entry in the matching
platform-suffixed file:

```tsx
/** @jsxImportSource @nativescript-community/octane */
// effect.ios.tsrx
import { ShaderEffect } from '@octane-xplat/effects/ios'
import { Text } from '@octane-xplat/ui'

export function DistortedTitle() @{
	<ShaderEffect effect="heatHaze" args={{ strength: 1 }}>
		<Text>Distorted content</Text>
	</ShaderEffect>
}
```

`effect` names a bundled shader (`heatHaze`, `sheen`, `shatter`) or a
custom one registered via `XplatShaderEffectRegistry.register` in an app
Swift file. `args` are forwarded as uniforms; the provider injects `time`
and `size` per frame. `animate` (default true) drives `time` at display
rate — pass `false` for static effects. `maxSampleOffset` bounds how far a
distortion shader may displace. On both targets the subtree renders
normally into a detached host, so the shader sees real framework pixels.

```tsx
/** @jsxImportSource @nativescript-community/octane */
// effect.ios.tsx
import { ShaderEffect } from '@octane-xplat/effects/ios'
import { Text } from '@octane-xplat/ui'

export function StaticEffect() {
	return (
		<ShaderEffect
			effect="heatHaze"
			args={{ strength: 1 }}
			animate={false}
			maxSampleOffset={{ width: 10, height: 10 }}
		>
			<Text>Trip title</Text>
		</ShaderEffect>
	)
}
```

No web implementation — guard usage behind a platform file boundary or a
`supported` check in app code. Exercised by `EffectsDemo`
([`packages/demos/src/EffectsDemo.ios.tsrx`](../demos/src/EffectsDemo.ios.tsrx),
`.android`, `.macos`); component index:
[`docs/app/components.md`](../../docs/app/components.md).
