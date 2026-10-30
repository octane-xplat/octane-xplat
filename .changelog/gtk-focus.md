### Focus and keyboard hooks on GTK

GTK apps can now use the React Aria focus family from `@octane-xplat/ui`:
element `onKeyDown`/`onKeyUp`, `useFocus`, `useFocusWithin`,
`useFocusRing`, `useFocusVisible`/`isFocusVisible`, `useKeyboard`,
`useGridFocus`, and `useLandmark`.

```tsx
import { Text, useFocusVisible } from "@octane-xplat/ui"

export function ModalityHint() {
	const { inputModality, isFocusVisible } = useFocusVisible()
	return <Text>{isFocusVisible ? "keyboard focus" : inputModality}</Text>
}
```

Element-level `onKeyDown`/`onKeyUp` fire with DOM-style key names and
modifier flags from real input; `preventDefault()`/`stopPropagation()`
genuinely suppress the focused widget's own key handling. `useFocusWithin`
tracks true subtree boundaries, `useFocusRing`/`useFocusVisible` report
keyboard-vs-pointer modality (the visible ring only shows for keyboard
focus), `useKeyboard` delivers the same events through a prop bag,
`useGridFocus` gives arrow/Home/End navigation across a grid's cells, and
`useLandmark` forwards ARIA landmark roles to the GTK accessible layer.
[GTK setup and limits](https://octane-xplat.goddardai.org/linux-gtk).
