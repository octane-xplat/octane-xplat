# `@octane-xplat/effects`

> Platform view-effect shaders for Octane xplat — iOS stitchable Metal via @nativescript/swift-ui, Android AGSL RuntimeShader

Platform view-effect shaders for Octane xplat apps — applied to a whole
rendered subtree, not drawn onto it. iOS uses SwiftUI stitchable Metal
shaders (iOS 17+) through `@nativescript/swift-ui`; Android uses AGSL
`RuntimeShader`.

```sh
bun add @octane-xplat/effects
```

There is no root export — import the platform entry in the matching
platform-suffixed file:

```tsrx
/** @jsxImportSource @octane-xplat/jsx */
// effect.ios.tsrx
import { ShaderEffect } from '@octane-xplat/effects/ios'
import { Text } from '@octane-xplat/ui'

export function DistortedTitle() @{
  <ShaderEffect effect="heatHaze" args={{ intensity: 1 }}>
    <Text>Distorted content</Text>
  </ShaderEffect>
}
```

Shader content uses block flow by default. Put a named layout inside the effect
when its children need spacing or alignment; the effect host owns the shader,
while the child layout owns the arrangement.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
// effect.android.tsx
import { ShaderEffect } from '@octane-xplat/effects/android'
import { Text, VStack } from '@octane-xplat/ui'

export function EffectGroup() {
  return (
    <ShaderEffect source="uniform shader content; uniform float time; uniform float2 size; half4 main(float2 p) { return content.eval(p + float2(sin(time), sin(size.x + size.y)) * 0.00001); }">
      <VStack gap={2}><Text>Trip title</Text><Text>Ready to go</Text></VStack>
    </ShaderEffect>
  )
}
```

On Android, declare and use the automatic `time` and `size` uniforms as shown
above. A missing-uniform error can abort the Android 35 native runtime before
JavaScript can catch it; see [issue #263](https://github.com/octane-xplat/octane-xplat/issues/263).

`effect` names a bundled shader (`heatHaze`, `sheen`, `shatter`) or a
custom one registered via `XplatShaderEffectRegistry.register` in an app
Swift file. `args` are forwarded as uniforms; the provider injects `time`
and `size` per frame. `animate` (default true) drives `time` at display
rate — pass `false` for static effects. `maxSampleOffset` bounds how far a
distortion shader may displace. On both targets the subtree renders
normally into a detached host, so the shader sees real framework pixels.

The iOS leaf needs a deployment target of **iOS 17** — below it the subtree
renders without the effect (the starter app's `build.xcconfig` already pins
17.0). The iOS content portals from its declaring tree, so `createContext`/
`useContext` values and live updates reach the effected subtree.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
// effect.ios.tsx
import { ShaderEffect } from '@octane-xplat/effects/ios'
import { Text } from '@octane-xplat/ui'

export function StaticEffect() {
  return (
    <ShaderEffect
      effect="heatHaze"
      args={{ intensity: 1 }}
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
([`packages/demos/src/EffectsDemo.ios.tsrx`](https://github.com/octane-xplat/octane-xplat/blob/main/packages/demos/src/EffectsDemo.ios.tsrx),
`.android`, `.macos`); component index:
[`docs/app/components.md`](https://octane-xplat.goddardai.org/components).

[Generated API reference](https://octane-xplat.goddardai.org/api-effects).
