### AppKit focus-within tracking

AppKit can now track focus entering and leaving a group of native controls with
`useFocusWithin`. Attach its handlers to a raw native container; moving between
its fields keeps the group focused.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
import { useFocusWithin } from '@octane-xplat/ui'

export function Details() {
	const within = useFocusWithin({ onFocusWithinChange: (inside) => console.log(inside) })
	return <masonview {...within.focusWithinProps}>
		<textfield placeholder="Name" />
		<textfield placeholder="Notes" />
	</masonview>
}
```

`isSubtreeTrackingSupported` reports native observer availability. Shared `View`
does not forward these handlers. AppKit runtime qualification remains pending;
see [focus behavior](https://octane-xplat.goddardai.org/app/primitives#focus-behavior).
