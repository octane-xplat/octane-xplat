# Open an in-app document browser on AppKit

ID: appkit-in-app-browser
Targets: macos
Related APIs: @octane-xplat/web-browser, webBrowser, OpenBrowserOptions, openUrl

## Starting point

An AppKit screen needs an ordinary help/document page and explicit browser
ownership. The existing URL-link recipe covers external launch; this recipe
covers a package-owned WebKit window. Callback-based authentication stays with
the auth-session service.

## Acceptance criteria

- AC1: Declare the package and rebuild its native Swift/AppKit/WebKit bridge. Report capability conditionally, validate HTTP(S)/host through Foundation without requiring JS URL globals, and cancel missing/invalid/failed opens without external delegation. Document the external-opener hard cutover and explicit platform opener.
- AC2: Open resolves on presentation, not page load. Own one current browser; replacement/reentry/dismissal retire older attempts. Native close releases WebKit loads, KVO, delegates and content without acting on a newer owner.
- AC3: Native history/reload/stop/address/close, generic failure feedback and allowed HTTP(S) redirect/new-window behavior have source paths. Mobile options/hints, app website data store, main-thread policy and advanced web/auth/dialog/download/permission limits are explicit.
- AC4: Maintain ownership cases, a manual source fixture, packaged Swift configuration and AppKit harness dependency/task wiring. Separate source/syntax/manifest evidence from install/task graph/typecheck/Swift/native behavior/AX/packed-consumer proof.

## Documentation

- AC1–AC3: [Package subset and migration](../../../packages/web-browser/README.md#experimental-appkit-subset), [app guide](../../../docs/app/navigation.md#open-a-page-inside-an-appkit-browser-window), public type comments and Octane service reference.
- AC2, AC4: Five [owner cases](../../../packages/web-browser/tests/browser-owner.macos.test.ts), [manual fixture](../../../apps/macos/test/fixtures/browser-service.macos.tsrx) and [target note](../parity/appkit-progress.md#appkit-owned-in-app-browser-source-path), all unrun.
- AC4: AppKit package dependency and manual lock importer link include the native service; the scoped Turbo package task orders app/CLI prerequisites without entering normal PR checks. Installs, task execution/graph validation, Swift/native execution, VoiceOver and relocated/package/signing checks remain deferred. Capability and opened are not runtime qualification.
