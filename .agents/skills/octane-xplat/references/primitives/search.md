# Search, tokens, and structured filters

Use for AppKit Typeahead, Tokenizer, and PowerSearch ownership. Read [text entry](text-entry.md) for underlying composition/editing constraints and [native interaction](accessibility.md) for focus and accessibility.

## AppKit typeahead focus and request ownership

BaseTypeahead now connects input focus to bootstrap/reshow, whole-field blur to
close/cancel, and hasAutoFocus to the existing queued AppKit owner. Native refs
are stable; handle.native reads the current host, owned blur preserves other
editors, and held handles do nothing after teardown. Native enabled/editable
props and current local/inherited blocking guard editing/selection. Typeahead
click-to-edit reports the query once and readonly fields omit clear actions.

```tsx
import { BaseTypeahead, createStaticSource } from '@octane-xplat/ui'
const people = createStaticSource([{ id: 'ada', label: 'Ada' }])
export function Assignee() {
	return <BaseTypeahead searchSource={people} value={null} onChange={() => {}}
		hasEntriesOnFocus accessibilityLabel="Assignee" />
}
```

New queries invalidate old responses before debounce. Source replacement,
field-leave blur, ref replacement, blocking and teardown cancel requests; late
responses cannot reopen. Query/selection callbacks claim before reentry and
resolve current result identities. Fourteen object-driver cases and the manual
fixture require separate verification. Results now have the separate source-owned floating host
below; keyboard intents have their own source path. Native role/link source wiring now follows separately; IME/editor/blur/
click ordering, full AX behavior, announcements and packaging require separate target qualification. See [AppKit typeahead](../../../../../docs/app/search-selection.md#bootstrap-appkit-typeahead-results-on-focus).

## AppKit typeahead input-owned keys

BaseTypeahead now forwards the native input key payload to its existing consumer
hook before built-in navigation. preventDefault suppresses the policy. Only the
current input/owned field editor in its current window may act; callback-driven
focus/ref/prop changes are rechecked. Closed ArrowDown offers eligible results;
open arrows/Home/End highlight, Enter commits, and Escape closes only that list.
Tab/Shift+Tab close without cancelling native traversal. Modified editing, IME,
ordinary input and closed Escape stay with the native/default layer owner.

```tsx
import { BaseTypeahead, createStaticSource } from '@octane-xplat/ui'
const people = createStaticSource([{ id: 'ada', label: 'Ada' }])
export function Person() {
	return <BaseTypeahead searchSource={people} value={null} onChange={() => {}}
		hasEntriesOnFocus accessibilityLabel="Person" />
}
```

Highlight reveal uses current keyed native row leases, stays in the input's
window and never transfers focus.  Native keys/IME/repeat/Tab/layer/reveal and package
qualification remain deferred. The separate role/link source subset below does
not qualify native AX behavior or announcements. Tokenizer now separately wires empty-input Backspace; see its subset
below. Read the
[key guide](../../../../../docs/app/search-selection.md#choose-appkit-typeahead-results-with-keys).

## AppKit Tokenizer empty-input removal

Tokenizer routes Backspace through BaseTypeahead's current-input key path.
Both cached query and native editor text must be empty; composing/modified keys
retain editing. Transactions read current controlled selection, inherited Field
blocking and metadata, reject reentry and preserve callback-driven focus choices.
One stable public handle exposes the live wrapper; held removal callbacks are
inert after teardown. Delayed blur retains wrapper/panel descendant focus.

```tsx
<Tokenizer label="Tags" searchSource={source} value={tags} onChange={setTags} />
```

Seven object-driver cases and the manual fixture are authored. Native
keys/repeat/IME/editor/blur/popup/AX and package qualification remain deferred.
The separate overflow source path below replaces legacy measurement; native
truncation requires separate target qualification. Use the
[token guide](../../../../../docs/app/search-selection.md#remove-appkit-tokens-with-empty-input-backspace)
for the supported source subset and evidence boundary.

## AppKit PowerSearch initial focus

PowerSearch's existing hasAutoFocus flag now uses the private AppKit request
owner through its typed shared-input handle, replacing the one-shot effect.
Current inherited disabled/read-only/loading or active filter editing cancels
pending work. User activity, changed responders, native replacement and teardown
retain ownership; unblocking alone does not rearm. One stable callback handle
uses current input/blocking and is inert after teardown. The callback contract
still accepts handles only; this change adds no null notification.

```tsx
<PowerSearch config={config} filters={filters} onChange={setFilters} hasAutoFocus />
```

TextInput/TextArea have no public hasAutoFocus prop; do not forward that flag to
them. Five object-driver cases and the manual fixture are authored. Actual
attachment/notification/focus/caret/IME/modal/AX and packaging require separate target qualification.
See [initial search focus](../../../../../docs/app/power-search.md#request-initial-appkit-search-focus).

## AppKit Tokenizer overflow source subset

Collapsed token rows now use a native-clipped flex viewport and an outside
counter. Current keyed refs belong only to the measured collapsed row; expanded
layer token copies are separate. AppKit bounds/convertRectToView replace the
NativeScript measurement APIs. Both edges handle RTL/nonzero bounds, and
partial clipping counts as hidden. Missing/foreign/zero-size geometry keeps the
last count. Counter-space reclamation and stale-layout ownership prevent a
count from reserving its own space after resizing.

```tsx
<Tokenizer label="Tags" width={240} searchSource={source} value={tags}
	onChange={setTags} tokenOverflowBehavior="unfocusedInline" />
```

Requires the renderer's native overflow clipping path. Eight geometry/five
object-driver cases and the manual fixture are authored. Drawing,
Mason sizing, resize/font/RTL behavior, focus/IME, hit-testing/AX and packaging
require separate target qualification. Tokenizer's outer unfocusedLayer editor now uses the
source-owned generic Popover; its result list retains the separate host below. See the
[overflow guide](../../../../../docs/app/search-selection.md#collapse-appkit-token-rows-with-native-geometry).

## AppKit typeahead native accessibility relationships

The shared AppKit result view declares combobox/listbox/option roles. The
renderer maps editable combo boxes to AXComboBox and host list/option roles to
AXList/AXRow, restoring specialized input role/expanded baselines when dropped.
The private relationship owner links the current same-window input/list and publishes
the highlighted row as pending selected children on both, independently of the
committed controlled value. It requests AXSelectedChildrenChanged for native row
identity changes and never calls makeFirstResponder.

```tsx
<BaseTypeahead searchSource={people} value={person} onChange={setPerson}
	hasEntriesOnFocus accessibilityLabel="Choose a person" />
```

Unrelated baseline links are preserved; close/block/ref/window changes restore
metadata, and teardown retires queued work/observation. Hidden/foreign rows are
excluded. Same-window hosting is the current subset. Four renderer, ten
relationship and five view cases plus a manual fixture are authored.
Do not equate roles/links/notifications with qualified VoiceOver hierarchy,
navigation, announcements, focus/IME or packaging. This does not qualify other
Selector/preset lists. See [the source subset](../../../../../docs/app/search-selection.md#expose-appkit-suggestion-roles-and-relationships).

## AppKit floating typeahead source subset

BaseTypeahead/Typeahead/Tokenizer results now use a private same-window source
portal with bounded scrolling, current anchor/menuWidth/placement/direction and
commit-gated reveal. Source providers remain around result content; input and
result descendants share the field-leave blur boundary. The host does not focus
or restore focus, and top-layer ownership gates controlled outside dismissal.
Window retirement cancels the current presentation until close/open rearms it.
Current source readiness refreshes native AX links and requests highlighted-row
reveal after rows mount, using current input/editor/window ownership.

```tsx
<BaseTypeahead searchSource={people} value={person} onChange={setPerson}
	hasEntriesOnFocus menuWidth={280} placement="bottom" accessibilityLabel="Person" />
```

Require the matching renderer source-outlet/staged-window-layer contract; do not
add an inline fallback or replace it with a standalone NSPopover root. Sixteen
controller/focus, four actual source-portal and three readiness cases plus a manual
fixture are authored. State/key fixtures explicitly mock only this host.
Generic Popover and Tokenizer's outer unfocusedLayer editor now portal through
the same-window source host; useLayer/hover standalone roots remain separate. Native portal/context/commit/geometry,
scroll/RTL, input/IME/blur/click, nested dismissal/AX and packaging are unqualified.
See [floating suggestions](../../../../../docs/app/search-selection.md#float-appkit-search-suggestions).

## AppKit PowerSearch range form

Native PowerSearchFilterEditor now routes date_range to a built-in Start/End form
using existing native text/segmented controls. Support NOW, absolute UTC date/time,
and finite signed/fractional/scientific relative amounts with fixed-duration units.
Preserve unchanged absolute precision and relative anchorKey metadata. Validate
both endpoints against one Apply instant, reject invalid/reversed/nonfinite ranges,
and keep relative/Now semantics. Interval presets edit drafts without committing;
expression-string relativeDatePresets and timezoneID-specific display need custom
editors. Named anchors are preserved but not resolved by the built-in matcher.

```ts
import type { DateTimeRange } from '@octane-xplat/ui'
const range: DateTimeRange = {
	start: { type: 'RELATIVE', backValue: 7, unit: 'day' }, end: { type: 'NOW' },
}
```

Current filter/field/operator identity retires drafts; use immediate local records
for rapid edits and guard stale, readonly, loading/disabled and composing inputs.
Cancel remains available; one draft submits once, with consumer-error retry. Apply
stays available to revalidate moving Now; no clock timer is introduced. Web/mobile
range built-ins and complete native entity/nested/custom parity remain gaps. Seven model
and three mocked-control compiler cases plus fixture are authored; native
input/IME/focus/AX/layout/popover and installed-consumer behavior are unqualified.
See [native range form](../../../../../docs/app/power-search.md#edit-native-appkit-date-ranges).

## AppKit PowerSearch entity form

Native entity_list now routes to Tokenizer for source search, selected tokens,
removal/clear, renderItem and optional arbitrary string creation. Preserve source
row data in drafts; save only id/label/top-level string photo, deduplicated by ID.
Client-side applyFilters still passes entity values through; apps own matching.

```ts
import type { EntityListOperatorValue } from '@octane-xplat/ui'
const tags: EntityListOperatorValue = {
	type: 'entity_list', isArbitraryStringAllowed: true, tokenization: {},
}
```

Configured tokenization uses a separate paste field and explicit Add entries,
not Tokenizer's automatic paste. Resolve serially with fresh cancellable request
signals; exact ID wins, then unique case-sensitive label. Sort trimmed/deduplicated
tokens by JS string order if requested; default separators are comma/newline.
Regex captures and zero-width matches are not entries. Reject ambiguous/unmatched
values unless a missing match permits arbitrary creation; failures publish no
partial draft and show generic errors. Apply requires adding or clearing pending
text. Revision/readonly/Cancel/unmount aborts retire old work even if sources ignore
signals. One draft submits once, consumer throw allows retry. Search state/source
selection ownership remains with the existing Tokenizer, not a duplicated engine.
Seven model/five mocked-control editor cases and an idle fixture require separate verification. No
native input/IME/AX/popover/cancellation/installed-consumer qualification, no new
public API/dependency and no React Aria presence change. Web/mobile entity editors
and full nested/custom parity remain gaps.
See [entity workflow and source example](../../../../../docs/app/power-search.md#edit-native-appkit-entity-filters).

## AppKit PowerSearch scalar ownership and numbers

Native scalar drafts now reset on filter/field/operator replacement and retain
rapid edits before render. Guard current revision, readonly filter/editor, marked
text and unmount; claim one submission before consumer reentry, release on throw.
Cancel retires the session. Explicit missing field/operator keys disable Apply;
an absent operator uses the configured default, then first. Numeric Apply accepts
finite decimal/scientific text, requires safe whole integers, enforces inclusive
minValue/maxValue and rejects nonfinite/reversed configured bounds. Never coerce
blank text to zero, accept hex/trailing text or silently clamp. Units/bounds are
displayed, with dot decimal notation (locale numeric parsing remains unsupported).

```ts
import type { IntegerOperatorValue } from '@octane-xplat/ui'
const year: IntegerOperatorValue = {
	type: 'integer', minValue: 1800, maxValue: 2100, units: 'publication year',
}
```

Five model/five mocked-control editor cases and an idle scalar fixture require separate verification.
This does not complete string-source/list/time/relative/custom/enum/date behavior
or native text/IME/focus/AX/popover/consumer qualification. Absolute UTC date/time
validation and precision retention are described below; calendar widgets and
timezone display remain separate gaps. No public type/dependency or React Aria presence
change. See [numeric draft workflow](../../../../../docs/app/power-search.md#validate-native-appkit-numeric-filters).
