# @octane-xplat/platform

> Save the user's work, share content, attach photos, and handle device
> permissions through shared TypeScript services.
>
> Status: `0.x` — the API surface is still moving.

```sh
bun add @octane-xplat/platform octane
```

`octane` is a required peer; the `@nativescript/*` peers are optional and
only needed for native targets.

```ts
import { storage, permissions } from '@octane-xplat/platform'

storage.setString('has-seen-welcome', 'true')
const seen = storage.getString('has-seen-welcome')
const handoffConfirmed = storage.flush() // false on native Windows

const result = await permissions.requestPermissions('camera')
```

Request `flush()` when saving work and handle a false result or exception.
Automatic lifecycle flushing is best effort; host handoff does not guarantee
survival of every process or power failure. On experimental AppKit, missing
mutation hooks retain session-only changes and make flush return false.
Native Windows preserves string preferences but flush returns false: its host
exposes no blocking commit confirmation.
Native restart/lifecycle and installed-app qualification remain pending. See
[AppKit settings](../../docs/platform/platform-services.md#appkit-settings).

```ts
import { storage } from '@octane-xplat/platform'

export function saveDraft(text: string): boolean {
	try {
		storage.setString('draft', text)
		return storage.flush()
	} catch {
		return false
	}
}
```

For a reading or presentation screen, own display-sleep prevention with
`useKeepAwake()` and unmount the owner when it ends. Native AppKit checks both
activity methods, retains token ownership for cleanup and keeps the request
stable when hook options change. Physical sleep/bridge and installed-app
qualification remain pending. See [keep a screen awake](../../docs/platform/keep-awake.md).

```tsx
import { useKeepAwake } from '@octane-xplat/platform'
import { Text } from '@octane-xplat/ui'

export function ReadingScreen() {
	useKeepAwake()
	return <Text>Reading</Text>
}
```

For AppKit locale metadata, root and direct imports share a module-load snapshot.
`Intl.Locale` separates language/region while keeping script/extension subtags in
the full tag. Missing/invalid Intl falls back to English with no region. This
is not a live preferred-language list; device model/version discovery and native
qualification remain open. See [AppKit metadata](../../docs/platform/platform-services.md#read-appkit-locale-and-device-metadata).

```ts
import { locale, device } from '@octane-xplat/platform'

const initialLanguage = locale.language
const region = locale.region
const platform = device.os
```

On experimental AppKit, `openSettings` opens the installed System Settings
application without choosing a pane. Check availability before an explicit
user action; acceptance does not confirm presentation or a permission change.
Actual AppKit presentation and packaged behavior remain unqualified. See
[opening settings](../../docs/platform/platform-services.md#open-settings).

```ts
import { openSettings } from '@octane-xplat/platform'

if (openSettings.supported && await openSettings.isAvailable()) {
	const accepted = openSettings.open()
	console.log(accepted)
}
```

On AppKit, both system-bar methods are explicitly unsupported: they warn and
return void without changing window or menu chrome. Root and direct imports
share the same AppKit leaf, avoiding mobile Color helpers; installed/native
startup qualification remains open. See [system bars on AppKit](../../docs/platform/platform-services.md#system-bars-on-appkit).

```ts
import { systemBars } from '@octane-xplat/platform/system-bars'

systemBars.setStatusBarStyle('light') // Unsupported on AppKit.
systemBars.setColor('#171717') // Does not tint AppKit chrome.
```

Ask your agent for the user outcome and the fallback: “Attach a photo to a
trip item and explain when capture is unavailable.” Services cover storage,
permissions, deep links, and more. Services that need a NativeScript
plugin ship as `@octane-xplat/*` leaf packages (share, files, media,
biometrics, geolocation, notifications, secure-storage, haptics). Most documented
implementations cover web and iOS/Android; experimental desktop support varies
by service. Shared names do not imply identical availability or responses.
The full capability map lives in the docs:

- [Using device features](https://octane-xplat.goddardai.org/platform-services) — guide
- [Known limits](https://octane-xplat.goddardai.org/known-limits) — availability and platform differences
- [AppKit window and activity state](../../docs/platform/platform-services.md#read-appkit-window-and-activity-state)

For agents: [llms.txt](https://octane-xplat.goddardai.org/llms.txt) indexes the docs; `llms-full.txt` inlines every guide.

Rules for consumers:

- Import from the package (`'@octane-xplat/platform'` or a submodule like
  `'@octane-xplat/platform/storage'`) — never a leaf impl file.
- Check optional capabilities' `supported` flag and permission/result states;
  operations can still fail and need error handling.
- This package provides services. Screen components and OS widgets live in [`@octane-xplat/ui`](https://octane-xplat.goddardai.org/primitives).
