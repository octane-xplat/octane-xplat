### Adjust values and ranges on native Windows

The experimental Windows Slider now uses native keyboard and value automation
input with the shared track and thumb design. It supports local defaults,
controlled values, two-thumb ranges, steps, marks and formatted readouts.

```tsx
import { Slider } from '@octane-xplat/ui'

export function PlaybackRange() {
  return <Slider label="Playback range" defaultValue={[20, 80]} step={5}
    valueDisplay="tooltip" formatValue={(value) => `${value}%`} />
}
```

Read-only controls reject changes, but the native automation read-only flag
remains incomplete. See the [Windows Slider qualification boundary](https://github.com/octane-xplat/octane-xplat/blob/main/docs/platform/windows-setup.md#slider-input).
