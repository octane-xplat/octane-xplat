### AppKit interactive card links

AppKit ClickableCard now opens sanitized hrefs before its action callback.
Interactive cards host plain text children and forward variant/elevation classes.

```tsx
import { ClickableCard } from '@octane-xplat/ui'

export function Help() {
	return <ClickableCard label="Open help" href="https://example.com/help" elevation="low">Read help</ClickableCard>
}
```

Native input/URL launch/layout remain unqualified; disabled-but-focusable
SelectableCard behavior remains missing. See [AppKit cards](https://octane-xplat.goddardai.org/app/interactive-actions#appkit-card-qualification).
