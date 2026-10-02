# `@octane-xplat/share`

```sh
pnpm add @octane-xplat/share
```

The platform share sheet for Octane xplat apps. iOS and Android run
`@nativescript/social-share`; web calls `navigator.share` where it exists
(mobile browsers, some desktop) and degrades to a clipboard copy elsewhere
so the call still does something useful; macOS forwards the payload to the
AppKit host, which presents `NSSharingServicePicker`.

```ts
import { share } from '@octane-xplat/share'

const result = await share.text('Day 3 in Kyoto — 12km walked', 'Trip update')
const link = await share.url('https://example.com/trips/42', 'My itinerary')
```

Both methods resolve a `ShareResult`: `'shared'` when the platform sheet
completed, `'copied'` when the web fallback put it on the clipboard, and
`'unavailable'` when no share path exists — branch on the result rather
than catching.

```ts
if (result === 'copied') {
	console.log('Trip update copied; paste it into your message app')
} else if (result === 'unavailable') {
	console.log('Sharing is unavailable on this target')
}
```

Guide: [Using device features](../../docs/platform/platform-services.md);
per-target availability: [platform notes](../../docs/notes/platform-notes.md).
Exercised by the harness `Services` screen
([`packages/app/src/Services.tsrx`](../app/src/Services.tsrx)).
