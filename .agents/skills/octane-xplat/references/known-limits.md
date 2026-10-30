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

SegmentedControl options and SegmentedControlItem children share the native
single-choice owner and GTK radio-group path. Keep one field frame, checked
radio state, native sensitivity and grouped input. An item outside its owner
is presentational. layout="fill" shares the track width; the default hugs
content. Icon-only items retain their label as the name. Preserve controlled
rejection, local defaults, keyed updates and RTL behavior when changing this
leaf. The existing NativeScript composite-role fallback still applies.

PinInput reuses TextInput editors under one native group field. Keep unique
numbered editor ids and accessible names; do not clear the Field provider and
create an automatic field per digit. Sequential edits retain the existing
prefix, clearing truncates the suffix, and focus advances after the next cell
becomes editable. Keep controlled rejection and completion checks alongside
secure and length updates. Numeric purpose is a keyboard hint, not validation.

Slider keeps one field and local/controlled scalar or range owner. GTK
adjustable roles use the renderer's slider focus and ref increment/decrement
events; the private accessibility helper publishes typed min/max/current/text
properties without importing GI into UI. Keep controlled rejection, step
anchoring and endpoint checks. PanEvent x/y remain movement deltas: capture
native touch position and defer thumb selection until the first movement,
because GTK can dispatch pan begin before touch down.

Slider value tooltips split interaction (the control) from position (the
upper thumb). The GTK use-tooltip leaf supports this internal path through
the existing portal/popover machinery. Do not export useTooltip from the GTK
root yet: its broader alignment, trigger, controlled-state and callback options
still need their own qualification. Numeric metadata and actual keys/drags
do not establish an AT-client set-value or speech pass.

InputRating uses one group field and the existing radio keyboard path.
Distinguish the filled prefix (score <= value) from the single checked score
(score === value). Keep numbered names, duplicate suppression, local defaults
and controlled rejection. Registered glyph names take priority over a
single-character fallback; pass the glyph class and explicit common icon size.
Use framework style.direction for RTL tests: GTK's raw set_direction changes
one widget, while the framework cascades the authored direction to children.

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
### GTK option presentation and box layout

SelectorOption presents an icon, label and description; it has no selection
or press owner. isDisabled adds the same modifier class as web. Selector and
MultiSelector are public root exports sharing the Popover-backed finite-list
menu; arrow-key listbox navigation is a web-only SelectView feature.

Pure-utility/i18n/theme/link exports are qualified on GTK (113 values/
138 types in the root). Slot/state-bearing hooks — useCalendarDays/
Constraints/Navigation, useTableSortableState, usePowerSearchConfig,
styled — remain deferred to their consumer-component slices because
fixtures cannot host slot-compiled hooks (rolldown merges a fixture's
`withSlot as _$withSlot` emission with ui-source emissions as a duplicate
binding). Do not substitute the presentation part for a selection field.

GTK Mason owns border-box sizes and CSS margin spacing; keep margins outside
authored width/height. The renderer bridge consumes GTK margin/padding/border
once and restores Mason order when direction clears. Rebuild the native C
facade after pulling this change. Decorative accessible=false content must
stay excluded after first map and remap; check native metadata separately
from assistive-client behavior.

### GTK native popup boundaries

The curated GTK root still excludes Selector and MultiSelector.
Raw GTK popup feasibility and renderer portal measurement are separate from
qualification of those public APIs. Gtk.Window capture does not receive events
from a native Gtk.Popover surface; bind controllers to each native popup when
implementing shared layer dismissal. Keep independent outside/Escape policies
and controlled-owner authority rather than delegating them to autohide.

GTK ref getBounds() and layoutChanged keep coordinates relative to the original
app host for same-root portals in native popup surfaces, including nested
popups. Unrelated top-level windows have no bounds in that coordinate space.
Use the maintained ui-popup-portal case when changing this conversion; preserve
native surface transforms and the original host's coordinate system.

