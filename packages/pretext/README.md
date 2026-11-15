# @octane-xplat/pretext

Cross-platform adapter for [Pretext](https://github.com/chenglou/pretext). It provides platform text measurement for web, iOS, Android, macOS, Linux/GTK, and Windows while re-exporting Pretext's layout APIs.

```sh
bun add @octane-xplat/pretext
```

```ts
import { layout, prepare } from '@octane-xplat/pretext'

const prepared = prepare('A paragraph that wraps across lines.', '16px system-ui')
const result = layout(prepared, 240, 24)
console.log(`${result.lineCount} lines, ${result.height}px tall`)
```

See the [text layout guide](https://octane-xplat.goddardai.org/package-pretext), the [generated API reference](https://octane-xplat.goddardai.org/api-pretext), and [Pretext's upstream caveats](https://github.com/chenglou/pretext/blob/main/README.md#caveats).
