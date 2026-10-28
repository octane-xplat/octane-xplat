### Report stored sign-in deletion failures

**Breaking change:** hosted sign-out now rejects if credential deletion fails
or reports false. Memory is still signed out, and server revocation is still
attempted. Previously a deletion failure could be hidden and the stored
session could return after restart.

```ts
// Use the hosted auth client configured by your app.
import { auth } from './auth'
try {
  await auth.signOut()
} catch {
  console.log('Stored sign-in could not be cleared. Try again.')
}
```

[Hosted sign-in documentation](https://github.com/octane-xplat/octane-xplat/tree/main/packages/auth#hosted-sign-in-ceremonies)
