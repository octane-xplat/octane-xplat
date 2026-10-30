# Native interaction and accessibility

Read before changing AppKit focus, key routing, accessibility ownership, or late callbacks. These prerequisites also qualify the control-specific pages in the [task index](../primitives.md).

## Native macOS interaction

AppKit `GridList` now registers native rows for roving Tab stops, arrows,
Home/End and Enter/Space activation/selection. Use `columns` for fixed grids
and `layout="stack"` for a vertical list. Prefer `keyboardNavigationBehavior="tab"`
when cells contain interactive controls; nested controls keep their editing
keys. The component skips disabled keys in Shift+Space ranges; Shift+click
ranges remain unavailable. The custom selector-based `useGridList` hook still
reports false on AppKit. OS input, scrolling and accessibility are unqualified;
see [AppKit GridList](../../../../../docs/app/components.md#gridlist-on-appkit).

```tsx
import { GridList, Text } from '@octane-xplat/ui'

export function Choices() {
	return <GridList items={[{ id: 'one' }, { id: 'two' }]} columns={2}
		selectionMode="single" renderItem={(item) => <Text>{item.id}</Text>} />
}
```

AppKit `useKeyboard` attaches key-down/up handlers to native intrinsics or
their native ancestors. Shared View/TextInput/Pressable do not forward this
bag. Check bridge capability and preserve composing input; modifier-only events,
extended physical codes and real OS behavior remain gaps. See
[AppKit hardware keys](../../../../../docs/app/keyboard-clipboard.md#handle-hardware-keys-on-appkit)
before relying on cancellation or FocusScope coordination.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
import { useKeyboard } from '@octane-xplat/ui'

export function SearchField() {
	const keyboard = useKeyboard({ onKeyDown: (event) => {
		if (!event.isComposing) console.log(event.key, event.code)
	} })
	return <textfield accessibilityLabel="Search" {...keyboard.keyboardProps} />
}
```

AppKit `useFocusWithin` tracks first-responder containment on raw native
containers; shared `View` does not forward its bag. Check
`isSubtreeTrackingSupported`, attach to the actual ancestor, and treat separate
popup windows and app activation independently. Shared field editors resolve
to their owning controls. Physical input, IME and VoiceOver require separate target qualification.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
import { useFocusWithin } from '@octane-xplat/ui'

export function Fields() {
	const within = useFocusWithin({ onBlurWithin: () => console.log('left group') })
	return <masonview {...within.focusWithinProps}>
		<textfield placeholder="Name" />
		<textfield placeholder="Notes" />
	</masonview>
}
```

AppKit `FocusScope` implements containment/autofocus/restoration and nested
ownership when its renderer/input bridge is available. Check
`getFocusScopeCapabilities()`; capability presence is not OS-input evidence.
Nested/sibling scopes and other windows share one observer owner until its last
scope unmounts; each window retains its own active boundary. Retired callbacks
and scopes closed/disabled/replaced by an attached key handler cannot keep
navigating. Cleanup attempts all native removals once even if restoration or
one removal fails; native failure does not establish resource-release proof.
Return paths carry forward when an older scope retires before its replacement,
using saved native ancestry if the removed controls have already detached.
Use a scope for native descendants rather than adding a no-op press action
to make a box focusable. Separate popup windows and hosted editors need their
own focus owners. See [focus behavior](../../../../../docs/app/primitives.md#focus-behavior)
for the current subset and unqualified runtime cases.

```tsx
import { FocusScope, TextInput } from '@octane-xplat/ui'

export function Details() {
	return <FocusScope contain autoFocus restoreFocus accessibilityLabel="Details">
		<TextInput label="Name" />
	</FocusScope>
}
```

AppKit `useFocusVisible` now reports keyboard/mouse modality when its native
observer is available. Check `isSupported`; it is a bridge capability rather
than OS-input evidence. Prefer the subscribed hook for render readers. A
global `isFocusVisible()` read retains observation for the module's lifetime.
See [focus behavior](../../../../../docs/app/primitives.md#focus-behavior) for
cleanup and the remaining FocusScope/mobile limits.

```tsx
import { Text, useFocusVisible } from '@octane-xplat/ui'

export function InputStatus() {
	const input = useFocusVisible()
	return <Text>{input.isSupported ? input.inputModality : 'Unavailable'}</Text>
}
```

For AppKit responsive choices, use `useMediaQuery`'s
[documented native subset](../../../../../docs/app/components.md#responsive-appkit-layout).
It observes the primary host window and desktop pointer/hover traits; it does
not provide secondary-window ownership or reduced-motion queries. Actual native
resize/rendering requires separate target qualification.

```tsx
import { Text, useMediaQuery } from '@octane-xplat/ui'

export function LayoutHint() {
	const wide = useMediaQuery('(min-width: 800px)')
	return <Text>{wide ? 'Wide' : 'Compact'}</Text>
}
```

For experimental native macOS selection tracks, use the shared
`SegmentedControl` and `SegmentedControlItem` names. The AppKit leaf implements
selection and scoped arrow/Home/End handling, but OS input, focus appearance
and VoiceOver require separate target qualification. See [AppKit segments](../../../../../docs/app/components.md#appkit-segmented-control).

```tsx
import { SegmentedControl, SegmentedControlItem } from '@octane-xplat/ui'

export function ViewMode() {
	return <SegmentedControl defaultValue="list" accessibilityLabel="View">
		<SegmentedControlItem value="list" label="List" />
		<SegmentedControlItem value="grid" label="Grid" />
	</SegmentedControl>
}
```

On experimental Windows, the same names reuse the RadioList native peers: one
measured transparent RadioButton per segment, one group-owned keyboard adapter,
and Left/Right navigation that stops at the ends. Keep selection in the parent
and do not add tap handlers to segments. Icon-only segments still need `label`
because it names the native peer. Long labels may be wider than a fill segment,
and overflow handling is not yet checked. See [Windows segments](../../../../../docs/platform/windows-setup.md#segmented-choices).

```tsx
import { Icon, SegmentedControl, SegmentedControlItem } from '@octane-xplat/ui'

export function Sorting(props: { value: string; onValueChange(value: string): void }) {
	return <SegmentedControl value={props.value} onValueChange={props.onValueChange} ariaLabel="Sort">
		<SegmentedControlItem value="newest" label="Newest" />
		<SegmentedControlItem value="filter" label="Filter" isLabelHidden icon={<Icon name="xplat-funnel" />} />
	</SegmentedControl>
}
```

## Self-drawn AppKit accessibility prerequisites

The renderer now maps switch/tab/tablist/adjustable/link container roles and
numeric/selected values, honors accessible=false, and dispatches native
increment/decrement callbacks in a discrete event scope. Value/selection prop
updates post change notifications. This closes source wiring gaps, not native
VoiceOver or selector-registration qualification. Existing UI handler cases
alone did not prove that renderer bridge. See
[renderer contract](../../../../../packages/macos-renderer/README.md#self-drawn-control-accessibility).

```tsx
import { Slider, Switch } from '@octane-xplat/ui'

export function Settings() {
	return <><Switch label="Alerts" defaultValue /><Slider label="Volume" defaultValue={40} /></>
}
```


Read native enabled state through `isAccessibilityEnabled` on AppKit hosts.
The renderer exposes that exact protocol getter; `accessibilityIsEnabled` is not
its native selector. Choice/grid/scope/layer/context focus policies use the native
getter and preserve explicit disabled-card focus claims without enabling actions.
A direct call to a helper with the wrong name cannot establish AX enabled state.

```tsx
import { Button } from '@octane-xplat/ui'

export function Save() {
	return <Button label="Save" isDisabled clickAction={() => console.log('save')} />
}
```

The selector/state source case and revised focus/action fixtures require separate verification.
Native selector binding, focus, VoiceOver and packaging require separate target qualification.

## AppKit late control actions

Native click recognizers now have ownership separate from accessibility IDs.
Controls mounted disabled/read-only can install a callback later; updates reuse
one recognizer, removal disables it and teardown removes it. This repairs source
wiring, not actual native re-enable/hit-testing or lifecycle qualification. See
[click ownership](../../../../../packages/macos-renderer/README.md#update-self-drawn-click-actions).

```tsx
import { Checkbox } from '@octane-xplat/ui'

export function Choice({ saving }: { saving: boolean }) {
	return <Checkbox label="Include archived" isDisabled={saving} />
}
```
