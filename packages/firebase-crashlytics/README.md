# `@octane-xplat/firebase-crashlytics`

```sh
pnpm add @octane-xplat/firebase-crashlytics
```

Firebase Crashlytics — fatal crash capture plus `log`/`recordError`
non-fatals, user + attribute context, unsent-report controls on
iOS/Android via `@nativescript/firebase-crashlytics`. There is no
Crashlytics JS SDK, so web/desktop report `supported: false` — route those
errors to `@octane-xplat/sentry` or `posthog`.

```ts
import { crashlytics } from '@octane-xplat/firebase-crashlytics'

crashlytics.setUserId(user.id)
crashlytics.setAttribute('plan', 'pro')
crashlytics.log('entering checkout')
try { pay() } catch (e) { crashlytics.recordError(e) }
```

Fatal reports upload on the next app launch; verify in the console after a
relaunch, not immediately.
