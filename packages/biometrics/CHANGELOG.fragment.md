# macOS Touch ID support

macOS AppKit apps can now check Touch ID availability and request local
biometric verification through `@octane-xplat/biometrics`. Missing hardware,
missing enrollment or sensor pairing/connection, and hosts without LocalAuthentication remain unsupported.
Lockout and interaction restrictions return denied; cancelled or failed
verification returns false. Password and Apple Watch authentication are not
substituted for biometrics.

```ts
import { biometrics } from '@octane-xplat/biometrics'

if ((await biometrics.ensure()) === 'granted') {
	const unlocked = await biometrics.impl!.verify('Unlock your saved trips')
	console.log(unlocked ? 'Unlocked' : 'Still locked')
}
```
