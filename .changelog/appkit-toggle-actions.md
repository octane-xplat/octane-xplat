### AppKit toggle-button save actions

AppKit ToggleButton now shares Button's busy/action handling and inherited props.
Save actions show pending state, block duplicates and report errors while keeping
the optimistic choice. Group members retain group-owned selection.

```tsx
import { ToggleButton } from '@octane-xplat/ui'

export function Pin({ save }: { save(pressed: boolean): Promise<void> }) {
	return <ToggleButton label="Pin" pressedChangeAction={save} />
}
```

Pressed native accessibility, input and layout remain unqualified. See
[toggle saves](https://octane-xplat.goddardai.org/app/components#save-a-toggle-button-action-on-appkit).
