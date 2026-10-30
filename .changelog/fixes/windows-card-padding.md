### Apply requested padding inside Windows cards

Windows cards now apply their requested padding instead of retaining the theme
inset. Plain text and numeric content also use native text controls in the
header, body and footer.

```tsx
import { Card } from '@octane-xplat/ui'

export function Summary() {
  return <Card padding={2} header="Pending">{0}</Card>
}
```

[Windows Card guide](https://github.com/octane-xplat/octane-xplat/blob/main/docs/platform/windows-setup.md#card-padding-candidate)
