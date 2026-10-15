# `@octane-xplat/share`

```sh
pnpm add @octane-xplat/share
```

The platform share sheet for Octane xplat apps. iOS and Android run
`@nativescript/social-share` for text/URLs plus the package's own
`UIActivityViewController`/`ACTION_SEND` path for files; web calls
`navigator.share` where it exists (mobile browsers, some desktop) and
degrades to a clipboard copy elsewhere so the call still does something
useful; macOS forwards the payload to the AppKit host, which presents
`NSSharingServicePicker`.

```ts
import { share } from '@octane-xplat/share'

const result = await share.text('Day 3 in Kyoto — 12km walked', 'Trip update')
const link = await share.url('https://example.com/trips/42', 'My itinerary')
```

Methods resolve a `ShareResult`: `'shared'` when the platform sheet
completed (or, on Android, when the chooser launched — `ACTION_SEND`
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
- **macOS** presents `NSSharingServicePicker` for the file.

Guide: [Using device features](../../docs/platform/platform-services.md);
per-target availability: [platform notes](../../.agents/docs/notes/platform-notes.md).
Exercised by the harness `Services` screen
([`packages/app/src/Services.tsrx`](../app/src/Services.tsrx)).
