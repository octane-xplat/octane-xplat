# Keep an illustration when Canvas drawing is unavailable

ID: canvas-fallback
Targets: web, ios, android, macos
Related APIs: @octane-xplat/canvas, Canvas, CanvasReady, getContext, getGPU

## Starting point

A working app and a static illustration or description to show when drawing
is unavailable. Choosing a new graphics backend or enabling native desktop
shaders is outside this recipe.

## Requirements

- Import and mount Canvas safely using the target's workspace or published package entry.
- Discover unavailable contexts before attempting to draw or acquire a device.
- Preserve the caller's static fallback when drawing is unsupported.

## Acceptance criteria

- AC1: The shared package import and props typecheck on each target; macOS imports and mounts without loading the iOS/Android Canvas plugin.
- AC2: The caller can inspect the resolved context or defer acquisition through `canvas.getContext()` and handle null before drawing. AppKit returns null for every declared context kind.
- AC3: The caller can check `getGPU()` before adapter/device acquisition; unsupported AppKit returns null without supplying a fabricated GPU, adapter, or device.
- AC4: An unavailable context leaves the caller-owned static fallback present; mounting a neutral AppKit frame does not imply a drawable surface.

## Documentation

- AC1: [Canvas setup and basic drawing](../packages/canvas/README.md) and [platform module resolution](../docs/platform/module-resolution.md#file-variants).
- AC2: [Nullable acquisition and fallback](../packages/canvas/README.md#keep-a-fallback-when-drawing-is-unavailable).
- AC3: [GPU availability and AppKit boundary](../packages/canvas/README.md#keep-a-fallback-when-drawing-is-unavailable).
- AC4: [Caller-owned fallback](../packages/canvas/README.md#keep-a-fallback-when-drawing-is-unavailable) and [maintained AppKit fallback demo](../packages/demos/src/CanvasDemo.macos.tsrx).
