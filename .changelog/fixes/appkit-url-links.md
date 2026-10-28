### Open AppKit external links through the system

AppKit URL links now use the platform opener instead of the app-window creation
hook. Link also wraps plain text in a native label and honors function components
from LinkProvider or as.

```tsx
import { Link } from '@octane-xplat/ui'

export function Help() { return <Link href="https://example.com/help">Read help</Link> }
```

Native launch, input, VoiceOver and appearance remain unqualified. See
[AppKit links](https://octane-xplat.goddardai.org/app/navigation#open-links-on-appkit).
