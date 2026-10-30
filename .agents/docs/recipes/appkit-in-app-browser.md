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
- AC3: Native history/reload/stop/address/close, generic failure feedback and allowed HTTP(S) redirect/new-window behavior have source paths. Mobile options/hints, app website data store, main-thread policy and advanced web/auth/download/permission limits are explicit.
- AC4: Maintain ownership cases, a manual source fixture, packaged Swift configuration and AppKit harness dependency/task wiring. Separate source/syntax/manifest evidence from install/task graph/typecheck/Swift/native behavior/AX/packed-consumer proof.
- AC5: Page alert/confirm/prompt requests use owned website-labeled native sheets with one-shot completion, empty-versus-cancelled text results and cancellation on close/replacement/navigation/process termination. Maintain an idle manual dialog page; native dialogs, sequential requests, focus/IME/VoiceOver and teardown require separate runtime evidence.

- AC6: Page file controls use a website-labeled, owned NSOpenPanel respecting multiple/directory parameters. Cancellation and stale/overlap/close/replacement/navigation/process termination complete once with no selection; document missing public accept-type parameters. Maintain an idle manual page and keep actual file delivery, directory enumeration, upload, sandbox, focus/AX and teardown proof separate.

## Documentation

- AC1–AC3: [Package subset and migration](../../../packages/web-browser/README.md#experimental-appkit-subset), [app guide](../../../docs/app/navigation.md#open-a-page-inside-an-appkit-browser-window), public type comments and Octane service reference.
- AC2, AC4: Five [owner cases](../../../packages/web-browser/tests/browser-owner.macos.test.ts), [manual fixture](../../../apps/macos/test/fixtures/browser-service.macos.tsrx) and [target note](../exploration.md#operational-evidence), all unrun.
- AC4: AppKit package dependency and manual lock importer link include the native service; the scoped Turbo package task orders app/CLI prerequisites without entering normal PR checks. Installs, task execution/graph validation, Swift/native execution, VoiceOver and relocated/package/signing checks remain deferred. Capability and opened are not runtime qualification.
- AC5: [Manual page](../../../apps/macos/test/fixtures/browser-dialogs.html), package subset and [dialog source note](../exploration.md#operational-evidence). No dialog automation or native execution has run.

- AC6: [Manual file controls](../../../apps/macos/test/fixtures/browser-file-selection.html), package subset and [file-control source note](../exploration.md#operational-evidence). No native picker or upload was executed.
