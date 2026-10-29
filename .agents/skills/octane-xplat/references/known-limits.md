# Limits and evidence

Before promising behavior, read the relevant entries in the
[public known limits](../../../../docs/testing/known-limits.md) and the feature's
guide. That page owns consumer-facing support boundaries; do not treat this
skill as a duplicate support matrix. Match guidance to the installed package
version and check each entry's evidence/version stamp.

A typechecked export or successful build proves a different claim from a
running platform assertion. Object-driver tests do not establish OS input,
hit-testing, accessibility, or pixel parity. Follow [testing](testing.md) when
choosing checks and report only the targets actually run.

For a boundary or workaround investigation, read the applicable internal record:

- [Portal ownership](../../../docs/notes/portal-boundaries.md): independent-root
  fallbacks, platform exceptions, owner lifetime, and qualified fixtures.
- [Mason cutover](../../../docs/notes/masonkit-layout-evaluation.md): native
  layout implementation, migration boundaries, and remaining qualification gaps.
  Check the native artifact revision: a source fix reaches an app only after
  rebuilt artifacts are adopted. The [shared FontManager correction](../../../docs/notes/masonkit-layout-evaluation.md#shared-fontmanager-in-core-beta3)
  replaces core beta.2's conflicting iOS font packaging. Follow the
  [managed plugin and rebuild guidance](toolchain.md) when updating an app.
  Core beta.4 regressed Android nested-root shrinking; beta.5 corrects it.
  The [beta.5 qualification](../../../docs/notes/masonkit-layout-evaluation.md#nested-roots-and-ios-measurement)
  distinguishes the passing height/Android-width cases from an unresolved iOS
  inner-stage width report. Do not infer width parity from height checks.
- [AppKit verification](../../../docs/appkit-verification.md): geometry and
  lifecycle evidence, including CSS positioned edges after the layout cutover.
- [GTK UI parity](../../../docs/notes/linux-gtk-ui-parity.md): every native root export, source candidates versus runtime evidence, current work order and the task-local MasonCore build prerequisite. Follow the curated GTK barrel; a successful bundle does not qualify an omitted component.
- [Upstream limitations](../../../docs/upstream-limitations.md): how to verify
  and record upstream scope and local workarounds.
- [NativeScript runtimes: V8 without ICU](../../../docs/notes/nativescript-no-icu.md):
  NativeScript iOS/Android V8 lacks ICU — no built-in `Intl`, no `\p{…}` regexes (a
  literal fails its whole module at parse time), no normalization. Lingui,
  RollingText and internal Motion text segmentation initialize their own required
  Intl APIs on mobile; UI remains optional. See [leaf ownership](services/localization.md#leaf-owned-intl-initialization).

Uncharacterized lab flakes belong with their investigation records and Silo,
not in an undated skill list. A historical failure is not automatically a
current limitation, and a fixed fixture is not blanket platform qualification.

## Install the experimental Linux GTK renderer

After its first stable automated release, npm consumers install the optional renderer
at the same Xplat release. The `0.0.1` bootstrap stub is not usable. No Mason
binary ships: the default warns and uses approximate Gtk.Box layout; native
Mason needs a separately pinned host build. Use the [GTK guide](../../../../docs/platform/linux-gtk.md)
and [native setup](../../../../packages/linux-gtk-renderer/README.md#optional-native-layout).
Do not treat publication or AT-SPI names as production qualification.

```sh
bun add -D @octane-xplat/linux-gtk
bun run xplat workshop doctor
### GTK keyboard actions

Give a GTK Pressable accessibilityRole="button" for Return/Space activation, or
"link" for Return. A neutral gesture view adds no focus stop. Disabled controls
use native sensitivity; focus loss cancels held-key activation. Changing the
role replaces the native widget through the core's host recreation protocol;
keep refs current and do not retain a native widget across a role change. Child
widgets and their logical owners are retained. Other semantic roles and AT-client
behavior remain unqualified.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
import { Pressable, Text } from '@octane-xplat/ui'

export function SaveAction(props: { disabled: boolean; save: () => void }) {
	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel="Save"
			disabled={props.disabled}
			onPress={props.save}
		>
			<Text>Save</Text>
		</Pressable>
	)
}
```

### GTK retained visibility

Use display:none to remove a retained subtree from native mapping and layout.
Dropping it restores the default flex display. Native visibility:hidden keeps
layout space; collapse removes it. Style visibility overrides the direct
visibility prop, while visible=false or display:none still hides the widget.
The renderer owns the private TextView host for these writes. Preserve this
synchronization when changing layout: computed zero-size Mason bounds alone
can leave native descendants mapped at their old allocation. Maintained
visibility checks cover geometry, editor identity/text and focus release;
they do not establish OS input or screen-reader navigation.

### GTK text input

Use TextInput, TextArea and SearchInput from the curated GTK root. They have maintained
Linux checks. TextInput clear/help/status affordances retain its editor.
Keep width on the outer field owner and use the GTK status-variant policy
for hover/focus tooltips. Field, FormLayout, InputGroup, InputGroupText,
FieldGroup and useFieldControl are curated too. Their native metadata, geometry
and lifecycle checks do not qualify AT-client output or a complete
keyboard/overlay workflow. Decorative indicators and the indicator registry/hook
also have maintained GTK checks for native geometry, SVG loading, replacement
and cleanup. CheckboxInput and Switch are curated too: use their shared value,
defaultValue, onChange and changeAction contracts. The standalone native frame
owns width/status/defaults; an explicit Field supplies that ownership instead.
Keep one state/action owner for row, inline label and keyboard activation.
Async rejection restores the previous selection; synchronous action throws are
handled the same way. Hidden labels, changed chrome and size retain the control.
Set isEnabled from resolved isDisabled as well as removing activation handlers;
accessibilityState alone changes metadata. The native labelTooltip contract is
a label hint. Real Linux checks cover these contracts, including mixed
checkboxes and actual X11 label clicks; AT-client speech/navigation, phone
runtime and pixel parity remain unqualified.

RadioList and RadioListItem also reuse the native leaves. An explicit Field
owns group chrome; otherwise the private native selection frame supplies it.
The private radiogroup role stays intact on GTK; NativeScript9.1.3 has only
radioButton, so its container retains an inert-role fallback. GTK uses its
focus virtual method for one Tab entry per group while each row stays
imperatively focusable. Logical arrow navigation skips disabled/hidden rows
and nested groups; RTL reverses horizontal arrows. Pointer focus is separate
from selection so read-only radios can focus without editing. Keep that
behavior on both Mason and Gtk.Box hosts. A standalone item stays
presentational. Maintained checks cover actual X11 keys/pointer input and
Mason field/metadata/layout contracts; they do not establish AT-client output.

NumberInput reuses the shared native field and TextInput owners. Keep numeric
value/null authority separate from editable decimal/exponent text: an accepted
draft stays while editing, rejected controlled numbers restore the owner, and
blur applies formatValue. Clear reports null before onClear and focuses the
retained editor. Units/steppers/clear parts must not replace it. The native-only
row class describes this host structure; the web leaf owns a different tree.
GTK checks include real X11 input and field metadata; phone, IME and AT-client
behavior are separate qualification.

CheckboxList option data and CheckboxListItem children share a native field
owner and checked-set context. Keep standalone isChecked/onCheck controlled,
including indeterminate state. Use the role adapter for group: GTK retains
group semantics while NativeScript uses its existing inert fallback. Custom
GTK checkbox/switch/radio rows focus on primary pointer press independently of
selection, including read-only rows; preserve focus-on-click opt-out and native
disabled sensitivity. Named GJS checks cover input and metadata, not AT speech.

Nested Mason containers need their resolved GTK border in the engine's sizing
dict. The current GTK allocation root already receives content dimensions, so
clear its own engine border for that compute. Natural measurement instead
computes the authored border box and returns the content contribution GTK
expects. Preserve both fixed-size and automatic measure/allocate checks.

Treat the [multiline intrinsic checks](../../../docs/notes/linux-gtk-renderer.md#multiline-buffer-foundation)
alongside the maintained public-root TextArea fixture. Persistent field/width/
handle ownership and the supported shared control props have runtime checks. Font-based rows/maxRows/autoGrow and constraint transitions have
a maintained public-root GTK fixture, now including X11 internal wheel input
and native host/recreation cases. Preserve the fitting effect's cleanup and defer GTK metric
reads after fontChanged until native CSS validation has run. GTK textview refs
stay on the native editor; its scrolling/placeholder parents are adapter-owned. Hint overlays do not
participate in preferred measurement or pointer targeting; keep the accessible
label independent of hint text. Use framework
style props for the full control's size, opacity and placement. GTK size
requests are minima: preserve the adapter's natural-size propagation policy
for explicit numeric dimensions and their removal. Controlled TextArea edits
now have GTK-root acceptance/rejection checks; preserve per-edit
reconciliation even when value is unchanged. Group buffer changes using GTK
user-action boundaries, and disconnect every grouped-action signal on disposal.
SearchInput has maintained GTK-root reconciliation, field and clear/submit
checks plus native object-driver coverage. Multiline maxLength has maintained
GTK edit/clipboard/undo checks: count UTF-16 units, preserve
whole surrogate pairs, revalidate the borrowed insertion iterator, and dispose
the filter. Owner writes bypass GTK's edit cap. NativeScript insertion and
programmatic-value behavior differs by platform; see the
[length-limit note](../../../docs/notes/linux-gtk-renderer.md#multiline-length-limits).
Verify cached dependency source against the release commit before citing a
version-specific limit; that note records a mismatched source cache.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
import { TextInput } from '@octane-xplat/ui'
export function AccountEntry() {
  return <TextInput label="Account" defaultValue="12" hasClear width="75%" />
}
```

GTK Entry has no direct per-field return-key caption property in the inspected
4.14.5 GIR/4.24.1 API. returnKeyType warns once; onSubmit still receives Return.
Do not turn next into automatic focus movement. See the
[renderer evidence](../../../docs/notes/linux-gtk-renderer.md#gtk-entry-return-key-captions).

Keep the automatic Field wrapper and native editor key stable while chrome
or leading content changes. Compare the mounted widget, not just a captured
handle, when testing identity. Controlled native edits need reconciliation
even when the parent rejects a value without changing props; the existing
effect reads an edit revision for this. Pass original props to the control
and resolved defaults to the wrapper so composed hints are not doubled.


### Native field ownership and lookup

Keep the automatic TextArea field mounted while label, description and status
change. Pass original control props to the child and resolved defaults to the
wrapper so hints and percentage widths are applied once. Loading announces
busy state without disabling editing; read-only and disabled remain separate.

For an explicit child id inside Field, pair Field.inputID with that id.
Automatic TextInput/TextArea wrappers do this themselves. Native label taps
resolve the id inside the logical field subtree, including viewless parents;
testID is an independent automation name. GTK getViewById becomes inert on
disposal. Do not fabricate a Page or search outside the receiver subtree.

TextArea is exported from the GTK root. Keep its editor keyed while inserting,
replacing or removing a leading icon; registered names and renderable nodes
both have runtime coverage. The shared iOS/Android/GTK TextArea rejects
secure=true before rendering;
GTK rejects low-level secure textview batches before any command applies.


### GTK multiline alignment and pixel line spacing

Multiline text and its placeholder share left/center/right/justify alignment.
Logical start/end resolve against the widget direction. Keep direction writes
before alignment resolution so removing RTL restores start in the same update.
Do not assign xalign to Gtk.TextView; it uses justification.

GTK create_pango_layout copies the font but excludes CSS line-height. For
TextArea row fitting, prefer resolved positive numeric/px/dip lineHeight over
that font-only fallback. This includes ancestor CSS and shorter-than-font line
spacing. Keep the bounded frame refits and cleanup. Relative line-height units
remain unqualified for row fitting; do not claim support from CSS forwarding.


### Native search fields

SearchInput uses the shared field resolver and a persistent automatic
FormField. Pass original props to its inner control so descriptions/status
are joined once. Keep id, testID, platform escape props and accessible name/
state on the keyed textfield; the search shell owns its visual classes/style.
The clear action is a Pressable with button role, is hidden for read-only or
disabled controls, calls onChange before onClear and restores editor focus.

On GtkEntry, read get_delegate().cursor_position for the true active edge.
The wrapper's get_position normalizes backward selections to the upper bound;
do not use it to decide whether an update preserved selection direction.
Keep explicit preconditions in retention tests.

Parent-row growth belongs to the field owner. PowerSearchView places its
vx-power-search-input class on an explicit FormField and passes the resolved
size, so the automatic wrapper does not absorb the row's flex-grow contract.
The maintained GTK test checks this composition in a 320px row with a 40px
sibling; it is not full PowerSearch GTK qualification.
