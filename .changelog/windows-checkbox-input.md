### Use CheckboxInput with a Windows keyboard

The experimental native Windows `CheckboxInput` now accepts Tab/Space, pointer
input and Windows toggle automation while keeping the shared indicator and
label. Mixed state is exposed to automation and activation requests `true`.

```tsx
import { CheckboxInput } from '@octane-xplat/ui'

export function SelectItems() {
  return <CheckboxInput label="Select items" defaultValue="indeterminate" />
}
```

Packaged x64 checks cover common input and state flows. List/group behavior,
screen-reader and visual parity remain open. See the [Windows qualification boundary](https://github.com/octane-xplat/octane-xplat/blob/main/docs/platform/windows-setup.md#checkbox-input).
