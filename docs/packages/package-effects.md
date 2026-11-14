# `@octane-xplat/effects`

> Platform view-effect shaders for Octane xplat — iOS stitchable Metal via @nativescript/swift-ui, Android AGSL RuntimeShader

Apply an Android AGSL `RuntimeShader` to a group of framework views.
The iOS entry uses SwiftUI stitchable Metal shaders, but registered filters
currently prevent its NativeScript children from attaching. Use ordinary
content on iOS until [issue #274](https://github.com/octane-xplat/octane-xplat/issues/274)
is resolved.

```sh
bun add @octane-xplat/effects
```

There is no shared shader implementation. Import the Android entry from an
Android platform file. Shader content uses block flow by default. Put a named
layout inside the effect when its children need spacing or alignment; the effect host owns the shader,
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

On iOS, render the same content directly while shader hosting is unresolved:

```tsx
/** @jsxImportSource @octane-xplat/jsx */
// effect.ios.tsx
import { Text, VStack } from '@octane-xplat/ui'

export function EffectGroup() {
  return (
    <VStack gap={2}><Text>Trip title</Text><Text>Ready to go</Text></VStack>
  )
}
```

Apple documents that SwiftUI shader filters can replace UIKit-backed views
with placeholders. The iOS content bridge uses such a view. An unregistered
effect's unmodified-content fallback passes layout and presentation checks;
that does not establish a working registered shader. See
[Apple's filter limitation](https://developer.apple.com/documentation/swiftui/view/coloreffect(_:isenabled:)).

There is no web shader implementation. Keep platform choices in matching
platform files. Demonstration sources live in `EffectsDemo`
([`packages/demos/src/EffectsDemo.ios.tsrx`](https://github.com/octane-xplat/octane-xplat/blob/main/packages/demos/src/EffectsDemo.ios.tsrx),
`.android`, `.macos`); component index:
[`docs/app/components.md`](https://octane-xplat.goddardai.org/components).

[Generated API reference](https://octane-xplat.goddardai.org/api-effects).
