### Add Windows native import and service candidates

The experimental Windows preset selects a dedicated UI root and Windows overlay,
gradient and announcement helpers. Windows platform leaves add text clipboard
operations, secure random bytes, device identity and packaged-app settings.
Hosted auth now reports unavailable instead of selecting Android code.

```ts
import { clipboard, random, authSession } from '@octane-xplat/platform'

const copied = await clipboard.writeText('Packing list')
if (random.supported) {
  const nonce = random.bytes(16)
}
// Windows hosted authentication remains unavailable.
const canSignIn = authSession.supported
```

Windows compilation, OS behavior, accessibility and packaging remain unverified
for these candidates.
[Windows support status](https://github.com/octane-xplat/octane-xplat/blob/main/docs/platform/windows-setup.md)
