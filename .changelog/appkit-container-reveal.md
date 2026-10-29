### Reveal secondary row actions on AppKit

AppKit now has an experimental hover/focus source path for useContainerReveal.
Spread its props on the row and its action group. Actions keep their layout
space and remain mounted; hosts without tracking capability leave them visible.
Native hover, keyboard and accessibility behavior remain unqualified.

```tsx
import { Button, HStack, Text, useContainerReveal } from '@octane-xplat/ui'
export function FileActions() {
  const reveal = useContainerReveal()
  return <HStack {...reveal.getContainerProps()}><Text>report.pdf</Text>
    <HStack {...reveal.getContentRevealProps()}><Button label="Edit report" /></HStack>
  </HStack>
}
```

See the [row-action guide](https://github.com/octane-xplat/octane-xplat/blob/main/docs/app/components.md#media-contrast-and-row-actions).
