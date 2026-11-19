### Separate immediate button presses from async actions

**Breaking change**

Replace `clickAction` with `pressAction` for work that returns a promise, such as saving to a server. `Button` and `IconButton` show a loading state during the action and pass failures to `onActionError`. Use `onPress` for immediate changes such as closing a panel.

```tsx
import { Button } from '@octane-xplat/ui'

export function EditorActions(props: { close(): void; save(): Promise<void> }) {
  return <>
    <Button label="Close" onPress={props.close} />
    <Button label="Save" pressAction={props.save} />
  </>
}
```

When both callbacks are supplied, `onPress` runs first. Call `event.preventDefault()` there to skip navigation and the async action. For toggle buttons, use `onPressedChange` for immediate updates and return a promise from `pressedChangeAction` for managed saves.

[Button states and actions](https://octane-xplat.goddardai.org/interactive-actions#button-states-and-actions).
