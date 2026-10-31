### Crashlytics works without a manual plugin import

On iOS and Android, `crashlytics` no longer throws
"firebase crashlytics is not available" when the app only installed the
package. The native leaf now loads `@nativescript/firebase-crashlytics`
itself, registering `firebase().crashlytics()` before the service's first
use — the bootstrap import the docs previously required is no longer needed.
Firebase app configuration is unchanged.

```ts
import { crashlytics } from '@octane-xplat/firebase-crashlytics'

crashlytics.recordError(new Error('Handled check'))
```

[Crashlytics](https://github.com/octane-xplat/octane-xplat/blob/main/packages/firebase-crashlytics/README.md)
