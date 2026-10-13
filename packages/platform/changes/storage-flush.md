# Durable storage writes with storage.flush()

`storage` gains a synchronous `flush()` that asks the platform store to make
pending writes durable and reports whether it confirmed. On iOS it calls
`NSUserDefaults.synchronize()`, on Android `SharedPreferences.Editor.commit()`,
and on macOS it delegates to the AppKit host's new `storageFlush` hook —
`synchronize()` in the stock host. Web, Linux, and Windows webviews commit each
`localStorage` write synchronously, so `flush()` is a no-op returning `true`.

```ts
import { storage } from '@octane-xplat/platform'

storage.setString('session-token', token)
if (!storage.flush()) {
	// The write is readable now but may not survive a hard kill — retry or warn.
}
```

Pending writes now also flush automatically when a native app suspends or
exits, and when a macOS host reports the app going inactive — apps no longer
need their own `ApplicationSettings.flush()` lifecycle wiring after writes or
on shutdown.

```ts
import { storage } from '@octane-xplat/platform'

// No suspend/exit wiring needed — importing storage registers it.
storage.setString('draft', text)
```

The macOS in-memory fallback — used when no AppKit host is installed — is
session-only, so `flush()` there returns `false` rather than claim durability
it cannot provide. A host with synchronous `storageSet`/`storageRemove` hooks
but no `storageFlush` returns `true`: each write already reached the host
process, which then owns durability.
