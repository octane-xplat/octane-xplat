### AppKit interactive card links

AppKit ClickableCard now opens sanitized hrefs before its action callback.
Interactive cards host plain text children and forward variant/elevation classes.

```tsx
import { ClickableCard } from '@octane-xplat/ui'

export function Help() {
	return <ClickableCard label="Open help" href="https://example.com/help" elevation="low">Read help</ClickableCard>
}
```

Native input/URL launch/layout and disabled-card focus remain unqualified. See [AppKit cards](https://octane-xplat.goddardai.org/app/interactive-actions#appkit-card-qualification).
