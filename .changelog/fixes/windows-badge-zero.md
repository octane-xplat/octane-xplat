### Keep zero counts visible in Windows badges

Windows badges now give numeric children a native text control. A count of
zero previously disappeared. Text and numbers can also sit beside supplied
components.

```tsx
import { Badge } from '@octane-xplat/ui'

export function PendingCount() {
  return <Badge>{0}</Badge>
}
```

[Windows Badge guide](https://github.com/octane-xplat/octane-xplat/blob/main/docs/platform/windows-setup.md#badge-text-candidate)
