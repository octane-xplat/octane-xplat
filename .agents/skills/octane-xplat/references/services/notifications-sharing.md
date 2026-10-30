# Notifications, clipboard, and sharing

Use for AppKit clipboard feedback, notification permission reads, and native share ownership. Source capabilities require separate host verification; see the [service index](../services.md).

## Copy text on AppKit

AppKit `clipboard.canCopy` checks write access independently of read access.
Use `writeText` for copy and `readText` only when reading is part of the user's
action. The UI `copyText` helper delegates to the same writer. Operations resolve
false/null on missing or failing hosts; capability presence does not prove OS
pasteboard access. See [AppKit clipboard access](../../../../../docs/app/keyboard-clipboard.md#appkit-clipboard-access).

```ts
import { clipboard } from '@octane-xplat/platform'

export async function copyMessage(text: string) {
	return clipboard.canCopy ? clipboard.writeText(text) : false
}
```

### Copy feedback ownership

The shared useClipboard hook owns feedback only while mounted. Held triggers
resolve false after unmount; already submitted writes retain their actual boolean
outcome without late state, announcements, onCopy or reset timers. A failed native
announcement cannot reject a successful copy. Retained route panes remain mounted;
this is not a route-visibility gate. Attempts remain independent, and consumer
onCopy errors still reject the caller's promise. AppKit hook/object-driver cases
require separate verification and do not qualify real NSPasteboard/effects/VoiceOver.
See [copy feedback lifetime](../../../../../docs/app/keyboard-clipboard.md#keep-copy-feedback-with-its-screen).

```tsx
import { Pressable, Text, useClipboard } from '@octane-xplat/ui'

export function CopyAndClose(props: { text: string; close: () => void }) {
	const { copy } = useClipboard({ announce: 'Copied' })
	return <Pressable onPress={async () => {
		const pending = copy(props.text)
		props.close() // Parent unmounts this owner; pending still resolves.
		await pending
	}}><Text>Copy and close</Text></Pressable>
}
```

## AppKit local-notification permission reads

Native AppKit status reads use `getStatus`, not the authorization-request
selector. Rebuild the host after upgrading; absent/stale metadata or no bundle
identity reports unsupported without a prompt fallback. Import the leaf before
using its shared permission owner. Request only after an explicit app action;
`undetermined` can ask, denied cannot. Grant/provisional state does not prove
presentation. The hosted macOS webview bridge remains ensure-only and can prompt
on reads; do not apply this native guarantee to that backend.

```ts
import { notifications } from '@octane-xplat/notifications'
const status = await notifications.getPermissions()
// An explicit button can separately call notifications.requestPermissions().
```

The native read/request/thread/metadata cases are authored. Real OS
prompts, relaunch/revocation, bridge callbacks, foreground/background delivery,
packaging and signing require separate target qualification in #62.

## Native AppKit sharing ownership

Use the runtime `@octane-xplat/share` dependency and rebuild for its package-owned
Objective-C bridge. The native leaf no longer uses the private harness share seam.
Call directly from an input action, retain files until completion, and branch on
outcomes. Subjects apply to text/URL services; file options remain Android-only.
A visible key/main window without an attached sheet is required. Overlap is
unavailable, not a replacement. Picker/service cancellation and presenter teardown
settle cancelled; didShareItems alone settles shared, which is not receipt proof.
Metadata/presenter/service failures are unavailable; invalid file kinds reject.

```ts
import { share } from '@octane-xplat/share'
const outcome = await share.file('file:///tmp/trip%20notes.txt')
```

Local file URLs support empty/localhost authority and decode once. Do not pass
content://, remote file authorities, raw query/fragment syntax or NUL; use share.url
for non-file absolute URLs. Missing callbacks stay pending until window/app
teardown; no timeout fabricates success. Screen teardown alone cannot cancel the
native service. The separate hosted webview host still reports launch as shared.
Eight facade cases, intercepted picker and metadata/consumer fixtures require separate verification;
AppKit event-context requirements (including mouse-down), native callbacks, OS UI,
actual transfer, VoiceOver and packaged consumers require separate target qualification in #62.
