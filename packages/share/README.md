# `@octane-xplat/share`

The platform share sheet for Octane xplat apps. iOS and Android run
`@nativescript/social-share` for text/URLs plus the package's own
`UIActivityViewController`/`ACTION_SEND` path for files; web calls
`navigator.share` where it exists (mobile browsers, some desktop) and
degrades to a clipboard copy elsewhere so the call still does something
useful; native macOS uses the package’s compiled AppKit bridge and
`NSSharingServicePicker`.

```sh
pnpm add @octane-xplat/share
```

```ts
import { share } from '@octane-xplat/share'

const result = await share.text('Day 3 in Kyoto — 12km walked', 'Trip update')
const link = await share.url('https://example.com/trips/42', 'My itinerary')
```

Methods resolve a `ShareResult`: `'shared'` when the platform sheet
or macOS service completed (or, on Android, when the chooser launched — `ACTION_SEND`
reports no outcome), `'cancelled'` when the user dismissed the sheet,
`'copied'` when the web fallback put it on the clipboard, and
`'unavailable'` when no share path exists — branch on the result rather
than catching.

```ts
if (result === 'copied') {
	console.log('Trip update copied; paste it into your message app')
} else if (result === 'unavailable') {
	console.log('Sharing is unavailable on this target')
}
```

## Sharing a file

`share.file(path)` presents the sheet for a local file — a recording, an
export, a downloaded document:

```ts
import { files } from '@octane-xplat/files'
import { share } from '@octane-xplat/share'

const saved = await files.writeBytes('clip.mov', bytes)
const result = await share.file(saved.uri, { subject: 'Share clip' })
```

`path` accepts an absolute filesystem path, a `file://` URL, and — Android
only — a `content://` URI, which is shared directly. Anything else
(relative paths, `https://` links — use `share.url`) rejects the promise;
setup problems like a missing Android provider merge also reject, so a
broken integration can't masquerade as `'unavailable'`. A file that
doesn't exist resolves `'unavailable'`.

Options: `subject` titles the Android chooser; `mimeType` overrides the
type inferred from the file extension (Android intent only — iOS/macOS
type the item from the file itself).

Platform notes:

- **iOS** uses `UIActivityViewController` with the popover anchored for
  iPad and reports `'shared'`/`'cancelled'` from the sheet's completion
  handler. The sheet's built-in "Save Video"/"Save Image" activities write
  to the photo library — apps using them need `NSPhotoLibraryAddUsageDescription`
  in `Info.plist`.
- **Android** shares through the package's FileProvider
  (`${applicationId}.xplatshare`), merged from `platforms/android/` —
  reinstall/rebuild native after adding or upgrading the package. Files
  under app-private storage, cache, and shared external storage are
  covered; a path outside those roots rejects.
- **Web** resolves `'unavailable'`: browsers can't share a file by path.
  In a macOS-hosted webview the call forwards to the AppKit share picker.
- **Native macOS** presents `NSSharingServicePicker` for the file through the
  package-owned bridge; keep the file available until the promise settles.

Guide: [Using device features](https://octane-xplat.goddardai.org/platform-services);
per-target availability: [platform notes](https://github.com/octane-xplat/octane-xplat/blob/main/.agents/docs/notes/platform-notes.md).
Exercised by the harness `Services` screen
([`packages/app/src/Services.tsrx`](https://github.com/octane-xplat/octane-xplat/blob/main/packages/app/src/Services.tsrx)).



## Native AppKit sharing

Keep this leaf in runtime dependencies and rebuild the native host after updating.
The CLI discovers its Objective-C header/source and links Foundation/AppKit; no
private `__xplatAppKit.shareContent` hook is required. Missing/stale metadata,
no visible key/main window, a window with an attached sheet, an overlapping share,
or an unreadable/missing/directory file returns `unavailable`. Invalid file-path
kinds reject before presentation. Local `file:///` and `file://localhost/` URLs
are decoded once; remote authorities, malformed escapes, query/fragment syntax
and NUL are rejected. Encode filename `?`/`#` characters in a file URL.

```ts
import { share } from '@octane-xplat/share'

const outcome = await share.file('file:///tmp/trip%20notes.txt')
// Keep that local file alive until outcome resolves.
```

Call sharing directly from the person's action. Native text subjects and URL
titles configure the service subject; URL shares contain the URL itself rather
than an additional title body item. File options remain Android-only. A service
may ignore its subject. Picker dismissal and Cocoa user cancellation return
`cancelled`; service failure returns `unavailable`; only `didShareItems` returns
`shared`, which does not establish receipt by a recipient. Closing the presenter
or terminating the app retires the owner as cancelled; that cannot retract a
service action already underway. Leaving a screen alone does not close native UI.

```ts
const outcome = await share.text('Trip saved', 'Trip update')
if (outcome === 'cancelled') console.log('Sharing dismissed')
```

AppKit requires an input event for picker presentation. This implementation calls
it synchronously on a main-thread invocation; actual mouse-down/mouse-up,
keyboard and accessibility activation remain unqualified. Off-main calls are
marshalled to the main queue and may lack that event context. There is no timer
that fabricates success, and a service that never calls its delegate remains
pending until its presenter closes or the app terminates. The separate hosted
webview host still reports shared on picker launch; this native leaf change does
not qualify or replace that backend.

Eight facade cases, an intercepted-picker fixture, metadata/no-presenter callback
checks and macOS Bundler/NodeNext packed-consumer lanes are authored but unrun.
No OS picker, recipient, file transfer, cancellation, thread/marshalling,
keyboard/VoiceOver, signing or installed-consumer behavior is qualified by source.
Semantics follow the installed AppKit SDK and Apple's
[service selection](https://developer.apple.com/documentation/appkit/nssharingservicepickerdelegate/sharingservicepicker(_:didchoose:))
and [sharing service](https://developer.apple.com/documentation/appkit/nssharingservice)
contracts. The native Services screen exercises explicit text/link actions;
the idle maintained fixture separates file preparation from its share action:

```sh
pnpm probe run examples/probes/share.macos.tsrx --target macos --watch
```
