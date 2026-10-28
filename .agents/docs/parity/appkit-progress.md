# Native macOS implementation progress

Target: native AppKit, issue #62. The immutable audit at `720c9ef93`
remains a source snapshot; do not regenerate shared snapshots while the
three desktop tasks share this checkout.

## Priorities and evidence boundary

Assume everyday document workflows, settings, inbox filters and view switches
have higher demand than charts, GPU effects or niche integrations. The
sandbox's segmented-control examples and table inbox/page templates exercise
selection, child items, disabled options and fill layout. FileInput's maintained
gallery establishes file picking as an ordinary app flow.

No native runtime, OS input, VoiceOver, packaging or visual checks have been
run for the changes below. Heavy verification needs explicit authorization
from the human assigned to this task. Other tasks' approvals do not apply.

## Files

The AppKit leaf now implements UTF-8 reads, chunked binary reads, size limits,
cancellation, Documents writes and NSSavePanel export. The source handles
security-scoped access cleanup and atomic write failures. Starting-folder
options are passed to NSOpenPanel. No persistent security bookmark is stored.
MIME filters still use a finite table and unknown types are unrestricted.
These are implementation claims, not evidence of real picker/sandbox behavior.

Bridge tests cover binary reads, cancellation, size limits, resource cleanup,
offset byte views, atomic failure, export cancellation and concurrent exports.
The tests are authored but not executed. Text decoding, picker interaction,
large-file responsiveness and real sandbox access still require qualification.
Lightweight TypeScript transpile diagnostics found no syntax errors in the
changed files service, its types and its new bridge tests. `git diff --check`
also passed for this change. Neither check resolves types or executes tests.

## Deferred verification

Run only after this task receives the human's go-ahead:

```sh
pnpm exec turbo run test --filter=@octane-xplat/files -- src/files.macos.test.ts src/files.bridge.test.ts
pnpm exec turbo run typecheck --filter=...@octane-xplat/files
pnpm check:recipes
```

The files package currently has no typecheck script; the filter still checks
its dependents and their declared environments. Confirm the actual selected
checks before reporting coverage. Native NSOpenPanel/NSSavePanel interaction,
UTF-8 and binary round trips, picker cancellation, security-scoped access,
readonly destinations and packaged consumer behavior require a separate
AppKit runtime fixture and OS interaction after authorization. No command-only
bridge test establishes those outcomes.

## SegmentedControl

Replaced the macOS placeholder with self-drawn options/child items, field
state, controlled/uncontrolled selection, disabled/read-only guards, fill
classes and icon labels. A scoped AppKit monitor implements wrapping arrows,
Home/End, RTL horizontal order, current native subview ordering and cleanup.
It preserves other responders/windows and modified shortcuts. The renderer
now maps radio/radiogroup to native roles and radio checked state to 0/1.
Enter/Space remain on its existing tappable-host path.

New source, key-adapter regressions and renderer regression edits pass the
TSRX parser. Tests have not executed. The maintained
`examples/probes/segmented-control.macos.tsrx` covers selection dispatch only;
it is not proof of OS keyboard navigation. Tab entry, focus appearance,
selection rendering, VoiceOver, native events and packaged behavior remain
open. The new `appkit-segmented-control` recipe records those gaps. Existing
motion recipes retain their web/iOS/Android target scope.

Additional commands deferred until human authorization:

```sh
pnpm exec turbo run test --filter=@octane-xplat/ui -- src/segmented-control-keys.macos.test.ts
pnpm exec turbo run test --filter=@octane-xplat/macos-renderer
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui --filter=...@octane-xplat/macos-renderer
pnpm exec turbo run test:macos --filter=@octane-xplat/ui
pnpm probe run examples/probes/segmented-control.macos.tsrx --target macos --watch
pnpm check:recipes
```

The probe uses direct dispatch. Separately exercise physical Tab, arrows,
Home/End, Enter/Space, live disable/reorder/unmount, two windows and VoiceOver
on an authorized AppKit host. No visual analysis is authorized.

Work continues in the isolated detached worktree
`/Users/alec/dev/alloc/worktrees/octane-xplat/appkit-support/octane-xplat`.
The 16 in-progress AppKit files were transferred and byte-verified; their
uncommitted copies were removed from the shared checkout. Commit `8ac8a11db`
remains in both histories. No dependencies were installed in the new worktree;
syntax parsing used the original checkout's existing parser read-only.

## Responsive layout and live host state

The AppKit root now selects a dedicated media-query hook. It subscribes to
primary-host-window resize notifications and evaluates width/height, pointer,
hover and orientation using desktop traits. Native queries share a pure
restricted evaluator; invalid pointer/hover/orientation values no longer match,
and `and` terms are evaluated before `or` alternatives. NativeScript retains
screen dimensions and touch traits. Arbitrary CSS, range syntax, secondary
window ownership and reduced-motion queries remain outside this hook.

The AppKit host installer used `Object.assign` on an object containing getters:
that evaluated `appState` and `windowSize` once rather than preserving live
reads. It now defines those descriptors on the existing renderer bridge. Window
sizes use content bounds before outer-window frames and preserve snapshot
identity until dimensions change. This is a source-confirmed prerequisite
repair; runtime state/resize delivery is not yet qualified.

Parser checks passed for the changed source and bridge regressions. No tests
have executed. The maintained `responsive-layout.macos.tsrx` probe is authored
but not run. Its programmatic resize does not establish physical pointer input
or pixel parity. The new responsive-layout recipe records the source subset.

Additional deferred commands:

```sh
pnpm exec turbo run test --filter=@octane-xplat/ui -- src/media-query-native.test.ts src/media-query-source.macos.test.ts
pnpm exec turbo run test --filter=@octane-xplat/platform
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui --filter=...@octane-xplat/platform --filter=@xplat/macos
pnpm probe run examples/probes/responsive-layout.macos.tsrx --target macos --watch
pnpm check:recipes
```

Once authorized, check app activation/deactivation, actual primary-window
resize/rendering and subscription cleanup in addition to bridge assertions.
Work is now on origin branch `feat/appkit-native-support`; pushing is authorized.
The heavy-verification restriction remains unchanged.

## Focus-visible input modality

AppKit now has a dedicated `useFocusVisible` leaf. Its native source observes
unmodified key-down and left/right/other mouse-down events without consuming
them, ignores modified application shortcuts, and clears modality when the app
deactivates. Hook readers share one monitor/notification observer and release
both after the last unmount. A synchronous `isFocusVisible()` read retains
observation for the module's lifetime; HMR disposal releases it. Missing or
failed bridge registration reports unsupported rather than inferred input.
`useFocusRing` reads this modality through its existing shared hook.

Source regressions cover stable snapshots, event passthrough, keyboard/mouse
transitions, modifiers, deactivation, shared subscriptions, teardown, global
read retention and partial-registration failure. They and the maintained
`focus-modality.macos.tsrx` probe are authored but not run. Syntax parsing and
whitespace checks are the only validation. Actual hook updates, physical input,
text focus callbacks, focus appearance and VoiceOver remain unqualified.
FocusScope is tracked separately below; subtree-focus tracking remains
unsupported. Modality tracking is not a claim of finished focus parity.

Deferred commands for this slice:

```sh
pnpm exec turbo run test --filter=@octane-xplat/ui -- src/focus-visible-source.macos.test.ts
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
pnpm probe run examples/probes/focus-modality.macos.tsrx --target macos --watch
pnpm check:recipes
```

