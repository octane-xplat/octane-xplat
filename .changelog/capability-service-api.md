### Optional capabilities are flat services

Every optional capability — `secureStorage`, `notifications`, `geolocation`,
`biometrics`, `haptics`, `authSession`, `openSettings`, `webAuthn` — is now a
flat service object instead of a `Capability` wrapper. `ensure()` splits into
`getPermissions()` (reads, never prompts) and `requestPermissions()` (may
prompt), both resolving `{status, granted, canAskAgain}` with
`'granted' | 'denied' | 'undetermined' | 'unsupported'` statuses; `supported`
and `isAvailable()` report presence, and calling a method while unsupported
rejects `UnavailabilityError` from `@octane-xplat/lib/capability`.

```ts
import { secureStorage } from '@octane-xplat/secure-storage'

// Before: (await secureStorage.ensure()) === 'granted' && secureStorage.impl!.set(...)
// Now:
if (secureStorage.supported) {
	await secureStorage.set('session-token', token)
}
```

**Breaking change:** `.ensure()` and `.impl` are gone. Check `supported` or
`isAvailable()` before calling methods; use the permissions pair where a
runtime permission gates the feature. `permissions.ensure(kind)` is now
`permissions.getPermissions(kind)` / `permissions.requestPermissions(kind)`.

[Using device features](https://octane-xplat.goddardai.org/platform-services/)
