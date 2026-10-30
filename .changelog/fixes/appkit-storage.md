### Keep AppKit settings and saved-query removal consistent

Native macOS settings now retain pending writes and removals when a host hook
is missing, and report an unconfirmed flush until those changes are handed
off. Native missing values no longer revive old fallback data. Inactive
subscriptions follow the current host and retry failed registration.

```ts
import { storage } from '@octane-xplat/platform'

export function saveDraft(text: string): boolean {
	try { storage.setString('draft', text); return storage.flush() }
	catch { return false }
}
```

AppKit query restore and writes remain best effort, while explicit purge
now reports native read/removal failures. Partial bridges use isolated
session memory. See [AppKit settings](https://github.com/octane-xplat/octane-xplat/blob/main/docs/platform/platform-services.md#appkit-settings)
and [query persistence](https://github.com/octane-xplat/octane-xplat/blob/main/docs/app/data.md#persisting-records).
Native restart, lifecycle and installed-app qualification remain pending.