After authorization, exercise real Tab/Shift+Tab, pointer buttons, Command/
Control/Option shortcuts, app deactivation, two simultaneous hook readers,
last-reader unmount/remount and HMR cleanup. The probe only exposes state and
initial bridge capability; that alone is not OS-input evidence.

## Native FocusScope ownership

The AppKit leaf now binds a native scope manager for autofocus, containment,
restoration and nested ownership within each window. It traverses visible,
enabled native descendants, wraps Tab/Shift+Tab in native subview order,
preserves modified shortcuts and marked-text composition, and observes window
updates/key activation to handle delayed attachment and outside focus moves.
Shared field editors resolve back to their owning text controls. Restoration
checks the saved target's window/eligibility and preserves newer independent
scopes. Cached ancestry keeps nested return behavior independent of effect
order and native detachment. Subtree-focus hooks are still a separate gap.

The renderer now retains programmatic-focus targets for scope boxes, excluding
them from ordinary Tab stops without adding a fake click action. Enter/Space
still dispatch only real actions. Retention is reference-counted and released
on teardown. `getFocusScopeCapabilities()` checks the native bridge rather than
returning an unconditional support claim. Hosted editors and separate popup
windows are not contained as descendants of another native scope.

Source regressions and a maintained programmatic focus/restore probe are
added. Parser and whitespace checks passed; tests, actual focus/key delivery,
Tab policy, IME, focus appearance, VoiceOver, HMR and packaged behavior have
NOT run. No evidence-gated checkbox is closed from this implementation.

Deferred commands:

```sh
pnpm exec turbo run test --filter=@octane-xplat/ui -- src/focus-scope-state.macos.test.ts
pnpm exec turbo run test --filter=@octane-xplat/macos-renderer
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui --filter=...@octane-xplat/macos-renderer
pnpm probe run examples/probes/focus-scope.macos.tsrx --target macos --watch
pnpm check:recipes
```

After authorization, exercise real forward/backward Tab, live disable/hide/
reorder, empty/nested scopes, outer-before-inner teardown, delayed/reparented
views, two windows, IME candidate windows, focus restoration after removal,
VoiceOver and repeated/HMR teardown. The programmatic probe is not OS-input
or pixel evidence.

## Native hardware-key attachment

The renderer now binds key-down/up handlers to native views and routes events
from the owning window's first responder through registered native ancestors.
Shared field editors resolve to their text controls. Payloads include logical
characters, known physical codes, modifiers, repeat and composition state;
recognized dead keys are composing. The UI adapter copies portable fields so
native targets/event objects do not escape its public event.

`preventDefault` cancels native dispatch; `stopPropagation` stops Xplat ancestor
callbacks independently. FocusScope requests dispatch before its Tab decision,
with a shared per-event result to avoid duplicate callbacks across monitors.
Key binding replacement/removal and node teardown release obsolete callbacks;
the last binding/observer removal stops native monitoring. Modality readers
subscribe before cancellation so a trapped/prevented key still counts as
keyboard input, independent of native monitor order. Shared View/TextInput/Pressable do
not forward the key bag — attach it to native intrinsics/ancestors.

Modifier-only `flagsChanged` events and extended physical-code coverage remain
incomplete. Local monitors do not observe events consumed in nested native
tracking loops, per Apple's local-monitor contract. Physical input, layout/IME,
text defaults, propagation/cancellation, focus-scope coordination, teardown and
packaged behavior remain unqualified. Subtree focus tracking and grid keyboard
behavior remain separate gaps.

Added dispatcher/portable-adapter/prop-clear/scope-coordination regressions,
JSX declaration self-checks and a maintained keyboard probe. Parser checks and
`git diff --check` passed; no tests, typechecks, probe or OS interaction have
run. Shared audit snapshots remain untouched.

Deferred commands:

```sh
pnpm exec turbo run test --filter=@octane-xplat/macos-renderer
pnpm exec turbo run test --filter=@octane-xplat/ui -- src/use-keyboard.macos.test.ts src/focus-scope-state.macos.test.ts
pnpm exec turbo run typecheck --filter=...@octane-xplat/jsx --filter=...@octane-xplat/ui --filter=...@octane-xplat/macos-renderer
pnpm probe run examples/probes/keyboard.macos.tsrx --target macos --watch
pnpm check:recipes
```

After authorization, verify key-down/up, repeat, Shift and command chords,
non-US layouts, dead keys/IME, two windows, native editing defaults, ancestor
propagation, prevented/stopped Tab within FocusScope, binding removal and
repeated teardown. The probe exposes state only and is not OS-input evidence.

## Subtree focus boundary attachment

The AppKit renderer now registers container `onFocus`/`onBlur` handlers against
per-window first-responder ancestry, independently of CSS selectors. A shared
field editor resolves to its owning text control before ancestry checks.
Moving between descendants does not emit a false exit/entry. Native text
controls retain their existing delegate callbacks. Handler replacement keeps
boundary state; removal and node teardown release bindings, and the last
binding releases the notification observer. Initial observation is deferred
until after the host commit. The hook reuses a shared callback-state helper,
normalizes minimal native events, and reports native observer availability.

Attach `useFocusWithin().focusWithinProps` to a raw native container: shared
View does not forward these handlers. This is first-responder ownership within
one window, not app activation or focus in separate popup windows. Window-update
observation may coalesce transient responder changes between notifications.
Native delivery/timing and actual OS behavior remain unqualified.

Added source regressions for boundary transitions, field editors, nested groups,
windows, callback replacement/removal, detachment and observer failure/cleanup,
plus a maintained programmatic probe. TypeScript/TSRX parser checks and
`git diff --check` passed. No tests, typechecks, probe, native build, OS input,
visual analysis, dependency install or packaging ran. Existing web/mobile focus
regressions also remain deferred because the shared event-input type changed.
Shared audit snapshots were not regenerated; no evidence checkbox is closed.

Deferred commands:

```sh
pnpm exec turbo run test --filter=@octane-xplat/macos-renderer
pnpm exec turbo run test --filter=@octane-xplat/ui -- src/focus-within-event.test.ts src/use-focus.web.test.tsrx src/use-focus.mobile.test.tsrx
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui --filter=...@octane-xplat/macos-renderer
pnpm probe run examples/probes/focus-within.macos.tsrx --target macos --watch
pnpm check:recipes
```

After human authorization, verify notification timing and hook rerenders under
physical Tab/Shift+Tab, clicks, IME, initial/delayed attachment, hide/disable,
reparent/detach, nested groups, multiple windows, app activation, popup/editor
ownership, VoiceOver and repeated/HMR teardown. Programmatic responder changes
are not OS-input or accessibility proof.

## GridList stacked layout

Source inspection of the AppKit GridList found that `layout="stack"` retained
`flexDirection: 'row'` while assigning each cell 100% width. It now uses a
column flex direction for stack layout and retains row/wrap for grids. This
is a target-specific layout correction; rendered geometry remains unverified.
Parser and whitespace checks passed. No new test duplicates this one-line
mapping; existing package checks and native layout qualification remain
explicitly deferred:

```sh
pnpm exec turbo run test --filter=@octane-xplat/ui -- src/grid-list.mobile.test.tsrx src/grid-list.web.test.tsrx
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
```

GridList keyboard navigation remains an independent implementation gap.
The inert AppKit hook cannot simply reuse DOM row selectors/tabIndex: native
row discovery and a renderer-backed roving Tab-stop policy are prerequisites.
The new hardware-key bridge is necessary but does not by itself supply them.

## GridList native row navigation

