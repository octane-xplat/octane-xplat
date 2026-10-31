# Share native AppKit text, links and local files

ID: appkit-sharing
Targets: macos
Related APIs: share, ShareFileOptions, ShareResult

## Starting point

The app already depends on share and has a text QA action. The native leaf
previously required a private harness-global seam; that host treated file URLs
as raw paths and returned shared on picker launch. No real picker failure or
recipient behavior was observed; these findings come from source inspection.

## Requirements

Share text, links and local files from AppKit through a package-owned native
picker with owned lifecycle and explicit qualification limits.

## Acceptance criteria

- AC1: Native AppKit resolves a package-owned compiled bridge without requiring the harness seam. Preserve the public API/types and export ShareFileOptions in macOS declarations. Header/source/framework metadata are packaged and missing/stale metadata is unavailable; native invocation errors reject.
- AC2: Text subjects and URL titles configure a selected service's subject; keep a URL as one NSURL item. Normalize absolute/local file URLs once, reject unsupported/remote/malformed/query/fragment/NUL inputs, and do not present unreadable, missing or directory files. File options retain Android-only semantics.
- AC3: Retain picker/delegates and selected service until an owned terminal event. Launch/selection is pending; didShareItems is shared, picker/Cocoa cancellation is cancelled and other service failures unavailable. Overlap cannot replace an owner. Presenter/app teardown retires observers/delegates, closes the picker where available and settles once without activating windows or claiming external-service retraction.
- AC4: Maintain eight facade cases, intercepted native picker and no-presenter metadata callback checks, macOS packed-consumer lanes, explicit Services controls and an idle file/text/link fixture. Document input-event context, file lifetime, callbacks that never finish, screen-versus-window teardown, hosted-webview differences and deferred OS/AX/consumer qualification.

## Documentation

- AC1: [Package guide](../../../packages/share/README.md#native-appkit-sharing), Octane services reference, fix note, [facade cases](../../../packages/share/tests/share.macos.test.ts), [intercepted picker](../../../packages/share/tests/native-picker.m), [metadata verifier](../../../packages/share/tests/verify-macos.mjs), [consumer lanes](../../../packages/share/tests/packed-consumer.mjs) and [target note](../exploration.md#operational-evidence).
- AC2: The same [package guide](../../../packages/share/README.md#native-appkit-sharing), [facade cases](../../../packages/share/tests/share.macos.test.ts) and [intercepted picker](../../../packages/share/tests/native-picker.m).
- AC3: The same [package guide](../../../packages/share/README.md#native-appkit-sharing), [facade cases](../../../packages/share/tests/share.macos.test.ts), [intercepted picker](../../../packages/share/tests/native-picker.m) and [target note](../exploration.md#operational-evidence).
- AC4: [Manual fixture](../../../examples/probes/share.macos.tsrx); mounting it performs no file write, share action, OS UI or delivery.