The renderer's internal popup-events hub shares controllers across registered
window, sibling and nested popup surfaces. Use it when adding a GTK overlay
session and release the registration on close. Keep dismissal authority in
layer-stack: claim outside input before invoking the owner's callback. Escape
bubbles after the editor's handlers; do not replace that with a capture shortcut
or infer real IME coverage from a synthetic composing guard. The maintained
ui-popup-events case owns the routing/lifetime checks; it does not qualify other
overlay surfaces. Popover is curated separately: the shared leaf portals
through the original root and placement uses set_pointing_to, not an
iterative set_offset feedback loop (see the renderer note).

Button/IconButton/ButtonGroup/ClickableCard/Card/Link/ToggleButton(Group) and
the text/display leaves (Kbd through FieldStatus) are public GTK exports
proven by ui-buttons (real input) + ui-display (mounts/folded text).
`styled` resolves via `styled.gtk.tsrx` — the nativescript leaf stamps a
nativescript universal-component marker the GTK owner rejects. The GTK
vite config includes `xplat-gtk-slot-dedupe`, a local workaround for a
rolldown limitation that fails to dedupe `withSlot`/`hookSlots` import
bindings across slot-compiled modules in single-file bundles — required
for any barrel including hook-heavy leaves.

Image/Thumbnail/thumbHashUri/Avatar(+StatusDot/Group/Overflow)/User are
public GTK exports proven by ui-images (21 checks). `Image.gtk.tsrx` and
`thumbhash.gtk.ts` are real leaves — the nativescript `ImageSource`/`interop`
paths don't apply; the GTK image host (`image`/`svgview` + `bindPicture`)
decodes data:/http(Soup)/file/res://~/ natively. `placeholder` and
`isLoadingChange` are wired in the renderer. `contentPosition` and the
true 'none'/'scale-down' fits are unsupported (Gtk.Picture centres and
has no unscaled mode — SCALE_DOWN approximation).

DropdownMenu/ContextMenu/MoreMenu/menu-context are public GTK exports
(ui-menus, 20 checks, real input). ContextMenu triggers on long-press
(shared contract) — right-click/Menu-key/Shift+F10 are web-only. Menu
keyboard navigation is web-only (not in the shared leaf). `presentation="bottom-sheet"`/`"adaptive"` throws until BottomSheet is
qualified (slice D) via `menu-sheet.gtk`/`MoreMenu.gtk` leaves.

