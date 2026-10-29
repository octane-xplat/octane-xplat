### Distinguish missing sessions from AppKit storage failures

AppKit secure storage now rejects missing or malformed native read responses
instead of treating them as a missing token. Availability checks require the
complete native bridge, and operations capture it once so lookup failures do
not expose native error text. Writes and removals report success only for a
native true result.

```ts
import { secureStorage } from '@octane-xplat/secure-storage'
export async function sessionStatus(): Promise<'present' | 'missing' | 'unavailable'> {
  if (!secureStorage.supported || !(await secureStorage.isAvailable())) return 'unavailable'
  try { return (await secureStorage.get('session-token')) === null ? 'missing' : 'present' }
  catch { return 'unavailable' } // Keep tokens and native errors private.
}
```

Native Keychain and installed-app qualification for this change remain pending.
See [AppKit secure storage](https://github.com/octane-xplat/octane-xplat/blob/main/packages/secure-storage/README.md#macos-appkit).
