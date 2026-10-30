### Show complete notices on Windows

Windows banners now include their title, supporting text and trailing action.
Dismissal removes the notice, and the Details button expands its body. The
Windows target remains experimental.

```tsx
import { Banner, Text } from '@octane-xplat/ui'

export function SavedNotice() {
  return <Banner title="Changes saved" description="Your draft is ready." isDismissable>
    <Text>You can continue editing.</Text>
  </Banner>
}
```

[Windows Banner guide](https://github.com/octane-xplat/octane-xplat/blob/main/docs/platform/windows-setup.md#banner-candidate)
