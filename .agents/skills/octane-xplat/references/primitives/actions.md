# Action controls and feedback

Use for button actions, interactive cards, toolbar focus, and busy feedback. Apply the [native interaction prerequisites](accessibility.md) for AppKit.

## AppKit busy feedback

Spinner now forwards named sizes, text/node labels, contrast, accessible names,
class/style forms and busy=false removal. Switch shows a compact ring while
saving or externally loading. AppKit-specific rotation now uses the existing
renderer keyframe sampler; reduced-motion rules leave the ring steady. Workspace
display-option notifications queue media refresh. This is a source path, not
proof of playback or OS notification delivery; layout, clipping, contrast and
accessibility are unqualified. See
[busy feedback](../../../../../docs/app/components.md#busy-feedback-on-appkit).

```tsx
import { Spinner } from '@octane-xplat/ui'

export function Saving() {
	return <Spinner size="sm" label="Saving settings" />
}
```


AppKit ProgressBar subscribes to theme changes and preserves object/array/CSS
styles with authored overrides. It forwards declared accessible/name/hint/value
props. Indeterminate mode skips the formatter, readout, marks and numeric AX
range/value, and sets busy state; disabled state is separate. Its unknown fill
now selects AppKit sliding keyframes and clips to the track; reduced-motion
rules leave it steady, and determinate mode removes the animation class.
Native animation/preference delivery, theme presentation, layout and VoiceOver are
unqualified; do not infer them from mounted metadata.

```tsx
import { ProgressBar } from '@octane-xplat/ui'
export function Upload({ percent }: { percent?: number }) {
	return <ProgressBar label="Upload" value={percent} isIndeterminate={percent === undefined}
		hasValueLabel accessibilityHint="Keep the app open" style="width:240px" />
}
```

AppKit Meter root/purpose/ProgressGroup paths now use one leaf. It preserves
caller children, the existing unfilled track and authored style forms; numeric
accessibility uses shared normalized finite bounds. Invalid/nonpositive size
uses 24; nonfinite stroke width uses 3 and finite width clamps to size. Value
arc/color remain gaps; do not infer a filled gauge or native AX proof.

```tsx
import { Meter, Text } from '@octane-xplat/ui'
export function Storage() {
	return <Meter value={6} maxValue={10} size={48} accessibilityLabel="Storage">
		<Text>6 GB</Text>
	</Meter>
}
```

## AppKit action keys and shortcuts

Self-drawn action hosts now reserve Enter/Space activation for unmodified or
Shift-only keys. Control/Option/Command combinations, disabled/read-only
accessibility state and absent actions pass through native key handling. This
is source behavior, not proof of OS shortcuts/menu equivalents or input-source
switching. See [native activation](../../../../../packages/macos-renderer/README.md#self-drawn-control-keyboard-activation).

```tsx
import { Button } from '@octane-xplat/ui'

export function Save({ save }: { save(): void }) {
	return <Button label="Save" clickAction={save} />
}
```

## AppKit button actions and links

Use the dedicated AppKit Button leaf (re-exported by controls). It wraps primitive
children, forwards inherited Pressable props and preserves content while busy.
Noninterruptible actions acquire a synchronous ownership token; interruptible
overlap stays busy until all calls settle. Group/explicit disablement always
wins. Held presses read current props/group/loading/interruptibility and active
tokens rather than rendered pending state. Claim before URL dispatch; accepted
calls retain their action/error pair across props/ref replacement or teardown.
Ref handoff preserves pending tokens; detached presses are inert. URL opener
throws release the claim and propagate without invoking the action. Action or
then-access errors use the captured onActionError, and unmount stops pending UI
writes while accepted app work and its failure reporting continue.

```tsx
import { Button } from '@octane-xplat/ui'

export function Save({ save }: { save(): Promise<void> }) {
	return <Button label="Save" clickAction={save} />
}
```

Button href is sanitized and handed to the platform opener before clickAction.
It does not use the router; target has no native browsing-context behavior.
Native URL opening/input/VoiceOver/busy geometry require separate target qualification.
Focus-triggered tooltip presentation is still missing. Button tooltip now assigns the
native NSView.toolTip pointer hint, updates/removes on props and clears on
teardown. Keep it while busy/disabled without changing label/accessibilityHint;
AppKit owns timing and appearance. IconButton/ToggleButton inherit it. Native
hover delivery, focus and AX semantics require separate target qualification. See the [source contract](../../../../../docs/app/components.md#appkit-button-actions-and-links).

```tsx
import { Button } from '@octane-xplat/ui'

export function Help() { return <Button href="https://example.com/help" tooltip="Read help">Help</Button> }
```


IconButton.macos is a thin wrapper around Button.macos with isIconOnly, matching
the shared native shape. Use the Button contract for pending/overlap/errors,
group defaults, metadata and href. Native pointer-hint presentation/input/VoiceOver
qualification is still open; focus-triggered tooltips remain a gap.

```tsx
import { IconButton } from '@octane-xplat/ui'

export function Share({ share }: { share(): Promise<void> }) {
	return <IconButton label="Share document" icon="share" clickAction={share} />
}
```

## AppKit toggle-button saves

ToggleButton delegates to the target Button action owner, so loading, errors,
overlap, metadata and teardown follow that leaf. Standalone uncontrolled choice
flips optimistically before onPressedChange/pressedChangeAction. Rejection
reports onActionError without rollback; controlled isPressed still follows the
parent. Local intent is separate from controlled/group display; an accepted
Button callback uses its captured controlled value across URL-driven parent
updates and preserves local intent across mode changes. A throwing
onPressedChange retains the local flip, skips the save and uses Button's error
path. Group value membership ignores member save actions.

```tsx
import { ToggleButton } from '@octane-xplat/ui'

export function Pin({ save }: { save(value: boolean): Promise<void> }) {
	return <ToggleButton label="Pin" pressedChangeAction={save} />
}
```

Pressed button state maps to native checked-control role/value and changed-value
notifications. Source cases/fixture require separate verification; native VoiceOver,
input, busy geometry, focus-triggered tooltip, reserved semibold width and group/toolbar roving
require separate target qualification or absent. See [toggle saves](../../../../../docs/app/components.md#save-a-toggle-button-action-on-appkit).

## AppKit interactive cards

ClickableCard sanitizes href and calls the platform opener before onPress;
URL-bearing cards expose a link role, callback-only cards a button role.
Both interactive cards use TextSlot for primitive children and forward
variant/elevation classes. SelectableCard remains controlled. Native appearance,
URL launch and nested-control gesture arbitration require separate target qualification; disabled
SelectableCard now retains focus eligibility through the renderer bridge while
keeping activation blocked and disabled semantics intact. Actual Tab/VoiceOver
qualification remains open; native target browsing contexts
are not implemented. See [cards](../../../../../docs/app/interactive-actions.md#appkit-card-qualification).

```tsx
import { ClickableCard } from '@octane-xplat/ui'

export function Help() {
	return <ClickableCard label="Open help" href="https://example.com/help" elevation="low">Help</ClickableCard>
}
```


Disabled-card focus uses a reference-counted renderer claim, released on enablement
or detach, without adding an action. FocusScope honors explicit native key-view
eligibility while still excluding disabled native fields, hidden views and Tab
suppression. Hosts missing retainDisabledFocus keep the ordinary disabled focus
behavior; do not infer qualification from bridge presence alone.

```tsx
import { SelectableCard } from '@octane-xplat/ui'

export function UnavailablePlan({ selected, onChange }: { selected: boolean; onChange(value: boolean): void }) {
	return <SelectableCard label="Team plan" isSelected={selected} isDisabled onChange={onChange}>Unavailable</SelectableCard>
}
```

## AppKit Toolbar action focus

Use Toolbar's label and stable start/center/end slots for contextual actions.
Its AppKit role maps to AXToolbar without making the container an action or Tab
target. A private owner discovers discrete native button/link/checkbox/radio
hosts in current child order and reuses choice focus for roving Tab exclusions.
Horizontal Left/Right, vertical Up/Down and Home/End move focus manually; keys
never toggle or press a control. Current window updates refresh hidden/disabled/
removed/reordered actions, and orientation changes retain slot/component state.
The host exposes the current horizontal/vertical accessibility axis; native AX
queries and VoiceOver announcements require separate target qualification.
Modifiers, composition, prevented events and nested key reentry are ignored.
Editors, adjustable controls and nested composites retain their own keys/Tab
stops; mixed toolbars can have additional Tab stops. Physical order follows the
web helper's key direction; native RTL visual behavior requires separate target qualification.

```tsx
import { Button, Toolbar } from '@octane-xplat/ui'

export function Actions() {
	return <Toolbar label="Page actions" orientation="horizontal"
		startContent={<Button label="Save" />} endContent={<Button label="Share" />} />
}
```

The focus path requires keyboard/Tab-suppression capability and a captured window
observer; absent capability preserves natural focus. Scope/observer/Tab claims
retire before teardown effects, late handles release their own owner, removal
failures log fixed diagnostics and cleanup attempts remaining leases. Native
release is best effort. This covers self-drawn action hosts; complete mixed-
control roving and stock native-control Tab suppression remain
implementation gaps. Native ref/BOOL/window/key/Tab/selection/AX, RTL/pixels and
installed behavior require separate target qualification. See [toolbar actions](../../../../../docs/app/navigation-ui.md#add-toolbar-actions-and-responsive-overflow).
