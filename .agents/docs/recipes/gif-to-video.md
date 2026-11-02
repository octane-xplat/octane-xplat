# Convert a GIF attachment to video

ID: gif-to-video
Targets: web, ios, android, macos
Related APIs: @octane-xplat/media-converter, convertGif, isAvailable, releaseVideo, ConversionJob

## Starting point

An existing Xplat app with a readable GIF URI. Native inputs are local files;
web inputs must be fetchable with any required CORS permission.

## Requirements

- Preserve animation frame order, composition, and delays in one video traversal.
- Offer conversion only when the requested encoder is available, and handle input-specific failures.
- Own progress, cancellation, temporary output, and cleanup explicitly.
- Distinguish SDK/source coverage from device/installed-consumer verification.

## Acceptance criteria

- AC1: A reader can install the converter, check MP4 availability, convert a local/fetchable GIF, and consume the resulting video URI without modifying the source.
- AC2: Frame timing, transparency/background, odd-dimension padding, output formats, and admission limits are explicit.
- AC3: A reader can report progress, cancel a job, handle rejection, and release successful outputs after their last use, including upload failure.
- AC4: A reader can identify unsupported hosts/formats and distinguish browser/native-engine runtime evidence from iOS/Android SDK and installed-consumer evidence.

## Documentation

- AC1: [First conversion](../../../docs/packages/package-media-converter.md#convert-an-attachment) and [maintained helper](../../../packages/media-converter/examples/attachment.ts).
- AC2: [Formats and limits](../../../docs/packages/package-media-converter.md#formats-and-limits).
- AC3: [Progress and cancellation](../../../docs/packages/package-media-converter.md#show-progress-and-cancel) and [output ownership](../../../docs/packages/package-media-converter.md#convert-an-attachment).
- AC4: [Platform constraints](../../../docs/packages/package-media-converter.md#formats-and-limits) and [qualification boundaries](../notes/media-conversion.md#verification-boundaries).
