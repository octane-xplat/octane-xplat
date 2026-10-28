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
pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/grid-list.macos.mobile.test.tsrx
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
