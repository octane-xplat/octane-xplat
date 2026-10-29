### Use the shared Switch with a Windows keyboard

The experimental native Windows `Switch` now accepts Tab/Space, pointer input
and Windows toggle automation while keeping the shared track and thumb.
Controlled and uncontrolled state use the existing API.

```tsx
import { Switch } from '@octane-xplat/ui'

export function Notifications() {
  return <Switch label="Notifications" defaultValue={false} />
}
```

Packaged x64 checks cover common input and state flows. Screen-reader and visual
parity checks remain open. See the [Windows qualification boundary](https://github.com/octane-xplat/octane-xplat/blob/main/docs/platform/windows-setup.md#switch-input).
