### Move between AppKit screen regions

AppKit useLandmark now has an experimental F6/Shift+F6 source path within the
current window and containing FocusScope. Native key delivery, focus, scrolling
and accessibility remain unqualified.

```tsx
import { TextInput, VStack, useLandmark } from '@octane-xplat/ui'
export function SearchRegion() {
  const { landmarkProps } = useLandmark({ role: 'search', label: 'Document search' })
  return <VStack {...landmarkProps}><TextInput label="Search" /></VStack>
}
```

AppKit follows native view order; web registration order can differ. Hosts
without the required bridge keep role/label forwarding. See the
[region guide](https://github.com/octane-xplat/octane-xplat/blob/main/docs/app/navigation-ui.md#move-between-appkit-screen-regions).
