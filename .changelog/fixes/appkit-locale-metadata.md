### Read consistent macOS locale metadata

Native AppKit root and direct locale/device imports now share dedicated leaves,
avoiding the phone Device dependency. Script-qualified tags such as `zh-Hant-TW`
now report region `TW` instead of `Hant`. Invalid or unavailable Intl metadata
falls back to English with no region. Values are snapshots taken when modules
load; native JavaScriptCore and installed-consumer qualification remain pending.

```ts
import { locale, device } from '@octane-xplat/platform'

const language = locale.language
const region = locale.region
const platform = device.os
```

See [AppKit locale metadata](https://github.com/octane-xplat/octane-xplat/blob/main/docs/platform/platform-services.md#read-appkit-locale-and-device-metadata).
