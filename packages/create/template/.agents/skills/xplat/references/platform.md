# Platform services and platform files

Use `@octane-xplat/platform` for common device services such as storage,
clipboard, permissions, connectivity, app lifecycle, URLs, and screen size.
Clipboard operations can fail or be unavailable; show a useful result.

```tsrx
import { useState } from 'octane'
import { clipboard } from '@octane-xplat/platform'
import { Pressable, Text } from '@octane-xplat/ui'

export function CopyTrip() {
  const [message, setMessage] = useState('Copy trip link')
  return <Pressable onPress={async () => {
    const copied = await clipboard.writeText('https://example.com/trips/42')
    setMessage(copied ? 'Copied' : 'Copy unavailable')
  }}><Text>{message}</Text></Pressable>
}
```

Features with additional native dependencies live in separate packages:
`@octane-xplat/share`, `files`, `media`, `biometrics`, `geolocation`,
`notifications`, `secure-storage`, and `haptics`. Install the package for the
feature you need. Biometrics, for example, reports `unsupported` on web;
check permission and availability before trying to verify someone.

```tsrx
import { useState } from 'octane'
import { biometrics } from '@octane-xplat/biometrics'
import { Pressable, Text } from '@octane-xplat/ui'

export function UnlockTrip() {
  const [message, setMessage] = useState('Unlock trip')
  return <Pressable onPress={async () => {
    const status = await biometrics.ensure()
    if (status !== 'granted' || !biometrics.impl) {
      setMessage('Use your password instead')
      return
    }
    const verified = await biometrics.impl.verify('Unlock your trip')
    setMessage(verified ? 'Unlocked' : 'Try again')
  }}><Text>{message}</Text></Pressable>
}
```

## Write a platform file when behavior differs

Split the file when a feature needs browser or OS APIs. Import the component
without a suffix; the bundler selects the matching implementation.

```text
src/parts/Scanner.web.tsrx      browser implementation
src/parts/Scanner.mobile.tsrx   shared iOS/Android implementation
src/parts/Scanner.ios.tsrx      iOS override
src/parts/Scanner.tsrx          native default
```

```tsrx
import { Scanner } from './parts/Scanner'

export function ScanScreen() { return <Scanner /> }
```

Native JSX files start with the NativeScript pragma on line 1. Import native
APIs from `@nativescript/core`, and read app lifecycle state inside the call
rather than during module initialization. This example belongs in
`Status.mobile.tsrx`:

```tsrx
/** @jsxImportSource @nativescript-community/octane */
import { Application } from '@nativescript/core'
import { Pressable, Text } from '@octane-xplat/ui'

export function Status() {
  return <Pressable onPress={() => console.log(Application.hasLaunched())}>
    <Text>Check app status</Text>
  </Pressable>
}
```

Keep browser globals and DOM events in `.web.*` files. Do not import a second
renderer or deep-import NativeScript UI modules. Use `console.log` for device
logging. See the [platform services guide](https://octane-xplat.goddardai.org/platform-services)
when choosing a service or fallback.
