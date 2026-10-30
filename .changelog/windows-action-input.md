### Use native action input on Windows

Button, Pressable and Link now use native focus and activation in the
experimental Windows host. Link's text children also render inside a native
text host.

```tsrx
import { Button, Link, Pressable, Text, VStack } from '@octane-xplat/ui'

export function Actions() @{
  <VStack width="100%" gap={2}>
    <Button clickAction={() => console.log('Saved')}>Save</Button>
    <Pressable accessibilityLabel="Refresh" onPress={() => console.log('Refreshed')}>
      <Text>Refresh</Text>
    </Pressable>
    <Link href="https://example.com/help">Help</Link>
  </VStack>
}
```

Packaged x64 keyboard, mouse and UI Automation checks passed. External URL
launching, Narrator and visual review were not part of that run. See the
[Windows action boundary](https://github.com/octane-xplat/octane-xplat/blob/main/docs/platform/windows-setup.md#buttons-and-links).
