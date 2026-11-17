### Draw WebGL2 scenes that use uniform blocks on iOS and Android

`Canvas` now reports a WebGL2 program's uniform blocks on iOS and Android, so engines such as PixiJS 3D find and bind their shader data. Previously the native context answered `null`, so those engines skipped the binding and the iOS simulator crashed on the first 3D mesh draw. `@octane-xplat/canvas` now uses `@nativescript/canvas` 3.0.9, and the query works without code changes:

```tsx
import { Canvas } from '@octane-xplat/canvas'

<Canvas
  context="webgl2"
  onReady={({ context }) => {
    const program = context.createProgram()
    // Attach and link your shaders, then:
    const blocks = context.getProgramParameter(program, context.ACTIVE_UNIFORM_BLOCKS)
  }}
/>
```

iOS builds now download the canvas framework through Swift Package Manager, so the first build needs network access to GitHub.
