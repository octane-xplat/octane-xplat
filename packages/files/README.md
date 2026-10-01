# `@octane-xplat/files`

File pick, read, and write for Octane xplat apps. iOS/Android run
`@nativescript-community/ui-document-picker` plus `@nativescript/core`
filesystem APIs (including `content://` URIs); web uses an `<input
type="file">` pick and downloads for writes; Linux goes through the desktop
host bridge (`Gtk.FileDialog`) and falls back to the web flow in a plain
browser; the macOS AppKit dev host is not wired and throws `unsupported`.

```sh
pnpm add @octane-xplat/files
```

```ts
import { files } from '@octane-xplat/files'

const ref = await files.pick('image/*')
if (ref) {
	const text = await files.readText(ref)
	files.release(ref)
}

// web: triggers a download; native: writes into the app documents folder
const out = await files.writeText('packing-list.txt', text)
```

`FileRef.uri` is opaque — a blob/object URL on web, a filesystem path or
`content://` URI on native. Pass it back to `files.readText`; do not parse
it. `release(ref)` cleans up native temp picks and is a no-op elsewhere.

Guide: [Using device features](../../docs/platform-services.md);
per-target availability: [platform notes](../../docs/platform-notes.md).
