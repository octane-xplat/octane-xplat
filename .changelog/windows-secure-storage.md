### Add experimental native Windows credential storage

Packaged Windows apps have a Credential Locker adapter for session strings,
scoped by package family. It preserves empty values and distinguishes missing
keys from read failures, with sanitized errors and no plaintext fallback.

```ts
import { secureStorage } from '@octane-xplat/secure-storage'

async function rememberSession(token: string) {
  if (!secureStorage.supported || !(await secureStorage.isAvailable())) return false
  return secureStorage.set('session-token', token)
}
```

Standalone x64 vault operations passed using task namespaces. Real package
identity, cross-launch persistence and app integration remain unqualified.
Windows/account policy can roam entries; package namespaces do not isolate
credentials from other desktop apps. See the
[Windows boundary](https://github.com/octane-xplat/octane-xplat/blob/main/packages/secure-storage/README.md#experimental-native-windows)
and Microsoft's [Credential Locker guide](https://learn.microsoft.com/en-us/windows/apps/develop/security/credential-locker).
