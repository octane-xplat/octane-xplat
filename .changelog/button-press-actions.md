### Button effects and asynchronous press actions

Use `onPress` for immediate changes such as opening a panel or updating local state. Use the renamed `pressAction` for Promise-returning work; Button manages its loading state and reports failures through `onActionError`. `IconButton` follows the same contract. `clickAction` is removed without an alias.

```tsx
import { Button } from '@octane-xplat/ui'

export function EditorActions(props: { close(): void; save(): Promise<void> }) {
  return <>
    <Button label="Close" onPress={props.close} />
    <Button label="Save" pressAction={props.save} />
  </>
}
```

When both callbacks are supplied, `onPress` runs first. Its event's `preventDefault()` skips navigation and the asynchronous action. Disabled or blocked buttons run neither callback. Toggle buttons keep `onPressedChange` for immediate changes and require a Promise from `pressedChangeAction` for managed saves. See [button effects and actions](https://octane-xplat.goddardai.org/interactive-actions#button-states-and-actions).
