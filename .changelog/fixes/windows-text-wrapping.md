### Wrap Windows text inside constrained layouts

Windows `Text` now keeps the correct width in start/center-aligned columns and
shrinking rows. Previously, a label could overflow its container or report a
narrower column width than web. The Windows harness adopts MasonKit
`1.0.0-beta.129` with the measurement repair.

```tsrx
import { Text, View } from '@octane-xplat/ui'

export function WrappedNote() @{
  <>
    <style>
      .note-row { display: flex; width: 220px; flex-direction: row; }
      .note-copy { font-size: 14px; line-height: 20px; flex-shrink: 1; }
    </style>
    <View className="note-row">
      <Text className="note-copy">
        Shared typography should wrap within the available space.
      </Text>
    </View>
  </>
}
```

The verified setup remains the private x64 Windows harness. See
[Windows text wrapping and limits](https://github.com/octane-xplat/octane-xplat/blob/main/docs/platform/windows-setup.md#text-wrapping).
