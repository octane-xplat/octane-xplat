AppKit `openSettings` can now open the installed System Settings application.
Check support and availability from an explicit user action:

```ts
import { openSettings } from '@octane-xplat/platform'

if (openSettings.supported && await openSettings.isAvailable()) {
	const accepted = openSettings.open()
	console.log(accepted)
}
```

This does not choose an app-specific permission page or change permissions.
A true result means the launch request was accepted; actual AppKit presentation
and packaged behavior remain unqualified. See [opening settings](https://octane-xplat.goddardai.org/platform/platform-services#open-settings).