Priority assumption: the macOS VirtualList bench exercises pressable collection
rows and the shared app uses the same desktop host; keyboard-first collection
navigation is expected to matter more than niche media/GPU integrations.
A targeted scan found no direct GridList adoption in existing apps/examples
before this probe, so this is inferred demand, not observed user frequency.

The AppKit GridList component now registers its actual native row views.
A reference-counted renderer bridge excludes non-current self-drawn hosts
from Tab without rejecting programmatic focus. Arrow mode repairs its one
Tab stop on window updates and component commits, follows focused descendants,
and releases exclusions on removal, mode change and unmount. Tab mode leaves
native row/descendant stops intact. This avoids DOM selector assumptions.

Arrows/Home/End navigate enabled visible rows; fixed or native-frame-measured
columns include disabled slots so vertical movement does not collapse the grid.
Left/Right follow native layout direction. Successful focus requests scroll
the row into view and consume the key. Enter activates/selects; Space selects
without activation. Shift+Space ranges use a stable key anchor, survive reorder,
and skip disabled keys. Pointer activation focuses the selected row. Modified,
composing, already-prevented and nested-control key events keep their existing
behavior. The component never autofocuses just because it mounted.

The public selector-based useGridList hook remains unsupported on AppKit;
its custom-query contract is a separate gap. Shift+click ranges remain missing
because current native tap callbacks do not carry modifier payloads. Native
AX grid/row semantics and physical focus/scrolling remain unqualified. No audit
checkbox is closed; the shared snapshots have not been regenerated.

Added fake-host manager cases, an AccessibleHostView exclusion ownership case,
object-driver component selection cases, and a maintained native-policy probe.
These are authored regressions only. Syntax and whitespace checks passed;
package tests/typechecks, native builds/probes, OS input/IME, VoiceOver, visual
analysis, installation and packaging have NOT run.

Deferred commands:

```sh
pnpm exec turbo run test --filter=@octane-xplat/ui -- src/grid-navigation.macos.test.ts
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/grid-list.macos.mobile.test.tsrx
pnpm exec turbo run test --filter=@octane-xplat/macos-renderer
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui --filter=...@octane-xplat/macos-renderer
pnpm probe run examples/probes/grid-list.macos.tsrx --target macos --watch
pnpm check:recipes
```

After explicit human authorization, qualify real forward/backward Tab,
arrows/Home/End/Enter/Space, native layout-direction behavior, incomplete rows,
disable/hide/remove/reorder, nested grids and FocusScope, controlled selection,
scroll visibility, nested editing/IME, two windows, delayed attachment, VoiceOver,
HMR and packaged lifecycle. Handler dispatch or makeFirstResponder alone does
not qualify physical input, hit testing or accessibility.

## System settings launch

Priority evidence: `packages/app/src/Services.tsrx`, used by the shared app,
already exposes a settings action. This makes the service an existing everyday
flow, ahead of niche integrations. Its action label is now Open settings so
it does not promise an app-specific page on macOS.

The new AppKit open-url leaf supplies the root `openSettings` service and
preserves existing `openUrl` host delegation. It checks live NSWorkspace
method availability, resolves the installed System Settings bundle on each
availability/open request, and launches only on `open()`. Missing native methods
report unsupported and open throws UnavailabilityError; missing apps, lookup
errors and rejected/throwing launch requests return false. No private pane URL,
absolute application path, shell launch or new dependency is involved.

