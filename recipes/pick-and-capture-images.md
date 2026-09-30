# Pick and capture images

ID: pick-and-capture-images
Targets: web, ios, android
Related APIs: @octane-xplat/media, media.ensure, media.pickImage, media.pickImages, media.capturePhoto, PickedImage, files.release

## Starting point

An app that previews or uploads selected still images. Live preview belongs to
[camera-preview](camera-preview.md); this workflow uses the OS/browser picker.

## Requirements

- Install the media leaf and configure the app's permission descriptions.
- Distinguish permission denial or unsupported capture from cancellation.
- Keep returned previews until their owner ends, then release them.
- Handle failed selection/conversion without leaking temporary previews.

## Acceptance criteria

- AC1: The reader can install the leaf, configure native permission setup, and choose single, multiple, or still capture on each target.
- AC2: Denial, unsupported cameras, and user cancellation leave the app without a new selected image; the reader can distinguish an ensure result from a null capture result.
- AC3: Successful selection returns an upload data URL and an opaque preview URI; replacement and owner cleanup release the returned references, and failed conversion does not retain inaccessible previews.

## Documentation

- AC1: [Pick and capture images](../docs/platform-services.md#pick-and-capture-images).
- AC2: [Pick and capture images](../docs/platform-services.md#pick-and-capture-images). [Qualification boundaries](../docs/optional-service-qualification.md) track real permission/capture revalidation.
- AC3: [Pick and capture images](../docs/platform-services.md#pick-and-capture-images) and [cleanup regressions](../packages/media/tests/cleanup.test.mjs). [Qualification boundaries](../docs/optional-service-qualification.md) track native runtime checks separately from coverage.
