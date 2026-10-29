# Produce a transformed image file

ID: image-manipulation
Targets: web, ios, android, macos
Related APIs: @octane-xplat/image-manipulator, ImageManipulator, useImageManipulator, ImageRef, SaveFormat, releaseImage, toNaturalCrop

## Starting point

An existing Xplat app with a readable still-image URI, or an app that already
selects an image with the media package. Crop selection is a separate workflow.

## Requirements

- Transform actual pixels and encode a new image without changing the source.
- Translate a displayed crop selection into valid natural-image coordinates.
- Own queued operations, rendered pixels, and saved results independently.
- Handle unavailable platforms, invalid inputs, and failed decoding or encoding.

## Acceptance criteria

- AC1: A reader can install the package, load a URI, resize/crop/rotate/flip it, and obtain a newly encoded image with the requested dimensions and format.
- AC2: A reader can convert image-crop selection geometry to natural pixels and produce the selected file, including whole-pixel rounding and image bounds.
- AC3: A reader can retain an earlier rendered snapshot through later edits/reset/disposal, derive another context from it, and release contexts, image refs, and encoded results at the correct owner boundary.
- AC4: A reader can use the Octane hook and account for source changes, pending operations, errors, and result ownership.
- AC5: A reader can identify platform source/format limits, web-only extent, unsupported hosts, performance/memory limits, and targets whose runtime behavior remains unverified.

## Documentation

- AC1: [First use](../../../packages/image-manipulator/README.md) and [direct transformations](../../../packages/image-manipulator/README.md#crop-a-selection).
- AC2: [Crop a selection](../../../packages/image-manipulator/README.md#crop-a-selection) and [maintained export helper](../../../packages/image-manipulator/examples/crop.ts).
- AC3: [Resource ownership](../../../packages/image-manipulator/README.md#own-contexts-pixels-and-files).
- AC4: [Component context ownership](../../../packages/image-manipulator/README.md#use-a-context-in-a-component).
- AC5: [Platform and failure behavior](../../../packages/image-manipulator/README.md#platforms-and-failure-behavior) and [verification record](../notes/image-manipulator.md).
