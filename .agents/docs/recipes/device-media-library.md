# Browse and manage the device media library

ID: device-media-library
Targets: web, ios, android, macos
Related APIs: @octane-xplat/media-library, Asset, Album, Query, usePermissions, releaseAssetUri, addListener, @octane-xplat/image-manipulator

## Starting point

An existing Xplat app that needs a custom gallery, library saving, or album edits.
Use the media picker recipe when only attachment selection is required.

## Requirements

- Configure native permissions and distinguish denial, limited access and unsupported hosts.
- Page current library metadata without exporting every asset.
- Create and edit disposable assets/albums without confusing album membership and file ownership.
- Export a usable attachment and release temporary files and subscriptions.

## Acceptance criteria

- AC1: A reader can install the package, configure Apple purpose strings and native rebuilds, check availability, read without prompting, and request access from an action. Limited access remains limited; denied access does not initiate data operations.
- AC2: A reader can page ordered metadata and reconstruct durable handles, distinguish IDs from file URIs, refresh after library changes, and handle deleted or inaccessible records.
- AC3: A reader can copy an app file into the library, edit an album and delete selected records, accounting for OS confirmation, cancellation, Android move/copy rules, Apple membership-only removal, and platform-specific deletion behavior.
- AC4: A reader can export a still-image attachment for preview/upload, preserve the library original and release the exported URI, editing resources and final result at their respective owner boundaries.
- AC5: A reader can use the permission hook and scoped change subscription, avoid late updates after cleanup, and identify supported API/platform subsets and unverified runtime behavior.

## Documentation

- AC1: [First page](../../../packages/media-library/README.md#show-a-page-of-photos) and [permission setup](../../../packages/media-library/README.md#configure-permission-and-limited-access).
- AC2: [Paged queries and handles](../../../packages/media-library/README.md#page-through-assets-and-albums).
- AC3: [Saving, albums and deletion](../../../packages/media-library/README.md#save-an-app-image-and-edit-an-album).
- AC4: [Export ownership](../../../packages/media-library/README.md#own-exported-files-and-change-listeners) and [maintained attachment helper](../../../packages/media-library/examples/image-attachment.ts).
- AC5: [Permission hook](../../../packages/media-library/README.md#configure-permission-and-limited-access), [subscription cleanup](../../../packages/media-library/README.md#own-exported-files-and-change-listeners), [platform scope](../../../packages/media-library/README.md#platform-scope), and [verification record](../notes/media-library.md).
