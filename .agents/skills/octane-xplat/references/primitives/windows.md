# Experimental Windows controls

Read only for the NativeScript Windows host. These control contracts depend on the pinned Windows preview and do not establish OS-input or packaged-app qualification. Start with the [shared primitive contracts](contracts.md).

## Experimental Windows controlled text

Keep controlled values on the shared TextInput/TextArea/SearchInput API.
The Windows text-write leaf attempts to preserve TextBox selection, clamps
ranges after shrink, suppresses synchronous write echoes, and avoids restoring
selection on a replaced native view or after a nested newer write. PasswordBox
uses the plain guarded write. Do not bypass this helper with direct native Text
assignments in shared components.

```tsx
import { useState } from 'octane'
import { TextInput } from '@octane-xplat/ui'

export function DisplayName() {
  const [name, setName] = useState('Ruby')
  return <TextInput label="Display name" value={name} onChange={setName} />
}
```

A bounded x64 packaged WinUI run passed physical typing/submit, public isolated
blur/focus, an OS-selected range retained across a controlled prop write,
readonly/disabled rejection, multiline Enter and consumed raw Return. IME,
editable secure fields, remount/lifecycle and multiple-window behavior remain
unqualified. Modal focus is tracked separately. See the
[Windows record](../../../../docs/parity/windows-support-progress.md).