AppKit opens the settings application without choosing a pane; this is a
platform subset rather than the mobile app-details route. It does not change
permissions or confirm presentation/activation. Launch Services may restore
its prior location. The public API references are Apple's
[application lookup](https://developer.apple.com/documentation/appkit/nsworkspace/urlforapplication%28withbundleidentifier%3A%29)
and [open URL](https://developer.apple.com/documentation/appkit/nsworkspace/open%28_%3A%29).
The current host's System Settings Info.plist was read with
`plutil -extract CFBundleIdentifier raw '/System/Applications/System Settings.app/Contents/Info.plist'`
and returned `com.apple.systempreferences`. This is filesystem/source evidence,
not a launch, settings interaction, or cross-version runtime qualification.

Authored fake-bridge cases cover root/leaf identity, support vs availability,
missing/partial/late/throwing bridges, missing apps, launch rejection/failure,
fresh lookups, and unchanged outbound-link delegation. The maintained probe
has an explicit launch button; its run function only queries availability.
Syntax and whitespace checks passed. Tests, declaration/type generation,
package/Vite resolution, native build/probe, real settings launch/presentation,
sandbox/packaged behavior and visual analysis have NOT run. Audit snapshots
remain untouched and evidence-gated issue checkboxes remain open.

Deferred commands:

```sh
pnpm exec turbo run test --filter=@octane-xplat/platform
pnpm exec turbo run typecheck --filter=...@octane-xplat/platform --filter=...@xplat/app
pnpm exec turbo run typegen --filter=@octane-xplat/platform
pnpm exec turbo run test:packed --filter=@octane-xplat/platform
pnpm probe run examples/probes/open-settings.macos.tsrx --target macos --watch
pnpm check:recipes
```

After explicit human authorization, verify direct/root package resolution,
actual launch from the shared screen and probe button, already-running Settings,
launch rejection, app focus/return, denied-permission follow-up, and packaged/
sandbox operation. Querying availability alone is not presentation proof.

## Text clipboard capability and failure handling

The root AppKit clipboard previously required both read and write methods to
report canCopy, incorrectly hiding copy capability on a write-only host. It now
checks only the live writer. A dedicated clipboard.macos leaf supplies the root
export and a platform-resolver candidate for direct imports, avoiding the
mobile leaf's iOS/Android imports when that candidate is selected. Actual
Vite/package direct-import selection remains deferred.

Missing or throwing/rejected write/read host calls now resolve false/null,
matching the other text clipboard leaves; empty read text remains an empty
string. Both published method names share each operation. AppKit UI copyText
now delegates to the same platform writer rather than maintain another bridge
wrapper. Reads remain independent of write capability. No paste, rich formats,
shortcut interception or clipboard-history feature is added.

Authored fake-host cases cover write-only/read-only/missing/late/replaced hosts,
root/leaf identity, failure normalization, method aliases and empty text. A UI
adapter case covers forwarding true/false results without a reader. The existing
CopyTextDemo is the maintained user-flow example; keyboard-clipboard AC2 and
skill guidance now include this contract. Syntax and whitespace checks passed;
no tests, typechecks, native build/probe, real pasteboard read/write, dependency
install, packaging or visual analysis ran. No user clipboard contents were read.

Deferred commands:

```sh
pnpm exec turbo run test --filter=@octane-xplat/platform
pnpm exec turbo run test --filter=@octane-xplat/ui -- src/clipboard-write.macos.test.ts
pnpm exec turbo run typecheck --filter=...@octane-xplat/platform --filter=...@octane-xplat/ui
pnpm exec turbo run typegen --filter=@octane-xplat/platform
pnpm exec turbo run test:packed --filter=@octane-xplat/platform
pnpm check:recipes
```

After human authorization, verify root/direct-import resolution, copy-only host
behavior, actual NSPasteboard write/read, Unicode and empty text, failed writes,
CopyTextDemo feedback, repeated independent attempts and packaged behavior.
Source tests and handler dispatch do not prove OS pasteboard access.

## Image request lifecycle and leaf normalization

Priority evidence: Services.macos.tsrx already previews picked files with core
Image, and Home.tsrx contains an image seam. Image lifecycle and layout therefore
affect ordinary existing screens, independently of niche media integrations.
Source audit's image-appkit finding still applies to the optional cache APIs:
they remain stubs. The renderer did already have a bounded decoded-image cache;
that existing source facility is distinct from a cache-control API or engine.

A platform-free request coordinator now installs each subscriber before native
work starts, shares active loads, bounds cached decoded images to 64 by recent
use, and cancels when the final subscriber leaves. Source change/disposal removes
the callback promptly. Request identity prevents cancelled completions from
poisoning retry/cache state; setup/resume failures settle without leaving a
permanent pending entry. Callback failures cannot strand other subscribers.

Remote completion processing and NSImageView delivery explicitly enter
NSOperationQueue.mainQueue; non-2xx HTTP responses are rejected before decode.
Apple documents completion handlers on the session's
[delegate queue](https://developer.apple.com/documentation/foundation/urlsession/delegatequeue)
and the main operation queue on the
[main thread](https://developer.apple.com/documentation/foundation/operationqueue/main).
These API contracts motivate the scheduling; they do not prove this native
bridge's runtime behavior. This is source-level scheduling, not runtime thread proof. Full-resolution
decodes still execute on the UI queue and can stall it; downsampling and an
image-engine backend remain work. Uncached local decode remains deferred to a
later turn. Cached hits skip pending placeholders; failures retain a local
placeholder or clear the view. Native callbacks, queue behavior, cancellation
and memory retention are not qualified by the authored tests.

Core Image.macos now normalizes ClassValue and preserves its declared
LayoutChildProps and style forms using the existing shared helpers. The
optional image package delegates to this core leaf instead of maintaining a
second incomplete copy. The native placeholder intrinsic declaration moved
to the core owner. No public Image ref was added: the current shared ImageProps
does not expose one. Source arrays still choose their first entry; cover,
position and decode-hint behavior remain incomplete. Engine headers, cache
policy, decode bounds, transitions, failureImage and load/error callbacks are
still missing; cache APIs remain unchanged/unsupported.

Added platform-free coordinator, fake-queue remote and object-driver layout
regressions plus a maintained nonvisual lifecycle probe. Syntax and whitespace
checks passed. No tests, typechecks, builds, probe/OS automation, visual analysis,
image downloads, dependency installs or packaging ran. Shared snapshots remain
untouched; no evidence checkbox is closed.

Deferred commands:

```sh
pnpm exec turbo run test --filter=@octane-xplat/macos-renderer
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/image.macos.mobile.test.tsrx
pnpm exec turbo run typecheck --filter=...@octane-xplat/macos-renderer --filter=...@octane-xplat/ui --filter=...@octane-xplat/image
pnpm exec turbo run typegen --filter=@octane-xplat/ui --filter=@octane-xplat/image
pnpm exec turbo run test:packed --filter=@octane-xplat/image
pnpm probe run examples/probes/image-loading.macos.tsrx --target macos --watch
pnpm check:recipes
```

After human authorization, qualify real URLSession main-queue delivery,
connection/setup/HTTP/decode failure, cancellation and late completions, shared
requests, local placeholders, repeated mounting, bounded memory, large-image
responsiveness, parent layout/classes, SVG behavior on the actual OS, packaged
resolution and teardown. Pixel checks still require separate visual-analysis
authorization; none is requested or implied here.

## AppKit Services screen reconciliation

The macOS app selects Services.macos.tsrx, so updating the shared Services
screen alone did not expose the new settings service there. The native leaf
now has an explicit System Settings action with support/availability/failure
feedback and no automatic launch. Paste now reads independently of canCopy;
copy failures no longer masquerade as unsupported capability. Results arriving
after owner teardown do not update the clipboard/settings status or launch
settings. These are source changes; no service was invoked by this task.

The screen's picked preview now releases its owned temporary file on
replacement/unmount, releases stale/late selection results, and rejects older
selection completions. A latest-result ref covers teardown before a state
commit. files.release is best-effort/idempotent and only deletes registered
app-owned media outputs; original picker source files remain outside that
ownership contract. Extras still release immediately. Real picker, teardown,
preview ordering and temporary-file cleanup remain unqualified.

Removed the static unsupported-service census, which contradicted file pickers
already present in the same screen and dedicated source leaves. Connectivity
retains its own capability-derived status. This change adds no new claim that
the removed service names are runtime-qualified.

Syntax and whitespace checks passed. No tests, app build, native launch,
clipboard read/write, file picking/deletion, settings launch, OS automation or
visual analysis ran. The affected recipes are appkit-settings,
keyboard-clipboard AC2 and pick-and-capture-images AC3. Native flow verification is deferred:

```sh
pnpm dev:macos
pnpm exec turbo run typecheck --filter=...@xplat/app
pnpm probe run examples/probes/open-settings.macos.tsrx --target macos --watch
pnpm probe run examples/probes/image-loading.macos.tsrx --target macos --watch
pnpm check:recipes
```

After explicit human authorization, run the AppKit Services route: copy-only
and read-only hosts, rejected writes, empty/failed reads, Settings launch/failure,
image selection/cancel/replacement, screen removal with a pending picker,
preview file ownership, repeated teardown and HMR. The retained probes do not
replace that screen-level native workflow qualification.

## Image fit and content position

Priority assumption: cover is already the shared Image default, so its prior
AppKit degradation affects normal images whenever the app omits contentFit.
Contain-fit previews in Services.macos and shared Image consumers in Home make
bitmap sizing an existing app flow, before niche media/GPU integrations.

The AppKit NSImageView subclass now uses NSImage's public drawing API for
styled image content. It retains native image ownership, intrinsic measurement,
accessibility and pointer hit-testing. Cover/contain/fill/none/scale-down compute
a logical-point destination rectangle, and keyword/point/percentage positions
align it in the view box. Percentages apply over free space, including negative
space when cover crops. Drawing clips to the view bounds, converts top-based
positions for flipped/unflipped contexts, and restores graphics state in a
finally block. The subclass explicitly chooses drawRect for layer-backed content. A real
frame-size change invalidates drawing. Missing/empty images use the native
drawing path. Removing styles releases drawing overrides and restores the native scaling default/path.

The core Image leaf now serializes contentPosition through its shared helper;
the optional image package already delegates to core and inherits this path.
A prerequisite fix converts the shared typed 'center' edge value to 50%
instead of the invalid centerpx token, including web callers of that helper.
Conflicting edge fields now serialize with the existing contentAxisOffset
top/left precedence rather than emitting an invalid six/eight-value CSS form.
Raw CSS position parsing supports the one/two/four-value position forms with
keywords, px and percentages. Other units or unresolved expressions warn once
and center. This is a documented subset, not a full CSS parser.

API/source references: Apple's
[NSImage drawing contract](https://developer.apple.com/documentation/appkit/nsimage/draw%28in%3Afrom%3Aoperation%3Afraction%3Arespectflipped%3Ahints%3A%29)
scales to a destination rectangle and can respect the flipped context.
[NSView drawing-path selection](https://developer.apple.com/documentation/appkit/nsview/wantsupdatelayer)
selects drawRect when wantsUpdateLayer is false. The
[CSS position grammar](https://www.w3.org/TR/css-values-3/#position) separates
keyword/length pairs from four-value edge offsets. These references motivate
the source; they are not runtime or pixel evidence for the metadata bridge.

Added pure geometry/position, fake native drawing/context cleanup, subclass
resize/hit-testing, style apply/reset, and component-forwarding regression
cases, plus a maintained nonvisual fit probe. Syntax and whitespace checks
passed. No tests/typechecks, native build/probe, actual drawing, image download,
visual analysis, OS automation, dependency installation or packaging ran.
Source sets, decode scheduling/downsampling, engine/cache APIs and load/error
callbacks remain separate implementation gaps. Native crop/orientation/density,
resizing, shadows/borders/padding interaction and pixels remain unqualified.
Shared audit snapshots were not regenerated and no evidence checkbox is closed.

Deferred commands:

```sh
pnpm exec turbo run test --filter=@octane-xplat/macos-renderer
pnpm exec turbo run test --filter=@octane-xplat/ui -- src/image-content.test.ts
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/image.macos.mobile.test.tsrx
pnpm exec turbo run typecheck --filter=...@octane-xplat/macos-renderer --filter=...@octane-xplat/ui --filter=...@octane-xplat/image
pnpm exec turbo run typegen --filter=@octane-xplat/ui --filter=@octane-xplat/image
pnpm exec turbo run test:packed --filter=@octane-xplat/image
pnpm probe run examples/probes/image-fit.macos.tsrx --target macos --watch
pnpm check:recipes
```

After human authorization, qualify raster/SVG/placeholder swaps, actual drawRect
registration and graphics-state restoration, all fits/position forms, live resize,
style removal, flipping/orientation, logical points/backing density, image-driven
intrinsic layout, clipping/corners/borders, pointer passthrough, repeat teardown
and packaged/HMR behavior. Pixel/visual comparison requires separate visual-
analysis authorization; retained probes do not authorize or prove it.


### Media upload documentation cleanup

The shared multi-selection example now awaits each byte read before releasing
its temporary references. Previously, returning Promise.all directly from a
try/finally released the files immediately; even awaiting Promise.all would
release other pending readers after the first rejection. Sequential reads
finish or fail before cleanup starts. No public API changed.

Removed the stale claim that pickers return an upload data URL: the current
PickedImage contract is `{ name, uri }`, and uploads use files.readBytes.
The pick-and-capture-images AC3 data-URL requirement remains unresolved and
its partial documentation coverage is preserved. This correction does not
qualify native file/picker timing or close a runtime checkbox.

Whitespace and snippet syntax were checked only. Deferred: `pnpm check:recipes`
and native picker/read/cleanup runs; no test, typecheck, build, packaging,
automation or visual analysis ran for this documentation correction.


### Image resolution candidate selection

Priority assumption: shared Image declares resolution-qualified source arrays;
retina avatars and bounded collection thumbnails are common desktop app flows.
AppKit previously always selected the first item. It now reuses bestImageSource
with its image bounds in logical points and its own window's backing scale.
An unattached image initially selects by declared density at scale 1. Native
frame changes, window attachment and backing changes notify a dedicated image
callback independently of margin-host layout notifications. Notifications are
coalesced after the native callback stack; identical measurements do not rerender.
Removed handlers/views cancel queued delivery. Source replacement uses current
props and the existing request generation/cancellation lifecycle.

The bridge follows Apple's public NSView lifecycle methods:
[viewDidMoveToWindow](https://developer.apple.com/documentation/appkit/nsview/viewdidmovetowindow%28%29)
and [viewDidChangeBackingProperties](https://developer.apple.com/documentation/appkit/nsview/viewdidchangebackingproperties%28%29).
These API references are design evidence only. Object-driver selection,
coalescing/deduplication, rebind, teardown, detached/invalid metrics and native
subclass signal regression cases are authored but have not run. Stable styled
boxes are the documented path. Actual retina density, cross-screen moves,
intrinsic-only source-set feedback/layout, native callback registration and
packaging remain unqualified. Decode hints, downsampling and engine/cache APIs
remain gaps. No shared audit snapshot or evidence-gated checkbox was changed.

Syntax and whitespace checks only. Deferred commands:

```sh
pnpm exec turbo run test --filter=@octane-xplat/macos-renderer
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/image.macos.mobile.test.tsrx
pnpm exec turbo run typecheck --filter=...@octane-xplat/macos-renderer --filter=...@octane-xplat/ui --filter=...@octane-xplat/image
pnpm check:recipes
```

After human authorization, qualify candidate swaps with a fixed box, live resize,
backing-scale/window changes, in-flight cancellation, empty/string replacement,
owner teardown and intrinsic-only layout. No tests/typechecks/builds, native or
OS automation, installs, packaging or visual analysis ran in this slice.


### Multiline submit and blocked text edits

Demand: Home already exercises TextInput and TextArea. The AppKit TextArea
leaf dropped onSubmit even though the renderer already implements done/send
Return handling. It now forwards those actions only when enabled/editable;
other Return types retain newline behavior. Both text controls ignore edit
callbacks while disabled/read-only. The multiline delegate also rejects submit
interception while hasMarkedText reports composition, accepting either method
or BOOL bridge form. This does not alter the single-line field-editor path.

Apple's [text-input marked-state contract](https://developer.apple.com/documentation/appkit/nstextinputclient/hasmarkedtext%28%29)
and [command delegation guide](https://developer.apple.com/library/archive/documentation/Cocoa/Conceptual/TextEditing/Tasks/InterceptKeys.html)
provide API evidence only. Added object-driver leaf and fake-delegate cases;
they are unrun. Syntax/whitespace only; no native keyboard, IME, selection,
VoiceOver, build, packaging or OS automation ran. TextArea maxLength and
standalone field chrome remain separate source gaps at this commit.

Deferred commands:

```sh
pnpm exec turbo run test --filter=@octane-xplat/macos-renderer
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/text-controls.macos.mobile.test.tsrx
pnpm exec turbo run typecheck --filter=...@octane-xplat/macos-renderer --filter=...@octane-xplat/ui
pnpm check:recipes
```

Real native Return/newline, done/send actions, marked-text confirmation,
controlled edits/selection and disabled/read-only interactions require later
human-authorized platform qualification. No evidence checkbox is closed.


### Standalone text field metadata and layout

TextInput and TextArea previously resolved labels/accessibility state but never
rendered standalone visible label, description or status. Their AppKit controls
now compose through the existing native FormField, with no nested wrapper when
an ancestor Field owns the metadata. SearchInput delegates to TextInput and
inherits this behavior. Standalone field width is applied to its owner; the
imperative handle still belongs to the inner editing view. Required/optional,
hidden label, status variant, disabled/read-only/loading and hint ownership are
forwarded through the existing shared field context.

Prerequisite repairs in the AppKit FormField leaf: the default flex layout now
specifies column so label/description/control/status stack vertically; authored
CSS strings pass through mergeStyle instead of being dropped by styleRecord.
The multiline shell also specifies its column layout explicitly. Existing
horizontal-label arrangements retain their explicit row/column structure.
Source impact includes native Field callers such as date/range/time/typeahead
and InputGroup; this is a deliberate normalization repair, not a runtime pass.

Added object-driver coverage for standalone metadata, inherited disabled/hints,
one enclosing wrapper, hidden label naming and CSS-string preservation. These
cases are authored but unrun. Syntax/whitespace checks only. Deferred commands:

```sh
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/text-controls.macos.mobile.test.tsrx
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
pnpm check:recipes
```

Native field layout, label pointer/focus behavior, actual sizing, status changes,
VoiceOver, keyboard/IME and packaging remain unqualified. The existing horizontal
label, InputGroup, date/time and typeahead callers need later native regression
coverage. TextArea maxLength and SearchInput icon rendering remain source gaps;
none of this closes AC3's physical-keyboard/assistive-technology gate.


Field ownership follow-up: standalone controls retain their Field owner even
when no label/status is supplied yet. Adding a validation message after an edit
therefore does not change the control's component ancestry and reset its
uncontrolled text/ref. Added an unrun object-driver identity/state regression
for adding and removing metadata. Syntax and whitespace only; the same deferred
text-control and native layout/IME/focus checks above apply.


### Controlled native text echoes

While investigating composition-safe TextArea limits, source review found the
AppKit value-prop branch always reassigned NSTextField.stringValue or
NSTextView.string, even when the real editor already held the echoed text.
It now compares the current native string before writing. This avoids an
unnecessary setter call during normal controlled edits; changed external
values still write through. It does not implement deferral of different
external values during IME composition or qualify selection/marked text.

Added a setter-count regression for both native control paths. Syntax and
whitespace only; tests are unrun. Deferred commands:

```sh
pnpm exec turbo run test --filter=@octane-xplat/macos-renderer
pnpm exec turbo run typecheck --filter=...@octane-xplat/macos-renderer
```

Native typing, middle-selection edits, IME echo/candidate confirmation,
external changes during composition and packaged behavior remain unqualified.
TextArea maxLength remains an implementation gap; no native truncation scheme
has been claimed or qualified by this prerequisite fix.


### Search and single-line entry affordances

AppKit SearchInput previously ignored icon/default glyph/false, because its
TextInput delegate did not render startIcon. TextInput now uses the AppKit Icon
leaf for glyph names and accepts a supplied node. SearchInput wires default
xplat-search, registered names or no icon; it retains its existing controlled/
uncontrolled clear/submit path. Omitted/empty placeholders are preserved instead
of inventing Search text. TextInput also forwards placeholderTextColor and
returnKeyType to the existing renderer prop paths.

Import alignment: controls.macos now pins usePan to pan.macos.tsrx. The native
AppKit resolver already prefers that suffix; this is not evidence of a failing
production import. The explicit leaf also lets the mobile-oriented object-driver
test resolver import AppKit controls without selecting pan.tsrx, which imports
NativeScript core and normalizes a mobile payload. No shared/Windows/GTK source
changed.

Added default/custom/no-icon, supplied-node, placeholder and return-key metadata
regression source. Syntax and whitespace only; tests are unrun. Deferred:

```sh
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/text-controls.macos.mobile.test.tsrx
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
pnpm check:recipes
```

Real glyph presentation/layout, icon pointer/accessibility behavior, keyboard
submission/IME, focus preservation during icon changes, the Slider pan import
and packaged consumers remain unqualified. TextArea maxLength is still an
implementation gap: partial-composition truncation, paste/replacement, undo,
selection and external controlled writes need a coherent native edit contract;
none has been claimed by this source slice.


### AppKit scroll and measurement coordinates

Demand: Home embeds bounded ScrollableArea content, and VirtualListBench and
chat exercise everyday seek/anchor flows. Source review found UI metrics,
ScrollableArea/VirtualList/chat seeks and window-content measurement reading
isFlipped, while the generated NSView declaration exposes readonly flipped.
These reads now use the actual bridge property. Apple's [ObjC coordinate
property](https://developer.apple.com/documentation/appkit/nsview/isflipped?language=objc)
is named flipped with getter=isFlipped; generated metadata is source evidence,
not a runtime test or a newly diagnosed upstream bridge defect.

ScrollableArea, VirtualList and chat now share scrollableAreaOffset.macos:
clamp requested axes, keep omitted origins, ignore invalid/empty requests,
leave absent view/documents alone and fall back to the real clip when an
animator proxy lacks scrollToPoint. Short unflipped content clamps to zero
instead of generating a negative Y. VirtualList block seeks retain X rather
than resetting it. ScrollableArea also normalizes its ClassValue before the
raw intrinsic, consistent with the native className contract.

Updated fake native shapes to the generated property and authored round-trip
metrics/seeks, clipping/short-content, animator fallback, invalid requests,
nonzero window-content origins and composed-class regression cases. Syntax and
whitespace only; no tests or native interaction ran. Deferred commands:

```sh
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/appkit-scroll-geometry.mobile.test.ts src/scrollable-area-appkit.mobile.test.tsrx src/chat-scroll-host.macos.mobile.test.ts
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
pnpm check:recipes
```

Real native scroll origin/resize/animation, variable-row anchoring, route state
retention, elastic scrolling, coordinate conversion and packaging remain
unqualified. No pixels, OS automation, native build, installs or shared audit
regeneration ran, and no evidence checkbox is closed.


### Renderer coordinate property alignment

The same generated-property mismatch remained in observeScrollGeometry's
initial/axis positioning, pan Y normalization, gradient resize direction,
anchored-window-layer positioning, scroll/list/parity benchmark snapshots and
the content-lifecycle fixture's coordinate helper. These target-specific paths
now read NSView.flipped, matching the generated readonly property and the UI
repair. Existing fake scroll/layer/pan/gradient shapes now use that property.
No runtime fallback/compatibility API or shared audit regeneration was added.

Affected source regression cases include initial flipped/unflipped scrolling,
axis changes, notification teardown, pan/swipe direction and anchored layers;
they are not executed in this task. Syntax/whitespace only. Deferred:

```sh
pnpm exec turbo run test --filter=@octane-xplat/macos-renderer
pnpm exec turbo run typecheck --filter=...@octane-xplat/macos-renderer
```

Native subclass getter dispatch, scrollbar/elastic/resize behavior, pan/swipe
input, vertical gradient pixels, anchored placement, benchmark geometry and
content-lifecycle runtime remain unqualified. No visual analysis, builds,
OS automation, device/native probes, tests, installs or packaging ran.


### AppKit TextArea length limits

Demand: Home's multiline composer and the shared TextAreaProps contract make
bounded notes/pastes a common form need. AppKit previously dropped maxLength.
The leaf now forwards it, and the renderer remembers pre-edit text/range through
its existing NSTextView delegate. Native text changes remove only the excess
inserted portion, preserve the unchanged prefix/suffix, remap the current
selection and guard the correction's nested notification. Native should-change
approval brackets text-storage mutation with didChangeText; a veto leaves the
native text unchanged. Reentry guards release even after failure.

Marked input remains untouched while hasMarkedText is true. A committed change
normalizes before its public callback; the native subclass's unmarkText also
normalizes when committing does not send another change event. Programmatic
initial/external values remain unchanged, zero rejects added units, invalid or
omitted caps are inactive, and native ranges/lengths count UTF-16 units. A cut
avoids half a surrogate pair; this is not a grapheme-count validator. Native
edits without a captured range use a prefix/suffix comparison fallback.

API evidence: Apple's [text-editing protocol](https://developer.apple.com/library/archive/documentation/TextFonts/Conceptual/CocoaTextArchitecture/TextEditing/TextEditing.html)
requires should-change/did-change bracketing for text-storage mutations, and
[unmarkText](https://developer.apple.com/documentation/appkit/nstextinputclient/unmarktext%28%29)
accepts pending marked input. Ecosystem reference: [React Native macOS's input
limiter](https://github.com/microsoft/react-native-macos/blob/main/packages/react-native/Libraries/Text/TextInput/RCTBaseTextInputView.mm)
also budgets insertion length against the replaced range and retains surrounding
text. Our helper is an independent TypeScript implementation; no dependency or
third-party code was copied. These references do not qualify our bridge or IMEs.

Added pure-range, fake text-storage/selection/veto/failure, delegate nested-event,
explicit-unmark and leaf-forwarding regression source plus a maintained nonvisual
native-API probe. None has run. Syntax and whitespace only. Deferred commands:

```sh
pnpm exec turbo run test --filter=@octane-xplat/macos-renderer
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/text-controls.macos.mobile.test.tsrx
pnpm exec turbo run typecheck --filter=...@octane-xplat/macos-renderer --filter=...@octane-xplat/ui
pnpm probe run examples/probes/text-limit.macos.tsrx --target macos --watch
pnpm check:recipes
```

Real insertion/paste/drag and replacement routing, marked/unmark notifications,
undo/redo grouping, selection, native callback registration, correction-event
ordering, larger text and packaging remain unqualified. The retained probe drives
native methods directly and cannot prove physical keyboard or actual IME behavior.
Different external controlled values arriving during composition are still not
deferred. No visual analysis, builds, tests, native probes, OS automation,
installs, packaging or shared audit snapshot regeneration ran. No evidence gate
is closed by this source slice.


Length-limit event follow-up: value dispatch compares the last reported string,
so a wholly rejected edit does not repeat onChange with the same value. If marked
input was already reported temporarily, restoring the prior text still reports
that restoration. Added a source regression for this distinction. Cap prop
reapplication initializes only once and does not erase a pending edit snapshot.
All checks remain syntax/whitespace only; event timing/IME remain unqualified.


### Controlled values during native composition

Demand: Home uses controlled TextInput/TextArea, so an async replacement or
formatter can otherwise overwrite an unfinished IME candidate. Different value
writes now wait while the live editor has marked text; native textfield reads
use currentEditor.string instead of assuming the control's stringValue is live.
One pending latest value, one cancellable flush and one window observer belong
to the view only while needed. Matching latest echoes, unset values and teardown
cancel pending work. Edit/end/submit/unmark notifications and window updates
wake the flush after the native callback stack. A new composition delays it
again. Changed writes reuse the host without requesting focus, synchronize an active
field editor and clamp selection when it survives the setter, and refresh multiline placeholder/growth/limit state.
Synchronous programmatic notifications are suppressed while writing.

Apple's [NSWindow update contract](https://developer.apple.com/documentation/appkit/nswindow/update%28%29)
and [window notification](https://developer.apple.com/documentation/appkit/nswindow/didupdatenotification?language=objc)
provide an observation path when unmark does not send another text change.
Observers are scoped to the current window and removed after resolution or
cancellation. These API references are not native delivery evidence.

Added fake-scheduler latest-value, matching/unset, committed-echo, new-composition,
late-callback, teardown, equal-write and failure cases; fake native adapters cover
field-editor reading, selection clamping and observer ownership. Added a manual
native fixture with delayed replacements and a real-keyboard procedure in the
text-entry recipe. Its run hook records initial strings only. All tests and
native execution are deferred; syntax/whitespace only. Deferred commands:

```sh
pnpm exec turbo run test --filter=@octane-xplat/macos-renderer
pnpm exec turbo run typecheck --filter=...@octane-xplat/macos-renderer
pnpm probe run examples/probes/controlled-text.macos.tsrx --target macos --watch
pnpm probe run examples/probes/text-limit.macos.tsrx --target macos --watch
pnpm check:recipes
```

Raw NSSearchField's text API is not changed. Actual IME event ordering,
field-editor lifetime, window moves, secure-cell changes, selection, focus,
undo/redo, observer/callback teardown and packaging remain unqualified. No
visual analysis, OS automation, builds, tests, native probes or installs ran.
No shared audit snapshot or evidence-gated checkbox changed.


Deferred-writer source cases also cover nested writes (suppression stays active
until the outer write returns) and simulated programmatic native notifications
that must not call public onChange. These cases are authored, not executed.


Observer ownership detail: detached views do not register an unfiltered global
window observer. Attached views watch the window present when the pending write
begins; replacement pending values reuse that observer. Native unmark/end hooks
remain available, and changing windows during composition is unqualified.


Single-line submit follow-up: textFieldSubmitted now checks its current field
editor's marked-text state, and raw NSSearchField Return delegation does the
same. Confirmation remains with the input context while marked; unmarked submit
retains its action. Added fake method/BOOL marked-state regression cases; syntax
and whitespace only, not OS keyboard/candidate or native-action qualification.
The deferred writer's scope remains core textfield/textview values; raw search
text synchronization itself is unchanged. The same deferred renderer test and
native composition commands above apply.


### AppKit object-driver resolver prerequisite

While adding NumberInput source coverage, inspection found the shared native
Vitest configuration preferred iOS/mobile suffixes even for explicit AppKit
component tests. Transitive unsuffixed imports (for example FormField → Tooltip
→ View/pan or escape-props) could therefore select mobile NativeScript imports.
This is a test-config source finding, not a claim that the production AppKit
resolver failed: the CLI already uses macos/native conditions and macOS suffixes.

The UI native test configuration now selects an explicit macOS mode via
XPLAT_UI_TEST_TARGET=macos. Target-specific options retain the CLI's macOS/
unsuffixed extension order and route AppKit patterns to this mode. Default mobile
Vitest mode excludes those same patterns. The UI Turbo test:native task declares
the env variable for passing/hash separation; no package manifest, CLI file or
Windows/GTK source changed. The unchanged Node-test prelude still runs in either
mode, and Turbo prerequisites can build dependencies. Existing deferred UI
AppKit test commands in this note now include the target prefix.

Config/source syntax, JSON parsing and whitespace only. No Vitest collection,
Turbo task execution/cache validation, tests, builds, typechecks, installs or
native automation ran. Deferred after human authorization:

```sh
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/input-number.macos.mobile.test.tsrx
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/text-controls.macos.mobile.test.tsrx src/scrollable-area-appkit.mobile.test.tsrx src/image.macos.mobile.test.tsrx
pnpm exec turbo run test:native --filter=@octane-xplat/ui
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
pnpm check:recipes
```

Actual target file collection, dependency resolution, compiler transforms and
both modes' execution remain unverified. Prior authored AppKit cases are still
unrun; adding a selectable mode does not close a native or test evidence gate.


### AppKit NumberInput affordances and Field ownership

Demand: ComponentsDemo already uses NumberInput with bounds; numeric quantities
and optional values are everyday forms. The AppKit leaf dropped units,
formatValue, hasNumberSteppers and hasClear from its declared prop contract.
Those props now render the existing web-shaped affordances, including null
before onClear and controlled-null precedence over a default. Existing bounded
step math and parseFloat editing semantics are unchanged.

NumberInput now resolves shared Field state before enabling step/clear/edit
actions. Standalone metadata belongs to a stable FormField; an existing parent
Field keeps ownership. Generated input IDs avoid duplicating a compound root
ID, and explicit parent control IDs address the real text field. The inner
TextInput inherits name/hint/status/state through the existing context. Changing
metadata or stepper visibility is intended to preserve the editing host.
The row specifies flexDirection/center alignment and preserves ClassValue and
object/inline-CSS style normalization. No shared/native-mobile/default parser,
UI package manifest, CLI or other target leaf changed.

Added source cases for display/units, option removal, null/default precedence,
controlled requests, clear ordering, clamped uncontrolled steps, Field blocking,
metadata/ID ownership and host retention. Added a maintained nonvisual native
fixture with initial metadata and a handler-driven option toggle. Syntax and
whitespace only; no tests or probe ran. Deferred after human authorization:

```sh
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/input-number.macos.mobile.test.tsrx
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
pnpm probe run examples/probes/number-input.macos.tsrx --target macos --watch
pnpm check:recipes
```

AppKit test-mode collection/resolution is still unverified. Actual control
layout, formatted/partial/locale entry, float stepping precision, IME, clear and
step hit testing, keyboard activation, focus/selection, VoiceOver and packaging
remain unqualified. formatValue is display-only and has no inverse parser.
No native/OS automation, visual analysis, builds, typechecks, installs or shared
audit regeneration ran; no evidence checkbox is closed.


### Pan location prerequisite for common controls

AppKit's usePan adapter previously assigned x/y from deltaX/deltaY, losing the
pointer location needed to choose a range-slider thumb. The renderer now reads
NSPanGestureRecognizer.locationInView and converts through the view's bounds to
top-left logical points; translation and velocity stay independent deltas.
The renderer event carries actual x/y fields. Final contract review retained
the shared adapter's documented x/y aliases for dx/dy and exposes actual
position as optional locationX/locationY (currently AppKit only). Apple's [pan recognizer
contract](https://developer.apple.com/documentation/appkit/nspangesturerecognizer?language=objc)
specifies the current mouse point; the [location API](https://developer.apple.com/documentation/appkit/nsgesturerecognizer/location%28in%3A%29)
returns the chosen view's coordinate system. These references are source evidence.

Added flipped/unflipped, nonzero-bounds source cases. Syntax/whitespace only;
regressions and real input remain unrun. Deferred commands:

```sh
pnpm exec turbo run test --filter=@octane-xplat/macos-renderer
pnpm exec turbo run typecheck --filter=...@octane-xplat/macos-renderer --filter=...@octane-xplat/ui
```

Actual recognizer location, gesture threshold/delta origin, nested hit testing,
flipping/transforms and OS pan/swipe behavior remain unqualified. No Native/OS
automation, visual analysis, builds, tests, installs or audit regeneration ran.


### Fractional Slider readout prerequisite

The web Slider default formatter rounded every readout to an integer, so the
existing volume-style 0..1 example could display 0.5 as 1. Default readouts now
use the actual number string; custom formatValue remains unchanged. Added an
unrun web component source case. The introducing source commit 39a594966 has
no containing local stable tag, so no stable-fix note was added. Syntax and
whitespace only; deferred: `pnpm exec turbo run test --filter=@octane-xplat/ui -- src/Slider.web.test.tsrx`
and `pnpm exec turbo run typecheck --filter=...@octane-xplat/ui`.
This keeps the new AppKit readout's default aligned with the web source; it is
not browser/native runtime or pixel evidence.

### AppKit settings and range sliders

Demand: ControlsDemo uses a controlled bounded Slider; the public volume
example uses a fractional 0..1 range. The previous AppKit leaf ignored the
shared min/max/step/defaultValue contract, collapsed pairs to their high value
and had no per-thumb hardware-key behavior. A dedicated AppKit leaf now owns
scalar/uncontrolled/controlled values, noncrossing pairs, explicit bounds,
positive steps, Field metadata/blocking, marks, fractional/custom text readouts
and AppKit hover tooltips. The control palette was extracted without changes.
Static layout stays in scoped macOS CSS; no dependency was added. Shared
PanEvent adds optional AppKit-only locationX/locationY while preserving its
existing x/y drag-delta aliases. Portable dragging should continue to use dx/dy.
The props comment now distinguishes AppKit's source implementation from the
remaining single-value native subsets.

Each thumb has a real focus action, hardware-key handlers and adjustable
accessibility metadata/actions. Arrows use the explicit step or 1% of the full
range; Home/End request the selected thumb's current bounds. Dragging measures
the track, selects the nearest thumb from pointer location and applies cumulative
distance. It does not jump on track taps. Equal-distance ties choose by drag
direction. Range thumbs cannot cross; duplicate terminal notifications are
suppressed. Controlled drag previews reset on end/cancel; parents must accept
change requests. Step rounding intentionally matches web's existing zero-origin
grid, including existing floating-point precision limitations.

Added object-driver source cases, a maintained initial-metadata native fixture,
a recipe, public guidance, skill guidance and a release note. Test-mode resolution
is still unverified. Syntax parsing and whitespace only; no tests/probes ran.
Deferred until this task receives explicit human authorization:

```sh
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/slider.macos.mobile.test.tsrx
pnpm exec turbo run test --filter=@octane-xplat/ui -- src/Slider.web.test.tsrx
pnpm exec turbo run test --filter=@octane-xplat/macos-renderer
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui --filter=...@octane-xplat/macos-renderer
pnpm probe run examples/probes/slider.macos.tsrx --target macos --watch
pnpm check:recipes
```

Real pan thresholds/location/deltas, nested hit testing, Tab/focus, keyboard input,
VoiceOver/range labeling, hover tooltip timing, marks/layout/clipping, CSS
resolution, pixel parity and packaging remain unqualified. The fixture's run
hook checks initial metadata only, not input. No builds, installs, native/OS
or browser automation, visual analysis or shared audit regeneration ran.
No issue evidence checkbox is closed.


### AppKit switch save actions

ControlsDemo uses Switch for everyday state; the public SwitchProps contract
also promises changeAction and rollback. The existing AppKit leaf already
handled controlled/default values and Field gates but silently ignored the
save action. It now calls onChange then changeAction, marks pending busy,
blocks overlapping saves with a synchronous token, and restores the previous
uncontrolled state/calls onChange(previous) on rejection or synchronous action
failure. Controlled parents own display feedback. Teardown invalidates the token
so a late completion cannot set state or issue a rollback callback. No native
layout/label-position behavior was expanded by this slice.

Added focused source cases for order, success, failure, controlled display,
concurrent taps, inherited gates and teardown, plus guide/skill/recipe/release
coverage. Syntax and whitespace only; no tests/probes ran. Deferred:

```sh
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/switch.macos.mobile.test.tsrx
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
pnpm check:recipes
```

Actual click/key activation, focus retention, busy/loading appearance,
accessibility, native event timing, layout and packaging remain unqualified.
The existing AppKit standalone label layout/labelPosition/labelSpacing subset
still needs a separate implementation review. No builds, installs, tests,
OS automation, visual analysis or shared audit regeneration ran.


### AppKit switch labels and metadata

Standalone Switch previously exposed its name to accessibility but never drew
label/description/status, ignored label side/spacing and hard-coded 48x28 over
the shared 40x24/32x20 geometry. A dedicated Switch.macos leaf now keeps one
stable state/action owner and track host, renders standalone text through the
existing AppKit FormField renderer (including marker/tooltip), and renders
status detached below. An enclosing Field owns metadata instead. Hidden text
keeps its accessible name. A stable wrapper prevents metadata changes from
resetting uncontrolled state; CSS row reversal changes label side without
reordering the toggle host. Classes/styles now target the compound root and
preserve ClassValue/inline-CSS forms; id/testID still name the actual switch.

Static track/row/thumb geometry uses scoped macOS CSS plus existing shared size
classes. The palette and action token/rollback behavior are unchanged. Source
cases cover standalone/parent metadata, required/error state, names, class/style
forms and host/state retention across size/side/hidden changes. Added a maintained
initial-metadata/direct-dispatch fixture. Label-click activation remains a real
gap; source implements track activation only. Busy still reports state/classes;
loading appearance needs separate qualification. No pixel parity is claimed.

Syntax/whitespace only; tests and probes unrun. Deferred commands:

```sh
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/switch.macos.mobile.test.tsrx
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
pnpm probe run examples/probes/switch.macos.tsrx --target macos --watch
pnpm check:recipes
```

Actual CSS resolution/size geometry, status/tooltip layout, long text/wrapping,
RTL, hit testing, focus/Tab, VoiceOver, loading presentation and packaging remain
unqualified. No builds, tests, installs, OS automation, visual analysis or shared
audit snapshot regeneration ran. Source audit rows are left historical.
