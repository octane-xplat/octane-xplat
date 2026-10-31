# @octane-xplat/firebase-crashlytics

Report native crashes and handled errors to Firebase Crashlytics on iOS and
Android. Web and desktop report `supported: false`; use a JavaScript error
reporter such as [Sentry](https://github.com/octane-xplat/octane-xplat/blob/main/packages/sentry/README.md)
for those targets.

## Report a handled test error

Install in an existing Xplat app:

```sh
bun add @octane-xplat/firebase-crashlytics @nativescript/firebase-crashlytics@5.0.2
```

Complete the [NativeScript Firebase setup](https://firebase.nativescript.org/)
with the app's Firebase configuration files before running this example. The
native leaf registers the Crashlytics plugin on import; the Firebase app
still initializes from the bundled `GoogleService-Info.plist`/
`google-services.json`. See
[production error reporting](https://octane-xplat.goddardai.org/production-errors#use-crashlytics-as-a-native-alternative)
for symbol/crash qualification. Use a test project, then call this function
from a test action:

```ts
import { crashlytics } from '@octane-xplat/firebase-crashlytics'

export async function reportTestError() {
	if (!crashlytics.supported) return
	await crashlytics.setAttribute('scenario', 'documentation-example')
	crashlytics.log('Sending a handled test error')
	crashlytics.recordError(new Error('Xplat documentation test'))
}
```

Check that the handled error reaches the intended project. Native fatal-crash
reports are sent after the next launch, so verifying them requires a separate
crash-and-relaunch test. This example deliberately does not crash the app.
Production symbol uploads require build configuration beyond this adapter.
See the [public contract](https://github.com/octane-xplat/octane-xplat/blob/main/packages/firebase-crashlytics/src/types.ts)
for collection and unsent-report controls.
