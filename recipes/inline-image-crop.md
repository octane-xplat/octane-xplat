# Select an image crop inline

ID: inline-image-crop
Targets: web, ios, android
Related APIs: @octane-xplat/image-crop, ImageCrop, Crop, toNaturalCrop, containFrame

## Starting point

An Octane Xplat app with web and NativeScript renderer configuration and an
image source with known decoded, oriented natural dimensions.

## Requirements

- Install the leaf and render an inline controlled crop selection.
- Move and resize within the contain-fit image with consistent units and constraints.
- Convert selection geometry for a separate pixel export implementation.

## Acceptance criteria

- AC1: A reader can install the leaf and update controlled selection through its pixel/percentage callback pair on all three targets.
- AC2: A reader can configure aspect, minimum/maximum dimensions, disabled interaction, and thirds guides, and understand letterbox coordinates and completion/cancellation.
- AC3: A reader can convert displayed selection to natural pixels and identify the separate pixel-production responsibility.
- AC4: A maintained example demonstrates selection, and instructions distinguish geometry checks and mounted probes from OS input and pixel parity evidence.

## Documentation

- AC1: [Install and use](../packages/image-crop/README.md#install-and-use) and [maintained example](../packages/image-crop/examples/selection.tsrx).
- AC2: [Coordinates and control](../packages/image-crop/README.md#coordinates-and-control).
- AC3: [Coordinates and control](../packages/image-crop/README.md#coordinates-and-control) and [boundaries](../packages/image-crop/README.md#boundaries-and-verification).
- AC4: [Verification](../packages/image-crop/README.md#boundaries-and-verification) and [maintained example](../packages/image-crop/examples/selection.tsrx).
