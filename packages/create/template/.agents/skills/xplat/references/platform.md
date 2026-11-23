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
feature you need. For the example below, run `bun add @octane-xplat/biometrics`.
Check permission and availability before requesting verification. On web,
biometrics reports `unsupported`, so the example offers a fallback.

```tsrx
import { useState } from 'octane'
import { biometrics } from '@octane-xplat/biometrics'
import { Pressable, Text } from '@octane-xplat/ui'

export function UnlockTrip() {
  const [message, setMessage] = useState('Unlock trip')
  return <Pressable onPress={async () => {
    const status = await biometrics.requestPermissions()
    if (!status.granted) {
      setMessage('Use your password instead')
      return
    }
    const verified = await biometrics.verify('Unlock your trip')
    setMessage(verified ? 'Unlocked' : 'Try again')
  }}><Text>{message}</Text></Pressable>
}
```

## Write a platform file when behavior differs

Split the file when a feature needs browser or OS APIs. Use the unsuffixed
name with the `.tsrx` extension so the checker and build can select the
implementation.
The default can use native APIs if it only runs on native. Keep host-specific
globals out of code that runs on several platforms.

```text
src/parts/Scanner.web.tsrx      browser implementation
src/parts/Scanner.mobile.tsrx   shared iOS/Android implementation
src/parts/Scanner.ios.tsrx      iOS override
src/parts/Scanner.tsrx          native default
```

```tsrx
import { Scanner } from './parts/Scanner.tsrx'

export function ScanScreen() { return <Scanner /> }
```

Expose the same names and public types from every implementation. Define
props once in a shared file and import that type in the default and all leaves.
Use a separately named helper when sibling implementations share code. An
import of `./Scanner.tsrx` from `Scanner.ios.tsrx` can resolve back to itself
in the iOS program.

## Check each platform

Keep leaves covered by their entries in `tsconfig.envs.json`. Run the app's
typecheck after changing that manifest, its source roots, or the dependencies
it resolves. Commit the regenerated `xplat-typecheck/` files and keep the
root `tsconfig.json` references pointing to them.

```sh
bun run typecheck
```

Ambient SDK declarations apply to the entire program. A shared file in the
editor normally shows one platform program's diagnostics. Use the app's
typecheck to check every configured program. See the
[editor setup guide](https://octane-xplat.goddardai.org/module-resolution#editor-project-context)
when a leaf is missing from the editor's project.

Native `.tsx` files inherit the shared types from the app config. Keep the
first-line shared pragma on `.tsrx` files that use native host elements. Import
native APIs from `@nativescript/core` and read app lifecycle state when the
handler runs. Place this example in `Status.mobile.tsrx` and supply a matching
`Status.tsrx` fallback for other targets.

```tsrx
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
