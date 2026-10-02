# Share text and URLs from an app

ID: share-content
Targets: web, ios, android, macos
Related APIs: @octane-xplat/platform, share.text, share.url, ShareResult

## Starting point

A scaffolded app with a screen that can offer a short message or link to other
apps. The reader knows how to add a button and handle an asynchronous result.

## Requirements

- Use the shared `share` service from app code.
- Give the reader a useful fallback when the target cannot share or copy.
- Preserve one caller across web, iOS, Android, and macOS.

## Acceptance criteria

- AC1: The reader can call `share.text()` and `share.url()` from the same shared screen.
- AC2: iOS, Android, and macOS present their native share UI; web uses Web Share when available and clipboard copy otherwise.
- AC3: The reader can handle `shared`, `copied`, and `unavailable` results without assuming the recipient received the content.

## Documentation

- AC1: [Share text and URLs](../docs/platform/platform-services.md#share-text-and-urls) and the maintained [Services example](../packages/app/src/Services.tsrx).
- AC2: [Share text and URLs](../docs/platform/platform-services.md#share-text-and-urls) and [platform-service notes](../docs/notes/platform-notes.md).
- AC3: [Share text and URLs](../docs/platform/platform-services.md#share-text-and-urls).