### Anchored layers (slice C2)
- `NavigationMenu` is deferred to slice G — `useNavigationItem` needs a router context the GTK slice does not provide.
- `useLayer`/`useHoverCard` shared leaves gate on `appKitHost()` (`showLayer`/`observeHover`); the GTK `.gtk` leaves substitute the renderer Popover session and `Gtk.EventControllerMotion`. `HoverCard.tsrx` imports the hook by extension, so `HoverCard.gtk.tsrx` is required for the `.gtk` hook to resolve.
- `useLayer` fixed mode places the panel at page-coordinate x/y via the Popover`s fixedPosition internal prop (a zero-size pointing rect in host space).

### Overlays D2a (toast / lightbox / palette / drawer)
- `ref.animate` is translate-only on GTK; `Lightbox` zoom writes `scaleX`/`scaleY`/`translate` directly (instant, same contract).
- `can_target=false` is never a pass-through: `gtk_widget_can_be_picked` skips the widget AND its subtree. Scrim-free pass-through uses edge-docked, content-hugging overlay layers (`align` on the layer widget).
- `Gtk.GestureDrag` claims sequences — bind `onPan` only when it should win over `GestureSwipe` (the lightbox binds it only while zoomed).
- Focus grabs on unmapped layer targets are no-ops: bind capture-phase key controllers on the window root (lightbox arrows) or re-grab on `map` (palette entry).
- Portal children are not in `container.nodes` — tests locate them via the widget tree (`get_name`/label text), not the node registry.
- GJS lacks `AbortController`; the palette leaf installs a minimal shim for `command-palette-state`.
- Anchored toasts live in a Popover surface, so their bounds are a separate Gdk surface — compare `surface.get_position`, not window-space bounds.
- `presentation="bottom-sheet"` still throws (slice D2b); `Lightbox` `type:"video"` renders the alt-text fallback.

### Overlays D2b (bottom sheets / menu-sheet)
- `view.on("pan")` emits **numeric** states `began=1, moved=2, ended=3, cancelled=0` with cumulative `dx/dy` and px/s `vx/vy` — the `connectEvent` dispatcher sends strings but `public-instance` remaps them in the emit wrapper.
- Sheets with `snapPoints` rest at the SMALLEST detent on entry (shared `enter()` parks `cur=0`), matching native — do not assert the top detent.
- The X11 harness cannot produce `>500px/s` release velocity (`DETENT_FLICK_VELOCITY`) — tested snaps all land on the nearest-detent branch; the fling branch is untested.
- `SwitcherPanel` must not `useStore` — the GTK portal shares one root, and a store subscription inside it re-rendered ~30x/s and starved the main loop. The active spec arrives by prop.
- `bottomSheetHost()` returns `null` on GTK and is not a barrel export — it lives on the `./nativescript`/`./macos` host subpaths only, so a GTK export would break the Names contract.
- Interpolated `<Text>` children split into separate Gtk labels — imperative sheet content needs a single computed string for text-based lookups.
- `Gdk.Display.list_seats()`/`SeatCapability.TOUCH` drives `'adaptive'` menu resolution; X11 desktops report pointer/tablet only so adaptive stays a popover.
- Sheet release animates `translateY` off-window (translate-only); there is no opacity/scrim modulation exit animation.

### Theme and environment (slice E)
- `useAnnounce` delivers through `GtkAccessible.announce` (GTK >= 4.14) — proven to reach the real widget method; AT-client speech receipt is unverified (fixture uses `GTK_A11Y=test`). `politeness` is ignored, same as the native leaf.
- On GTK < 4.20 the "system" scheme source is the app-owned `gtk-application-prefer-dark-theme` flag plus the `-dark` theme-name heuristic — there is no read-only OS dark signal until `gtk-interface-color-scheme` (4.20+). `setThemePreference('light'|'system')` clears the flag, so a host shell that signals dark only through it must re-assert after a preference change.
- `useMediaQuery` evaluates the css-engine environment (largest live host size, scheme, reduced-motion): `pointer`/`hover` are fixed `fine`/`hover`, and width/height track the window not the screen.
- `copyText`/`useClipboard` write text only; there is no read or format API.
- Multi-value `font-family` stacks from generated theme CSS trip the GTK declaration parser ('Junk at end of value for font-family') — token values should use single-family strings for now.
### Focus and keyboard (slice F)
- `onKeyDown`/`onKeyUp` exist on every element but the component prop surfaces (`View`/`Pressable`/`TextInput` etc.) do not carry them — spread `keyboardProps`/`focusProps`/`focusWithinProps`/`landmarkProps` onto host intrinsics, or cast when spreading onto components (`as any` in fixtures; the hook prop types are DOM-flavored, not NativeEvent-flavored).
- `KeyEvent.code` is `''` (Gdk reports hardware keycodes, not DOM code names); `repeat`/`isComposing` stay `false`; `relatedTarget` is `null` — GTK4 reports none on leave, and focus is not cancelable (same as DOM focus/blur).
- A `preventDefault`/`stopPropagation` claim is synchronous — if the driver defers dispatch (`applyingDepth > 0` mid-batch) the claim is silently dropped and the key falls through to the target widget.
- Focus-visible modality is real but approximate: keyboard = unmodified key press (bare Ctrl/Alt/Meta/Super excluded — GTK reports `state` without the just-pressed bit; Shift counts like web), pointer = mouse button or touch begin, window deactivation = unknown. Touch-seat behavior is unproven on the Xvfb harness.
- The F12 test ack is itself a key press — after every input phase modality reads `keyboard`; assert pointer modality from an ordered event log, never from post-phase state.
- `GtkEntry` focus delegates to the inner `GtkText` — `window.get_focus()` returns the delegate; compare via a parent-chain walk, not `===`.
- `Gtk.Label` reports `get_can_focus() === true` inside realized cells — grid cells must be the *outermost* focusable descendants (a cell's own children are part of the cell).
- `useLandmark` F6 region cycling is web-only — the shared native leaf is semantic-only by contract (role + label forwarding, which the landmark `A11Y_ROLES` additions now honor).
