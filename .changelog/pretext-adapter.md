### Measure and wrap text with Pretext

Use `@octane-xplat/pretext` to find a paragraph’s line count and height before drawing it, for example when sizing list rows. The adapter uses the target’s own fonts and measurements on web, iOS, Android, and experimental macOS, Linux GTK, and Windows. A separate `rich-inline` entry handles mixed fonts and inline objects.

```ts
import { layout, prepare } from '@octane-xplat/pretext'

const paragraph = prepare('A paragraph that wraps across lines.', '16px system-ui')
const { lineCount, height } = layout(paragraph, 220, 24)
console.log(lineCount, height)
```

[Pretext setup and font limits](https://octane-xplat.goddardai.org/package-pretext)
