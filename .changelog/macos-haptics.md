### Haptic feedback on macOS trackpads

`@octane-xplat/haptics` now supports the AppKit host through
`NSHapticFeedbackManager`: presets play as discrete trackpad feedback on
compatible hardware. Timed `playPattern` envelopes and realtime sessions
report unsupported — `capabilities()` marks `presets: true` and
`patterns`/`realtime: false`, so gate advanced usage on the flags as
usual.

```ts
import { haptics } from '@octane-xplat/haptics'

if (haptics.supported) {
	haptics.impact('medium')
	haptics.selection()
}
```

See the [haptics package](https://github.com/octane-xplat/octane-xplat/tree/main/packages/haptics)
for the capability contract.