The experimental Windows core patch has a raw key-event prerequisite. Its
nativeEvent/consumption payload is not the portable KeyboardEvent contract;
portable hardware-key support stays disabled until normalization is implemented
and the adapter is qualified. Do not turn source/mocked dispatch into a claim
that menus, dialogs, IME or OS focus work. The
[Windows key record](../../../../docs/exploration.md#operational-evidence)
tracks source, adoption and native gates separately.

Windows useLayer selects a dedicated NativeScript leaf using Popover/RootLayout
and the native portal. Keep it independent of the AppKit showLayer host. Anchored
presentation needs the declaring Screen/RootLayout; fixed/custom layers also use
that owner. The Windows focus-return leaf captures the declaring XamlRoot and
skips inactive/hidden windows, foreign roots and removed/disabled targets. Keep
Popover's anchor and fixed-layer sentinel as getHost inputs; do not fall back
from an unattached supplied host to the primary window. It installs no Escape
listener or focus trap. Source resolution and mocked focus-return contracts are
checked; actual WinUI geometry, context, dismissal, focus and Tab/IME behavior
are unqualified. Mobile and AppKit implementations remain separately owned. See
the [Windows layer boundary](../../../../../docs/platform/windows-setup.md#floating-layer-candidate).

```tsx
import { Button, Text, useLayer } from '@octane-xplat/ui'

export function LayerTrigger() {
  const layer = useLayer({ mode: 'context', lightDismiss: true })
  return <>
    <Button label="Details" ref={layer.ref} clickAction={layer.show} />
    {layer.render(<>
      <Text>Packing details</Text>
      <Button label="Close" clickAction={layer.hide} />
    </>, { placement: 'below' })}
  </>
}
```

## Experimental Windows Switch

The Windows leaf preserves the shared track and thumb and uses a transparent
WinUI ToggleButton for focus, Space and TogglePattern. Keep the shared API;
do not replace it with a stock Windows widget to add keyboard input.

```tsx
import { Switch } from '@octane-xplat/ui'

export function Notifications() {
	return <Switch label="Notifications" defaultValue={false} />
}
```

The preview projects `IsChecked` as `IReference<Boolean>`, not a JS boolean.
The adapter uses native Checked/Unchecked events and pauses its own delegates
during model writes. It keeps rejected/read-only requests under the model's
control. The input uses measured track dimensions: auto/stretch produced empty
bounds, and the renderer's local position default overrides CSS. Keep these
workarounds visible in the [Windows progress note](../../../../docs/parity/windows-support-progress.md).
Shared-component pointer, Tab/Space, TogglePattern, state, async rollback and
remount checks passed in packaged x64 WinUI. Keep the wider
[Windows qualification boundary](../../../../../docs/platform/windows-setup.md#switch-input).

## Experimental Windows CheckboxInput

The Windows Checkbox leaf keeps the shared indicator registry and supplies a
transparent WinUI CheckBox input. The public root name remains CheckboxInput:

```tsx
import { CheckboxInput } from '@octane-xplat/ui'

export function SelectItems() {
	return <CheckboxInput label="Select items" defaultValue="indeterminate" />
}
```

Clear native minimum sizes even with a replacement template. Enable
IsThreeState while the model is mixed so UIA reports it; keep ordinary
activation binary and normalize requests leaving mixed state to true. The
adapter shares Switch's measured-input and owned-delegate write workarounds.
Direct nullable IsChecked writes failed mixed-state checks in the preview;
write null through DependencyObject.SetValue(IsCheckedProperty,null). The
packaged x64 input/state/mixed/geometry/remount checks pass. Keep the
[Windows qualification boundary](../../../../../docs/platform/windows-setup.md#checkbox-input)
and the separate [list qualification](#experimental-windows-checkbox-lists).

## Experimental Windows checkbox lists

Use the public group and child-part APIs for native Windows checkbox lists;
selected string values belong to the group:

```tsx
import { CheckboxList, CheckboxListItem } from '@octane-xplat/ui'

export function Channels() {
  return <CheckboxList ariaLabel="Channels" defaultValue={['email']}>
    <CheckboxListItem value="email" label="Email" />
    <CheckboxListItem value="sms" label="Text message" />
  </CheckboxList>
}
```

The Windows group imports Checkbox through its unsuffixed basename, so option
rows select the native input leaf. Child items use the same input and observe
context changes. For standalone isChecked/onCheck and select-all, use the
[complete group example](../../../../../docs/platform/windows-setup.md#checkbox-lists).
Windows useMeasure waits for native LayoutUpdated after same-size reattachment.
NativeScript load can report transient zero bounds without a later SizeChanged. A timer queued
only by load failed repeated native pointer trials. Keep the typed WinRT
delegate, deferred reads and shared-reader cleanup. The preview has one JS
handler slot per native event; useMeasure owns LayoutUpdated on measured views
and rejects an existing unmanaged JS handler instead of replacing it.

Packaged x64 pointer/Tab/Space, TogglePattern, group/default/mixed select-all,
guards, context updates and remount checks are bounded evidence. Keep full
Field/props, group announcements, Narrator/visual and consumer qualification
open; see [Windows list limits](../../../../../docs/platform/windows-setup.md#checkbox-lists)
and the [timing evidence](../../../../docs/exploration.md#operational-evidence).

## Experimental Windows Slider

Use the shared root Slider with `label` for a scalar or two-thumb range.
The Windows leaf preserves controlled ownership, resolves inherited Field guards,
and snaps positive steps relative to the full-domain minimum. Marks and readouts
are shared drawing; transparent WinUI Slider peers supply keyboard/RangeValue
behavior. `SliderProps` has no `testID` or `accessibilityLabel` prop.

```tsx
import { Slider } from '@octane-xplat/ui'

export function RangeSettings() {
  return <Slider label="Playback range" defaultValue={[20, 80]} step={5}
    valueDisplay="tooltip" formatValue={(value) => `${value}%`} />
}
```

Contributors: keep cumulative pan on the measured parent and use raw touch X
for nearest-thumb selection. Native input peers are excluded from hit-testing;
focus the selected peer on press and restore it in a cancellable native zero-delay
task after release. Core UI dispatch executes inline there. The preview rejects
JS `DispatcherQueueHandler` delegates for missing IAgileObject; do not replace
the native timer with that unqualified projection. SDK focus readers return null
in the bounded probe, so the restoration guard also checks same-root native
FocusState throughout the declaring View tree. Cancel on another press,
configuration changes and unmount; reject disabled/unloaded/replaced/root-changed
peers. Packaged x64 checks pass the bounded keyboard, automation, drag, release-focus,
marks/readout and remount flows. Read-only guards reject
changes, but native RangeValue still reports IsReadOnly=false. Keep the complete
Field/props, hosted-focus races, Narrator/visual and consumer matrices open;
see [Windows Slider limits](../../../../../docs/platform/windows-setup.md#slider-input).

## Experimental Windows Dialog

Keep Dialog's Windows lifetime separate from generic `useLayer` qualification.
A bounded packaged run passed initial focus, repeated Tab containment,
background focus exclusion, raw Escape dismissal, explicit `finalFocusRef`
return and default trigger return. Required dialogs, nesting, multiple windows,
IME and visual/layout parity require separate target qualification. These assertions do not enable the
portable keyboard API. Render the declaration beneath `Screen` and pass an
explicit return ref when a specific control should regain focus:

```tsx
import { Dialog, Text, type DialogProps } from '@octane-xplat/ui'

export function ReviewNotice({ isOpen, onOpenChange, finalFocusRef }: DialogProps) {
  return <Dialog isOpen={isOpen} onOpenChange={onOpenChange} finalFocusRef={finalFocusRef}>
    <Text>Close this notice to continue editing.</Text>
  </Dialog>
}
```

The Windows host can expose the scoped snapshot through the C# overload name
rather than its WinRT metadata name. Always supply the declaring XamlRoot,
reject a foreign returned element, and recheck activation/target ownership at
restoration. Missing snapshots must not discard an explicit target. Windows
modal background guards and focus return wait for actual native close completion;
removed portal content alone does not mean the exiting backdrop has left. See the
[modal example and current gates](../../../../../docs/platform/windows-setup.md#modal-candidate)
and [Windows evidence](../../../../docs/parity/windows-support-progress.md).

## Experimental Windows scroll observation

Windows useScrollableArea composes scroll, viewport/content layout and
load/unload handlers. Spread both getters to observe content growth, preserve
caller refs/handlers, and obtain current edge state inside a scroll callback.
Configure native viewport dimensions and orientation separately; axis filters
the measured state. Keyboard access, overscroll chaining, sticky containment
and RTL semantics are not added by this observer.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
// CustomViewport.windows.tsx — classes are defined by the app stylesheet.
import { Text, useScrollableArea } from '@octane-xplat/ui'

export function CustomViewport() {
  const area = useScrollableArea({ axis: 'block' })
  return <scrollview {...area.getViewportProps({ className: 'notes-viewport', orientation: 'vertical' })}>
    <masonview {...area.getContentProps({ className: 'notes-content' })}>
      <Text>Packing notes</Text>
    </masonview>
  </scrollview>
}
```

Alongside the scripted hook/metric regressions, a bounded x64 packaged WinUI
run passed physical wheel input for ScrollableArea and this headless observer:
actual offsets advanced from 0 to 72 with content/viewport metrics 816/160,
and the hook reported overflow with atStart becoming false. Resize/content
mutation, unsubscribe/remount, horizontal/RTL and broader compiler/lifecycle
behavior require separate target qualification. The initial run logged a loaded-event transaction
warning; a later run passed after load publication was deferred, without that
warning. Keep the wider Windows gate pending; use the
[complete example and boundary](../../../../../docs/platform/windows-setup.md#custom-scroll-viewport-candidate).

## Experimental Windows RadioList

Use the shared root exports for exclusive settings choices. Options and child
parts share one Windows group; keep controlled selection in the parent. Do not
attach a second tap handler to emulate radio activation: the measured native
peer owns keyboard, pointer and selection automation input.

```tsx
import { RadioList, RadioListItem } from '@octane-xplat/ui'

export function DeliveryMethod() {
  return <RadioList ariaLabel="Delivery" defaultValue="email">
    <RadioListItem value="email" label="Email" />
    <RadioListItem value="sms" label="Text message" />
  </RadioList>
}
```

Windows uses shared Mason row layout and native RadioButton peers with a
framework group keyboard adapter. Registration order does not define navigation;
the live Core view tree does. This is experimental support, and the complete
Field/props, Narrator/visual and consumer matrices remain open. Read the
[Windows radio boundary](../../../../../docs/platform/windows-setup.md#radio-choices)
before broadening platform claims.

## Experimental Windows actions

Use the shared action exports. Windows places native Button/HyperlinkButton
peers over the shared drawing; their Click event owns keyboard, mouse and
Invoke activation. Do not add another tap listener to the drawing. An explicit
accessibility label overrides the name collected from the rendered text.

```tsrx
import { Button, Pressable, Text } from '@octane-xplat/ui'

export function Actions() @{
  <>
    <Button clickAction={() => console.log('Saved')}>Save</Button>
    <Pressable accessibilityLabel="Refresh" onPress={() => console.log('Refreshed')}>
      <Text>Refresh</Text>
    </Pressable>
  </>
}
```

Native Link normalizes primitive children into a text host. Keep custom `as`
or LinkProvider adapters as compiled function components and preserve their
link semantics; the adapter owns navigation:

```tsrx
import { Link, type LinkProps } from '@octane-xplat/ui'

export function HelpLink(props: { routerLink: LinkProps['as'] }) @{
  <Link as={props.routerLink} href="/help">Help</Link>
}
```

The
[Windows action guide](../../../../../docs/platform/windows-setup.md#buttons-and-links)
shows the injection contract. The packaged checks are bounded x64 evidence;
the final clean-main core20, full props, Narrator and visual gates remain open.

## Experimental Windows Banner

Use the shared Banner for Windows notices. Its dismiss and Details controls
select the Windows action leaf; keep that ownership when extending the
component instead of adding label tap handlers:

```tsx
import { Banner } from '@octane-xplat/ui'

export function SavedNotice() {
  return <Banner title="Changes saved" description="Your draft is ready." isDismissable />
}
```

The [Windows Banner guide](../../../../../docs/platform/windows-setup.md#banner-candidate)
separates compiled content/lifecycle coverage from pending packaged input,
geometry, Narrator and visual qualification.
