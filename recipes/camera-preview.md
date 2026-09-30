# Show a live camera preview

ID: camera-preview
Targets: web, ios, android
Related APIs: CameraView, @octane-xplat/camera, media.capturePhoto

## Starting point

A scaffolded app with a screen that needs a live camera preview. The reader
knows basic component props. Recording video and capturing stills from the
preview are outside this recipe; still photos use the media leaf described in [pick-and-capture-images](pick-and-capture-images.md).

## Requirements

- Install and declare the camera leaf package in the app.
- Mount a bounded preview, choose its lens, and start or stop it.
- Explain permission setup, readiness callbacks, and the difference between
  live preview and still-photo capture on each target.

## Acceptance criteria

- AC1: The reader can add `@octane-xplat/camera` and mount a preview on web, iOS, and Android without adding a separate camera plugin or finding platform permission setup in framework source.
- AC2: A maintained example lets the reader start and stop the preview, switch front and rear cameras, and observe ready or error state on each target.
- AC3: The reader can explain what `onReady` means on each target, what stopping the preview does, and how to capture a still photo separately.

## Documentation

- AC1: [CameraView setup and props](../docs/primitives.md#camera-preview) and [camera platform limits](../docs/known-limits.md#primitives).
- AC2: [Camera demo](../packages/demos/src/CameraDemo.tsrx).
- AC3: [CameraView setup and props](../docs/primitives.md#camera-preview), [camera platform limits](../docs/known-limits.md#primitives), and [primitive implementation notes](../docs/primitive-notes.md).
