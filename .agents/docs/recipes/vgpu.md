# Draw a browser shader with vgpu

ID: vgpu
Targets: web
Related APIs: @octane-xplat/canvas, Canvas, vgpu, init, surface, effect, frame, Gpu.dispose

## Starting point

A running Xplat app and a WebGPU-capable browser on localhost or HTTPS.
Phone and native desktop vgpu qualification is outside this recipe.

## Requirements

- Install vgpu as an app dependency and reuse the existing Canvas leaf.
- Mount a browser drawing while keeping other targets usable.
- Handle unavailable WebGPU and release owned graphics resources.

## Acceptance criteria

- AC1: An app author can install the packages, configure shader imports, mount the example, and draw the gradient without adding a framework leaf package.
- AC2: The browser implementation is selected through a platform file, while other targets retain a descriptive fallback without importing vgpu.
- AC3: Device creation or drawing failure produces a readable status, and device loss gives a recovery action.
- AC4: Leaving the screen releases GPU resources, including resources acquired after unmount; returning creates a fresh drawing.

## Documentation

- AC1: [Install](../../../docs/app/vgpu.md#install-the-packages), [browser drawing](../../../docs/app/vgpu.md#add-the-browser-drawing), and [try it](../../../docs/app/vgpu.md#try-it).
- AC2: [Other targets](../../../docs/app/vgpu.md#keep-other-targets-usable) and [platform boundaries](../../../docs/app/vgpu.md#phone-and-desktop-boundaries).
- AC3: [Failure and loss handling](../../../docs/app/vgpu.md#add-the-browser-drawing) and [recovery](../../../docs/app/vgpu.md#try-it).
- AC4: [Effect lifetime](../../../docs/app/vgpu.md#add-the-browser-drawing) and [returning to the screen](../../../docs/app/vgpu.md#try-it).
