# Historical qualification report

Frozen on 2026-10-30 from `.agents/docs/parity/appkit-progress.md`. This is evidence history,
not current guidance. Task-local approval gates, planned commands, and status
claims below describe their original checkpoint; later entries may supersede
earlier ones. Use the [current guidance](../../../.agents/docs/parity/appkit-progress.md)
for maintenance decisions. Paths were updated for the artifact relocation.

# Native macOS implementation progress

Target: native AppKit, issue #62. The immutable audit at `720c9ef93`
remains a source snapshot; do not regenerate shared snapshots while the
three desktop tasks share this checkout.

## AppKit native platform event dispatch

The preceding responsive/lifecycle prerequisite is pushed as dd3a573d7. Its
native host still iterated live listener sets directly: mutation/re-registration
during a callback could extend that same iteration, and one synchronous throw
could abort other resize/activity/link readers. Duplicate callbacks shared a
single Set entry, so one cleanup removed both callers. Initial link subscription
added its listener before draining all pending URLs; a throw leaked the listener
and lost the failed/unattempted queue. These are source findings, not observed
AppKit failures.

The private proving host now uses a pure membership-snapshot notifier, checks
removal before invoking each captured registration, and isolates synchronous
live consumer throws. It does not await async work or serialize nested native
events. Activity is committed before notification; resize captures one window
payload for the broadcast. Each registration has a unique dispatch closure and
active flag, so duplicate callbacks are independent and removal/re-registration
cannot revive a former lease. Cleanup retires before removing the Set entry and
is idempotent. No error text, URL or application value is logged by the helper.

Incoming URLs still queue when no readers exist. Registration still drains its
pending snapshot synchronously. Initial handler failure disposes that lease,
restores the failed/unattempted URLs before any newer pending queue, and rethrows
the original error. URLs whose callbacks returned normally are not replayed;
that is invocation, not navigation acknowledgement. A repaired handler/new
subscription or explicit consume owns retry. Native cross-event ordering,
async rejection handling and signed OS URL-scheme delivery remain separate.

Seven new models execute the actual extracted AppDelegate/service installer and
pure helper against fake NSObject/NativeClass only when eventually run. They
cover activity/error isolation, duplicate/retired registrations, resize payload
and re-registration membership, next-URL link membership, consume-once queues,
initial failure restoration and retry without replay. All **UNRUN**. The existing
window fixture now loads the actual helper rather than omitting its new import;
other installer extraction cases only use announcement/storage methods and were
reviewed without adding unrelated mocks. These are JS policy models, not native
class registration, selector/BOOL bridge, OS dispatch or physical memory proof.

Demand comes from the maintained native route-link installer, Services activity
and responsive reader fixtures. Static graph lookup reports ambiguous/no indexed
link callers and incomplete dynamic delegate edges; exact native route source
and installer extraction references were reviewed. Public incoming-link guide,
Octane services reference and appkit-host-events recipe state the same contracts.
This changes the private @xplat/macos proving host and its source tests, not a
published runtime/API; no release note, dependency, native bridge engine, package
manifest, other-target code or audit snapshot was changed.

A separate source finding remains in packages/app/src/route-links.macos.ts: its
wired flag is set before subscription succeeds, cleanup is discarded and async
navigation work is voided without a rejection handler. The host fix does not
repair that caller's startup/owner policy. It is a follow-up ordinary navigation
seam, not a native runtime failure or proof that every route consumer is broken.

Exact deferred commands; run only after this human's explicit go-ahead:

```sh
pnpm exec turbo run test --filter=@octane-xplat/platform
pnpm exec turbo run typecheck --filter=...@octane-xplat/platform --filter=@xplat/macos
pnpm exec turbo run test:packed --filter=@octane-xplat/platform
pnpm probe doctor
pnpm probe run examples/probes/platform-state.macos.tsrx --target macos --watch
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"AppKit platform event package"}' -- pnpm exec turbo run package --filter=@xplat/macos
pnpm check:recipes
pnpm check:docs
pnpm check:doc-examples
```

Platform has no standalone typecheck; @xplat/macos does. Turbo may prepare SDK/
generated/dependency sources, and platform test glob includes packed work. All
remain deferred. Docs checker scripts remain absent from this snapshot; no
shared in-flight tooling was copied. Permitted checks: four TS/MJS syntax files,
three scoped doc fences, ten local paths, source/semantic and whitespace review.
No tests/transforms/builds/typechecks/probes, OS link launch/resize/activity,
input/IME/focus/AX/native subscription memory, visual analysis, installs or
packaging ran. Actual native delegate invocation, queue/notification behavior,
reentrant OS delivery and installed consumers remain unqualified. Coverage is
separate from not-run verification; all gates stay open and the goal is active.

## AppKit responsive and lifecycle purpose entries

Demand assumption: the maintained responsive-layout probe, Services environment
status, common safe-area layouts and shared screen components need window/activity
hooks before niche integrations. Source review found the AppKit root defined
useAppState/useWindowSize/useBreakpoints$ in index.macos.ts, outside the actual
AppKit preset's **/*.{tsx,tsrx} hook include. The mobile preset's broader TS rule
is different and must not be mistaken for AppKit's. Canonical screen/lifecycle/
safe-area/breakpoints subpaths still selected phone leaves, including Android
safe-area imports. The packed source lane skipped those macOS entries and used a
broader compiler include than the real preset. This is source evidence, not a
newly observed compile failure or runtime proof.

The root now reexports matching dedicated AppKit TSRX leaves for window size,
activity, zero insets and named width thresholds. Canonical and existing explicit
.ts/.tsrx spellings have macos runtime and generated-declaration conditions. Their
non-AppKit fallback paths retain existing extension/default selection; no shared
CLI/Vite files, dependencies, lockfile, other-target leaves or audit snapshots
were changed. Generated types remain deferred. No replacement API alias/shim.

A target-only source adapter caches sources by actual host and subscription
method identity. Snapshots copy/freeze valid finite nonnegative content dimensions,
derive orientation and retain identity until dimensions change, including native
in-place mutation. Invalid/throwing/missing reads preserve stable 0x0 fallback;
activity retains the existing active fallback and validates active/inactive/
background. This is primary-host-window scope, not per-view secondary-window scope.
No global-property polling/observation is introduced. A later render selects late
or replaced hosts/methods and retries a failed registration. Unknown capability
reporting remains the separate environment API; default active is not proof of
native activity support.

Independent native registrations preserve the host receiver, coalesce synchronous
acquisition notifications, retire held callbacks before cleanup, ignore stale
owners/methods and isolate event-time reader errors. Throwing native cleanup
cannot revive JS readers. A custom native hook that throws before returning its
cleanup cannot provide a handle for physical native removal; retired callbacks
are inert, but actual resource release remains a qualification boundary.

**Breaking alpha correction:** root useBackHandler now shares the lifecycle
leaf's void return, matching the existing mobile/web contract, instead of giving
a meaningless cleanup function. It remains Android-only interception with a
neutral AppKit body. Remove saved/called AppKit cleanup assignments. Window
snapshots are now frozen read values; copy them before modifying local data.
Public exported names and other hook signatures stay the same. Feature note,
platform guide/README, styling path and Octane services reference explain the
cutover, native scope, imports and defaults.

Eight source models and two expanded existing packed lanes are authored, all
**UNRUN**. Models isolate cache identity/immutability, invalid/getter failure,
current activity, receiver/duplicate reader ownership, cleanup/delivery failure,
synchronous registration/failure retry, stale host/method callbacks and exact
root-to-leaf identity including neutral contracts. They use TypeScript transpile
and fake useSyncExternalStore only when eventually run; no real Octane hook/
compiler/render/OS evidence. Packed source now includes all four canonical and
existing explicit entries, asserts selected AppKit/excluded phone paths and uses
the real TSX/TSRX include. Existing Bundler/NodeNext declaration lanes include
those imports; the macOS declaration fixture adds typed hook/back-return checks.
None has run. Static impact found no resolved hook test coverage and incomplete
callback edges; authored wiring checks do not retroactively prove old coverage.

The manual platform-state fixture compares root/purpose sizes, object identity,
activity, insets and width matches; a button mounts/unmounts readers and a text
field retains a draft during later manual resize. Mounting reads/subscribes the
hooks; its run method only waits for status, with no resize/activation/input
commands. Existing programmatic responsive-layout probe remains separately
unrun. Original appkit-responsive-layout AC1–AC3 are preserved; AC4–AC6 cover this
source import/lifetime/cutover path without weakening native evidence criteria.

Exact deferred commands; run only after this human's explicit go-ahead:

```sh
pnpm exec turbo run test --filter=@octane-xplat/platform
pnpm exec turbo run typecheck --filter=...@octane-xplat/platform
pnpm exec turbo run test:packed --filter=@octane-xplat/platform
pnpm exec turbo run pack:check --filter=@octane-xplat/platform
pnpm probe doctor
pnpm probe run examples/probes/platform-state.macos.tsrx --target macos --watch
pnpm probe run examples/probes/responsive-layout.macos.tsrx --target macos --watch
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"AppKit responsive hook package"}' -- pnpm exec turbo run package --filter=@xplat/macos
pnpm check:recipes
pnpm check:docs
pnpm check:doc-examples
```

Platform has no standalone typecheck; Turbo may prepare generated declarations,
dependencies and vendor checkouts. Packed checks install isolated consumers and
compile source/types, so remain deferred as heavy verification. Docs scripts
remain absent here; no shared in-flight tooling was copied. Permitted checks:
ten source/model/probe files and eight scoped documentation fences syntax parsed,
one manifest JSON parsed with twelve conditional source paths checked, nineteen
local documentation paths, source/semantic and whitespace review. Generated type
paths were checked as mappings only; their existence/shape is not verified.
No tests, compiler transforms, builds, typechecks, native probe/OS/input/IME/
focus/AX/subscription memory, visual analysis, installs or packaging ran. Actual
native resize/activity, root/purpose rerender, browser/phone regression, generated
public types and clean installed consumers remain unqualified. Coverage stays
separate from not-run verification; all qualification checkboxes stay open and
the persistent goal remains active.

## AppKit keep-awake token and hook ownership

Demand assumption: the maintained reading/presentation example, existing public
keep-awake guide and media/document flows need bounded display-sleep ownership.
The retained date/time/native-window leaves already have source implementations
that still need qualification. This everyday service seam takes priority over
niche additions.
No native failure, physical power change or automation was observed/performed.

Source review found the AppKit backend advertised availability for a partial
NSProcessInfo and released tokens through whatever process bridge was current at
cleanup, losing the creating receiver/method after replacement. The target leaf
now checks both native methods without acquiring an activity token, captures each
token with its creating receiver/release method, and releases through that captured
pair even if the global disappears. Throwing release leaves the token/tag for
explicit retry; failed/null activation does not claim a held tag. The existing
serialized tagged helper and deduplicated tag semantics are unchanged.

The AppKit hook now reads current callbacks/warning preference through a stable
ref and owns its effect by tag alone. Options changes no longer deactivate and
reacquire a screen request. Tag replacement and unmount retire held callbacks
before optional listener cleanup, and schedule deactivation in finally even if
that cleanup throws. Cleanup is idempotent; rejected release produces the same
generic warning unless suppressed, using the preference captured when cleanup
starts. Native AppKit does not gain onRelease OS notifications: the optional
hook listener remains a web capability. Explicit tags still share a set entry;
independent screens should keep generated tags. No public type or export changes.

Four backend and three hook source models are authored, all **UNRUN**. They cover
cheap partial/late capability checks, original receivers and methods after host
loss/replacement, failed activation/release retry and duplicate tags, live options
without resource cycling, old callback retirement, key replacement, failed
listener removal and rejected cleanup. The hook model uses plain TypeScript
transpilation and fake hooks when eventually run; it is not Octane compiler/
real-effect or native-runtime evidence. Existing cross-target models remain
unchanged. Static impact found the target hook, maintained reading example and
packed contract but marks callback edges incomplete; no full graph claim.

The new manual AppKit probe starts with both reading request owners absent.
Only explicit Open buttons mount useKeepAwake; Check reads availability/held
status only after its own button action. Unmount releases the independent
requests. Cleanup-preference changes exercise option updates. The runner waits
only for the idle status; no power/token/native-input/status operation is
performed automatically. The existing shared ReadingScreen example remains valid.

Public keep-awake guide, platform README, Octane services reference, fix note and
keep-awake AC5 reconcile the source contract and limits. Original AC1–AC4 are
preserved. Existing native behavior shipped in v0.15.0 through v0.18.0 (tag
containment for f0a7a3c44dfbcc5c5b18e98ddb7eed6ffb04c6f1), so this has a fix note.
Apple's [display-sleep flag](https://developer.apple.com/documentation/foundation/processinfo/activityoptions/idledisplaysleepdisabled?language=objc)
and [allowing idle system sleep](https://developer.apple.com/documentation/foundation/processinfo/activityoptions/userinitiatedallowingidlesystemsleep?language=objc)
explain the existing option combination; no mask change or CPU/background wake
claim is introduced. Addition preserves the existing 2**40 display flag because
JS bitwise operators truncate to 32 bits. The begin/end method page titles were
resolved, but the web tool could not read their linked Markdown content type;
no new ABI/native-call proof is inferred from those pages or API documentation.
No upstream dependency, native bridge engine, package manifest, generic tagged
helper or other-target implementation was changed; no React Aria equivalent added.

Exact deferred commands; run only after this human's explicit go-ahead:

```sh
pnpm exec turbo run test --filter=@octane-xplat/platform
pnpm exec turbo run typecheck --filter=...@octane-xplat/platform
pnpm exec turbo run test:packed --filter=@octane-xplat/platform
pnpm exec turbo run pack:check --filter=@octane-xplat/platform
pnpm probe doctor
pnpm probe run examples/probes/keep-awake.macos.tsrx --target macos --watch
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"AppKit keep-awake package"}' -- pnpm exec turbo run package --filter=@xplat/macos
pnpm check:recipes
pnpm check:docs
pnpm check:doc-examples
```

Platform has no standalone typecheck task in this snapshot; Turbo may prepare
dependencies/generated declarations/vendor checkouts, and the broad platform
test glob includes packed checks. All remain deferred. Docs checker scripts are
absent from this isolated snapshot; shared in-flight tooling was not copied.
Permitted checks: four source/model/probe files and five scoped doc fences syntax
parsed, thirteen local documentation paths, semantic/whitespace/source review.
All seven added tests and the idle probe are unrun. No compiler transforms,
tests, typechecks, builds, OS power/timeout changes, actual sleep prevention,
bridge creation/release/retry, native input/IME/AX/observer memory, visual analysis,
dependency installs or packaging ran. Token handoff cannot prove physical display
behavior, system-sleep/lock override or installed consumers. Recipe coverage
remains separate from not-run verification; all evidence-gated checkboxes stay
open and the persistent goal stays active.

## AppKit network and environment subscription ownership

Demand assumption: the maintained Services screen and query scheduler depend on
live network/activity state for status, offline pause and reconnect retry. These
ordinary request flows take priority over niche integrations. Source review found
one consumer throw could block the other network listeners, native stop failure
could leave a stale global monitor, and the AppKit environment did not unwind
app/network subscriptions after acquisition or initial listener failure. Its
cleanup also stopped at the first error. Services read network state only during
render and never subscribed. These are source findings, not observed OS failures.

The AppKit connectivity leaf keeps a bridge-owned starting/ready/retired monitor,
independent listener leases, current sample copies and bounded startup delivery.
Synchronous startup samples publish only after success; a failed start cannot
advertise its sample. Native callbacks validate owner/bridge before fanout and
between listeners. Each consumer receives a fresh object, event-time exceptions
are isolated, and unsubscribe retires before native stop. Failed stop cannot
poison later subscriptions or revive stale callbacks; cleanup is idempotent.

Active getState readers reuse the monitor's latest sample, including unknown
status while waiting for a usable probe. Without subscribers, reads retain the
existing bounded one-shot native read. The native source creates/waits up to one
second for that sample. No timing/performance measurements were made. The new
wrapper avoids additional one-shot calls for already monitored state; the
Network.framework implementation and public state/interface types are unchanged.

The AppKit environment now acquires app/network cleanup before one initial
notification, forwards network callback samples without re-probing, binds the
app method receiver, and preserves unknown capability semantics. Acquisition or
initial listener failure unwinds acquired resources while preserving that error.
Teardown retires held callbacks, attempts both releases once and then throws the
first failure. Later native activity listener errors cannot block unrelated app
readers. Retired/replaced activity hooks are ignored; global host replacement
still requires the owner to dispose/re-subscribe to observe that new host's app
activity. No automatic global-property observation is claimed.

Services subscribes for its mounted lifetime, starts with unknown status and
shows route availability/transport plus request-reachability limits. Five native
monitor models and five environment models are authored, all **UNRUN**. They
cover event consumer errors/mutation isolation, live cached reads, stop/start
failure, synchronous startup, stale bridge callbacks, initial acquisition/error
unwinding, every cleanup attempt, current receiver/sample use and held callbacks.
These models use fakes, not the actual native callback bridge.

Public route guidance, Octane services reference, appkit-connectivity recipe and
fix note reconcile the source contract. Static impact reports the AppKit root
export and environment/query scheduler uses but marks callback edges incomplete;
those sources and target cases were reviewed without claiming a complete graph.
Existing shared scheduler, mobile/web leaves, native bridge sources, package
manifests and immutable desktop audit snapshots are unchanged. No React Aria
presence-level API was added. This corrects behavior shipped through v0.18.0
(tag containment for 45ba8ed8156ab3d8048ec3d44b98782a51ccdafa), so it has a fix note.

Exact deferred commands; run only after this human's explicit go-ahead:

```sh
pnpm exec turbo run test --filter=@octane-xplat/platform
pnpm exec turbo run typecheck --filter=...@octane-xplat/platform
pnpm exec turbo run test:packed --filter=@octane-xplat/platform
pnpm exec turbo run test:connectivity:macos --filter=@octane-xplat/platform
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"AppKit connectivity package"}' -- pnpm exec turbo run package --filter=@xplat/macos
pnpm check:recipes
pnpm check:docs
pnpm check:doc-examples
```

The native connectivity task compiles/runs the existing Objective-C verifier and
therefore remains deferred. Platform/@xplat/app have no standalone typecheck;
Turbo may prepare dependencies, generated declarations and vendor checkouts.
The docs checker scripts remain absent from this isolated snapshot; shared
in-flight tooling was not copied. Five source/test files and three scoped doc
fences syntax parsed; ten local doc paths, semantic and whitespace review only.
All ten added tests are unrun. No transforms, tests, builds, typechecks, native
verification, route changes, OS input/IME/AX, visual analysis, dependency installs
or packaging ran. Actual offline/reconnect, native initial/current state delivery,
thread/BOOL bridge, scheduler retry, activity/input/focus, native memory and
installed consumers remain unqualified. Recipe coverage is separate from not-run
verification, evidence-gated checkboxes remain open, and the goal stays active.

## AppKit settings handoff and query purge

Demand assumption: localization's app-locale setting, ordinary preferences and
bounded drafts, plus completed query JSON used in the maintained data workflows,
are everyday flows. Keep the existing NSUserDefaults seam and production
workspace dependencies. No plugin, new public API or native storage engine.
The immutable audit remains source-only and shared snapshots are unchanged.

Source review found per-method fallback could split a partial host across stores,
a native miss could revive stale memory, and the first lifecycle subscription
was never retired or retried after failure. Ordinary settings now retain explicit
pending set/remove intent (including tombstones), hand pre-host intent to the
installed host, and isolate already-owned hosts. Reads never replay writes;
a native miss invalidates acknowledged mirrors. Missing hooks keep flush false
until handoff. Writer-only synchronous hosts retain the existing true contract.
Bounded replay preserves newer reentrant mutations and native errors preserve
earlier pending intent. Hook receivers stay intact. Native failure may throw;
no exception text or stored value is logged by the implementation.

The inactive subscription belongs to its host and hook identities, retires before
cleanup, retries failed registration on a later write, tolerates throwing cleanup
and ignores retired callbacks. Cleanup occurs on a subsequent service call or
held lifecycle callback; assignment to the global is not itself observable.
Synchronous registration events and writes while already inactive are handled.
Lifecycle failures are best effort; explicit flush reports false or throws.

Query cache is separate: complete get/set/remove hooks choose native persistence;
a partial bridge chooses isolated session memory. Fallback records never migrate
to native or revive after an observed complete bridge/host loss. Query
restore/writes stay best effort, but adapter native reads and removals throw on
failure so namespace purge cannot mistake a failed index read for missing data.
Incomplete or lost previously observed bridges reject purge confirmation.
Existing query-cache purge source already propagates adapter errors; no shared
cache-engine edit.
Available partial-host removal hooks are still attempted, but incomplete native
namespace-purge confirmation rejects. A bridge must not be replaced mid-account
purge; no cross-host durable-erasure guarantee is claimed.

Eight additional ordinary-storage cases and five additional query-adapter cases,
plus a revised removal-failure case, are authored, all **UNRUN**. They model
pre-host handoff, partial hooks/tombstones, authoritative misses, receiver/owner
isolation, failure/reentry, registration/cleanup replacement and strict purge.
These fakes cannot establish NSUserDefaults behavior or actual lifecycle delivery.
The Services screen now embeds bounded non-secret Save/Read/Remove/Flush controls;
an idle probe waits only for their status. No read/write/removal is automatic.
Manual restart steps are authored, not executed; no real defaults were accessed.

Public service/data guides, platform README, Octane services reference, fix note
and appkit-storage recipe reconcile the same contracts. Removed existing hard
stop/durable-write promises: the existing stock synchronize hook is a host
handoff report, never proof against process/power failure. Apple documents
[UserDefaults](https://developer.apple.com/documentation/foundation/userdefaults)
as immediately updating memory and asynchronously writing disk, and says
[synchronize](https://developer.apple.com/documentation/foundation/userdefaults/synchronize%28%29)
is unnecessary and should not be used. This change does not add synchronize
calls to query eviction or replace the existing stock hook. API documentation
is not evidence that our bridge runs. No upstream dependency was patched.

Exact deferred commands; run only after this human's explicit go-ahead:

```sh
pnpm exec turbo run test --filter=@octane-xplat/platform
pnpm exec turbo run test:macos --filter=@octane-xplat/ui
pnpm exec turbo run typecheck --filter=...@octane-xplat/platform --filter=...@octane-xplat/ui
pnpm exec turbo run test:packed --filter=@octane-xplat/platform --filter=@octane-xplat/ui
pnpm exec turbo run pack:check --filter=@octane-xplat/platform --filter=@octane-xplat/ui
pnpm probe doctor
pnpm probe run examples/probes/storage.macos.tsrx --target macos --watch
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"AppKit settings package"}' -- pnpm exec turbo run package --filter=@xplat/macos
pnpm check:recipes
pnpm check:docs
pnpm check:doc-examples
```

Platform and @xplat/app have no standalone typecheck task in this snapshot;
UI test:macos includes packed-consumer work. Turbo may prepare dependencies,
generated declarations and vendor sources. Those commands remain deferred.
check:docs/check:doc-examples are absent in this isolated revision; the shared
checkout's documentation-quality guide was read without copying in-flight
tooling. Actual native restart, write/remove/flush failure, process termination,
inactive delivery, method binding, native observer memory, keyboard/IME/focus,
VoiceOver and installed consumers all remain unqualified. No visual analysis,
tests, compiler transforms, typechecks, builds, probes, OS automation, dependency
installs or packaging ran. Recipe coverage is separate from not-run verification;
all evidence-gated checkboxes remain open and the persistent goal stays active.
Permitted verification: eight changed/new TS/TSRX/MJS files and fourteen scoped
documentation fences syntax parsed; seventeen local documentation paths, semantic
changes and whitespace reviewed. This is not a test, transform, declaration or runtime
pass. Existing storage behavior shipped in v0.15.0 through v0.18.0 (git tag
containment for 2bd0ec61a); the user-facing fix has a pending fixlog note.

## AppKit native window-sheet ownership

Record editing and confirmation are ordinary app flows. The maintained
`NativeSheetDemo.macos.tsrx` was a placeholder although `@octane-xplat/sheet/macos`
already portaled to a native window. Source review found captured dismissal
callbacks, no controlled-close reporting, wrong/ambiguous close-delegate
ownership and a parentless floating-window fallback. The shared presentation
engine explicitly renders inside an existing window, so it does not replace
authentic `NSWindow.beginSheet` modality. This is source evidence, not an
observed native failure.

The sheet owner now prepares the portal, waits for commit, uses current content
and handlers, and reports accepted/queued dismissal once. A still-true request
stays closed after native completion until reset. Record id/native-anchor
replacement and unmount retire callbacks before silent cleanup. Missing or
failed native setup drops the portal and shows a generic close/reopen message.
Existing `className`/`style` now apply to the content host; public types explain
the portal/provider and lifetime contract. No dependencies or props were added.

The renderer reuses AppKit window sheets with a separate resource controller.
An owned hidden zero-size NSView observes actual anchor window attachment;
initially-open requests wait rather than becoming floating windows. The parent
is pinned once attached. Parent/sheet close and anchor loss end the owned
session. Native queueing is retained. Cleanup retires observers and cancellation
callbacks before end/orderOut/close, releases content-controller ownership and
handles partial failure. A window subclass exposes exact `cancelOperation:`
metadata through the existing registration helper, retaining the native
responder chain; its attachment observer calls the superclass lifecycle method.
The former ambiguous SheetDelegateTarget/openSheets registry is removed.

Primary API references are Apple's [beginSheet queueing contract](https://developer.apple.com/documentation/appkit/nswindow/beginsheet%28_%3Acompletionhandler%3A%29),
[endSheet](https://developer.apple.com/documentation/appkit/nswindow/endsheet%28_%3Areturncode%3A%29),
[viewDidMoveToWindow](https://developer.apple.com/documentation/appkit/nsview/viewdidmovetowindow%28%29)
and [cancelOperation](https://developer.apple.com/documentation/appkit/nsstandardkeybindingresponding/canceloperation%28_%3A%29).
They establish API shape, not custom-host dispatch or runtime behavior. Exact
selector registration still has the objc-node-api alpha.7 source-versus-binary
qualification boundary recorded below. No upstream dependency is patched.

Seven owner-model, eight native-controller-model and two actual-renderer-factory
cases were authored, all **unrun**. The factory cases execute the actual bridge
classes against fakes; they do not exercise NativeClass/ObjC. The maintained
demo covers editable/provider content, callback/id replacement, queued request
cancellation, nested sheets, initially-open mounting and explicit delayed
unmount. Its probe waits only for the idle demo status; no sheet or input action
runs automatically. All native behavior remains unqualified: Escape and close
delivery, IME, Tab/focus entry/restoration, provider/hook/effect timing, nested
presentation, queue cancellation, content fitting, parent-close ordering,
VoiceOver, native memory/observer lifetime and packaged consumers.

The `appkit-native-sheet` recipe, package README, public sheet guide, Octane
overlays reference and breaking feature note describe the source contract.
The removal of parentless floating presentation is an intentional alpha
cutover. No evidence-gated tracker item or broader platform claim is closed.

Deferred commands; run only after explicit human authorization for this task:

```sh
pnpm exec turbo run test --filter=@octane-xplat/sheet
pnpm exec turbo run test --filter=@octane-xplat/macos-renderer
pnpm exec turbo run typecheck --filter=...@octane-xplat/sheet --filter=...@octane-xplat/macos-renderer
pnpm exec turbo run test:packed --filter=@octane-xplat/sheet --filter=@octane-xplat/macos-renderer
pnpm probe doctor
pnpm probe run examples/probes/native-sheet.macos.tsrx --target macos --watch
pnpm check:recipes
pnpm check:docs
pnpm check:doc-examples
```

The sheet and demos packages have no standalone typecheck script in this
snapshot; review actual selected dependent checks and compile the edited demo
with the authorized native probe/consumer path. The two docs scripts and
`.agents/docs/documentation-quality.md` are absent from this isolated snapshot;
the current guide was read from the original checkout, whose in-flight tools
were left intact. Public examples and reader paths were manually reviewed;
no docs-quality or examples task ran. Lightweight syntax/JSON and whitespace
checks alone do not verify imports, types, hook transforms or native behavior.
The reviewed source change also moves the date-picker model's extraction
boundary to the new sheet section; its existing cases remain unrun.
Source-only review parsed 13 staged TS/TSRX/MJS/declaration files, one package
JSON and eight scoped documentation fences. Eleven scoped local Markdown
targets exist; anchors and remote links were not mechanically checked. Semantic
diff and whitespace review passed. No source transformation, import resolution,
typecheck, unit test, probe, OS automation or image inspection ran.

## AppKit native ID picker

Assumption: finite-choice settings and record forms have higher demand than
niche rendering integrations. `NativePickerDemo` is an existing maintained
platform workflow; its AppKit leaf was unsupported, and `picker` had no macOS
entry. The renderer already used NSPopUpButton for the raw NativeScript
ListPicker index API. The new `@octane-xplat/picker/macos` entry reuses that
native allocation/action engine, exposing AppKitPicker and standalone option/
prop declarations. The root stays empty and no dependency is added. Native
menu items preserve duplicate/empty titles and use unique string IDs, including
the empty ID. No snapshot regeneration was performed; the immutable audit has
no macOS picker entry and therefore predates this addition.

The owner retains uncontrolled IDs across reorder/rename, later defaults,
initially empty options and native-view replacement. Missing/removed IDs fall
back silently to the first enabled choice; controlled IDs missing from a
nonempty list are invalid. Controlled changes use current handlers and restore
the current value when rejected; releasing control retains the displayed ID.
Record-id changes retire old callbacks and reseed uncontrolled state. Empty or
all-disabled choices cannot select; disabled saved values may still display.
Primitive snapshots reject duplicate/non-string IDs or non-string titles and
detect in-place mutation. Invalid/missing native setup shows a generic message,
with repair/retry on current props. Programmatic, stale, disabled, unknown,
duplicate and reentrant actions do not emit. Classes/styles reach the outer
labeled field and native accessibility labels default to the visible label.

The native bridge creates explicit NSMenuItems with automatic enablement off,
keeps equal choices/menus, skips unchanged selection/label writes, and cancels
owned tracking before replacing choices or removing the control. Versioned
callbacks plus native control/item enablement, actual item identity, window,
superview and setup readiness guard dispatch. Programmatic writes and consumer
reentry are blocked. Partial setup/update failures deregister actions, clear
targets/items, deactivate owned constraints and remove the view. The existing
raw ListPicker API keeps its separate index/programmatic-event contract; its
model extraction now includes the shared allocation helper.

Apple's [NSPopUpButton](https://developer.apple.com/documentation/appkit/nspopupbutton),
[automatic enablement](https://developer.apple.com/documentation/appkit/nspopupbutton/autoenablesitems)
and [selection/deselection](https://developer.apple.com/documentation/appkit/nspopupbutton/selectitem%28at%3A%29)
references support the API choices, not native host execution. The existing
exact controlChanged selector prerequisite and objc-node-api alpha.7 binary
qualification boundary remain applicable; no upstream code is patched.

Eight owner-model and seven actual-renderer-branch cases are authored, all
**unrun**. The packed-consumer fixture now includes macOS declarations in both
Bundler/NodeNext modes with required-prop/ID checks; it is also unrun and does
not compile the native implementation. The maintained native demo now covers
controlled acceptance/rejection, empty/invalid/disabled/duplicate/reordered/
in-place renamed choices, current callbacks, record changes and remounting.
Timed replacement starts only from an explicit action. The idle probe imports
that demo and never opens or selects the native menu automatically.

The `appkit-native-picker` recipe, README, public guide/types, Octane primitives
reference and feature note reconcile this source addition. No new React Aria
equivalent is counted; this is an OS-authentic alternative to the existing
selection APIs. Keyboard/pointer selection, menu tracking/loop timers, native
BOOL/selector delivery, hook/ref/effect timing, disabled/duplicate rendering,
focus/Tab, VoiceOver, layout, native lifecycle/memory and installed consumers
remain unqualified. No evidence-gated checkbox or broader platform claim closes.

Deferred commands, only after this task receives the human's go-ahead:

```sh
pnpm exec turbo run test --filter=@octane-xplat/picker
pnpm exec turbo run test --filter=@octane-xplat/macos-renderer
pnpm exec turbo run typecheck --filter=...@octane-xplat/picker --filter=...@octane-xplat/macos-renderer
pnpm exec turbo run test:packed --filter=@octane-xplat/picker
pnpm probe doctor
pnpm probe run examples/probes/native-picker.macos.tsrx --target macos --watch
pnpm check:recipes
pnpm check:docs
pnpm check:doc-examples
```

Picker and demos have no standalone typecheck scripts here; inspect selected
dependent checks and compile the native component/demo through the authorized
probe or installed-consumer path. The docs scripts/current quality guide are
absent from this isolated snapshot; the guide was read from the shared checkout
without changing its in-flight tools. Source parsing, local link-path and
semantic/whitespace review are the only checks performed; no tests, compiler
transforms, typechecks, builds, package execution, probe, OS automation or image
inspection ran. Shared audit snapshots and other targets' files remain intact.
Source review parsed 13 changed TS/TSRX/MJS/declaration files, one package JSON
and 18 scoped documentation fences; 12 scoped local Markdown target paths exist.
Manual declaration shape matches source types. These are syntax/path checks;
anchors, remote contents, imports, compiled hooks, types and behavior were not
verified. Semantic and whitespace review completed without broad checks.

## AppKit FocusScope shared observation and retirement

Common forms and modal flows can mount nested scopes or keep scopes in several
native windows. Reviewing their source after the native picker/sheet work found
an ownership prerequisite: `attach()` returned false whenever `releaseObservers`
already existed. Every later bind therefore returned a no-op before retaining
or registering its root. Earlier nested/sibling model cases were authored but
unrun; the source contradiction was found by inspection, not an observed native
failure or executed test.

Later scopes now reuse the existing observation owner, while each root still
retains its own target and per-window boundary/restoration state. The last
scope removes the shared handles. Capability checks require callable host
hooks; successful target registration recovers the previous failure status
without disturbing another live scope. After attached key dispatch, Tab
navigation rechecks that its scope still exists and owns the current boundary;
consumer close, disable or replacement cannot navigate a retired owner.
When an older scope disappears before its replacement, saved native ancestry
redirects the replacement's return target to the older scope's prior control,
preserving the return chain even after child/parent links are removed.

Observer cleanup retires closures before native calls and attempts each
monitor/notification removal once. Captured old callbacks are inert after
teardown or a later rebind, including when a native removal throws. Failure of
focus restoration or target release does not prevent attempting the remaining
owned cleanup. This is best-effort native cleanup: an OS removal failure may
still retain resources, so native memory/removal behavior remains unqualified.
Apple's [local monitor contract](https://developer.apple.com/documentation/appkit/nsevent/addlocalmonitorforevents%28matching%3Ahandler%3A%29)
does not cover nested menu/control tracking loops, and
[removeMonitor](https://developer.apple.com/documentation/appkit/nsevent/removemonitor%28_%3A%29)
must only be called once per monitor. No upstream code was patched.

Eight additional model cases cover shared nested lifetime, two-window ownership,
retired callbacks across rebind, return paths across older-scope detachment,
consumer changes during key dispatch,
cleanup/restore failure and target-registration recovery. The scope file now
has 19 model cases, all **unrun** in this task. The maintained focus-scope probe
adds manual nested/close-both controls; its run function still exercises only
the original programmatic single-scope path, and has not run. It does not
create a second window or establish physical Tab, IME, focus timing or AX.

The public focus guide, existing keyboard-clipboard AC6 and Octane primitives
reference describe nested/current ownership and the remaining native boundary.
No public API/dependency or React Aria equivalent changes. This repairs source
introduced on the unreleased task branch, so it adds no release note. The
evidence-gated tracker remains open. Real Tab/Shift+Tab, two-window activation,
IME/native text editors, popup/tracking loops, nested mount/unmount order,
restoration timing, VoiceOver, native cleanup/memory, HMR and installed consumers
are still unqualified.

Deferred commands; only after explicit human authorization for this task:

```sh
pnpm exec turbo run test --filter=@octane-xplat/ui -- src/focus-scope-state.macos.test.ts
pnpm exec turbo run test --filter=@octane-xplat/macos-renderer
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
pnpm probe doctor
pnpm probe run examples/probes/focus-scope.macos.tsrx --target macos --watch
pnpm check:recipes
pnpm check:docs
pnpm check:doc-examples
```

The docs-quality guide was read from the original checkout because that guide
and its two scripts are absent from this isolated snapshot. Public examples
and their reader path were reviewed; no docs/example task ran. Only source and
documentation syntax, semantic diff, local-link path and whitespace checks are
performed. No tests, compiler transforms/typechecks/builds, probe, native/OS
automation, packaging or visual analysis ran. Other targets' source, shared
audit snapshots and shared CLI/UI manifests remain intact.
Three changed TS/TSRX files and three scoped documentation fences parse for
syntax; the four AC6 local Markdown target paths exist. Semantic and whitespace
review passed. Anchors, remote contents, native import/compiled hook behavior,
types and runtime semantics were not verified by those checks.

## AppKit marked grid-cell focus hook

The repository's Astryx ComplexSelectorShowcase uses a 3×3 department palette
with useGridFocus. That caller is browser markup and is demand/API-shape
evidence, not a native example or runtime proof. The AppKit root already
exported useGridFocus, but resolved to the default mobile no-op; a skill note
incorrectly said it had no export. This change supplies a native hook for that
existing marked-cell contract. The selector-based useGridList requires a
separate native query contract and remains explicitly unsupported; no CSS
selector backend or shared audit snapshot was generated as a shortcut.

The renderer now retains/clears data-grid-cell metadata without unknown-prop
warnings and reads managed marked descendants in actual native child order.
False/empty values still count as presence; null/undefined/omission removes the
marker. Native NSArray wrappers, unmanaged host wrappers, stale node identities,
duplicates/cycles and invalid child counts are handled without synthesizing
views or OS events. Nested hook roots and native GridList roots form separate
cell boundaries.

The macOS hook is in the renderer's TSRX include path and the explicit AppKit
barrel selects it. It retains the shared options/result types, with a concrete
native default ref type. It reuses the existing native row focus, reveal and
roving Tab-stop engine rather than introducing another key monitor. The cell
owner adds bounded native-order Left/Right, column-stride Up/Down and Home/End,
skips hidden/disabled cells without compressing indices, and leaves activation,
descendant editing, IME, modified/prevented keys and native Tab delivery alone.
focusIndex changes after an accepted hook-directed move; keyboard moves notify
the current callback. Optional onFocusCell clamps integer requests without
selection or callback emission and is absent for unavailable/invalid inputs.
Ref/window/geometry/metadata changes and repaired native bridges use current
state; failed or disposed owners cannot revive through captured key methods.
If focus handling disposes or retargets the owner before returning, its pending
index/callback update is dropped. Nested query-root leases are released on exit;
boundary changes synchronously repair other live cell owners' Tab exclusions,
including parent-before-child layout-effect ordering, without waiting for a
window notification. Root replacement updates the registry atomically before
publishing, and repeated native notifications are not needed for that repair.

The reused row engine now retires observer generations before removal and
attempts every Tab lease even when a removal throws. Old notifications cannot
apply to a later generation. This is best-effort cleanup, not proof that failed
OS removals released native resources. No public option/export or dependency was
added, and shared CLI/UI manifests and other targets' source remain intact.

Eight cell-controller, three renderer-reader, two row-lifecycle and one actual
metadata prop-application case were authored, all **unrun**. They use native
fakes and do not compile hooks. The idle native probe includes programmatic
focus, disabled/hidden/removed cells, current callbacks, nested grids and an
editing child; no input action runs automatically. Public component guidance,
keyboard-clipboard AC9, Octane primitives/services references and the feature
note reconcile the new source implementation. No new React Aria equivalent is
counted; this implements an existing Astryx hook on another target.

The inspected web reference also stores the raw requested programmatic index
after clamping the DOM focus target, and its native-style disabled/roving
behavior is not established by this work. That existing cross-target edge
parity remains open; the native contract reports the accepted clamped target.
No full cross-platform or AppKit qualification claim is made. Compiled hooks/
marker forwarding, physical arrows/Tab/Home/End, activation, native BOOL, editing/
IME, nested ownership, focus/scroll timing, RTL/layout, VoiceOver, HMR, native
cleanup/memory and installed consumers remain unqualified.

Deferred commands; run only after explicit human authorization for this task:

```sh
pnpm exec turbo run test --filter=@octane-xplat/ui -- src/grid-cell-focus.macos.test.ts src/grid-navigation.macos.test.ts
pnpm exec turbo run test --filter=@octane-xplat/macos-renderer
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui --filter=...@octane-xplat/macos-renderer
pnpm exec turbo run test:packed --filter=@octane-xplat/macos-renderer
pnpm probe doctor
pnpm probe run examples/probes/grid-cell-focus.macos.tsrx --target macos --watch
pnpm check:recipes
pnpm check:docs
pnpm check:doc-examples
```

Inspect selected consumer lanes before reporting native hook coverage. The
current docs-quality guide was read from the original checkout; that guide
and its two scripts remain absent in this isolated snapshot, whose public
reader path/examples were reviewed manually. Only syntax, local link paths,
semantic diff and whitespace are checked. No test, compiler transform,
typecheck, build, probe, native/OS automation, packaging or visual analysis ran.
All evidence-gated tracker checkboxes remain open.
Source-only review parsed 13 changed TS/TSRX/declaration files and five scoped
documentation fences. Seven scoped local Markdown target paths exist; anchors
and remote contents were not checked. Semantic and whitespace review passed.
None of these checks executes or verifies the authored models or hook behavior.

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


### AppKit checkbox metadata

Checkbox is a basic form/control flow. Its AppKit source drew only an optional
inline child label, ignored description/status/hidden-label props, and could
duplicate a child label under an enclosing Field. A dedicated leaf now owns
one stable compound wrapper/row, uses the existing Field text renderer for
standalone label/description and puts status below. Parent Field retains text
ownership. Required/optional markers, hidden accessible names, generated/native
IDs, testID, width and composed class/style forms are forwarded. Existing
scalar/mixed/default/controlled semantics remain; a blocked toggle also checks
its guard directly. Static layout moved into scoped macOS CSS. No dependencies
or public API types changed.

Authored focused source cases for standalone/parent ownership, hidden metadata,
class/style forms, mixed-to-true requests, controlled feedback, inherited gates
and host/state retention. Syntax and whitespace only; tests have not run.
AppKit changeAction is still ignored. Checkbox's previous mixed value cannot
be emitted through its boolean-only onChange rollback callback; the web source
currently collapses a failed mixed request to unchecked. This slice does not
weaken or silently reinterpret that async contract. It requires separate shared
API/behavior work; consumers can save from controlled onChange meanwhile.
labelTooltip forwarding for Checkbox also remains outside this slice.

Deferred commands after this task's explicit human authorization:

```sh
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/checkbox.macos.mobile.test.tsrx
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
pnpm check:recipes
```

Actual row/child click delivery, keyboard activation, Tab/focus, mixed VoiceOver,
long-text/RTL layout, loading appearance and packaging remain unqualified.
No tests, builds, installs, probes, OS automation, visual analysis or shared
audit regeneration ran; evidence checkboxes remain open.


### AppKit switch label activation

The previous metadata slice left standalone label activation unimplemented.
A pointer label wrapper now invokes the same toggle/save owner and requests
focus on the actual switch. The existing renderer suppressTabStop lease keeps
the wrapper out of sequential Tab traversal without introducing a renderer
flag or misusing FocusScope targets. It releases exactly its own reference-counted
claim on detach and refreshes an attached window's key-view loop. The wrapper
is explicitly ignored as an accessibility element; its children retain their
existing semantics. Tooltip child controls keep their own action path, but
actual parent/child arbitration is not proven by source dispatch.

The label action is enabled only when the renderer suppression function exists;
otherwise track activation remains. Disabled/read-only/pending and hidden
labels cannot invoke it. One state owner handles track/label requests, async
pending and rollback; the action target/lease persists through metadata updates.
No new public API/dependency or renderer traversal behavior was added.

Authored source cases cover label-to-toggle/save ordering, focus target, failure
rollback, busy blocking, missing bridge, disabled/read-only/hidden labels and
lease release on unmount. Syntax/whitespace only; tests and probes are unrun.
The earlier label-click gap is now implemented in source; actual mouse hit
testing, tooltip arbitration, focus/Tab and VoiceOver gates remain open.

Deferred after this task's explicit human authorization:

```sh
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/switch.macos.mobile.test.tsrx
pnpm exec turbo run test --filter=@octane-xplat/macos-renderer -- test/focus-scope-target.test.ts
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
pnpm probe run examples/probes/switch.macos.tsrx --target macos --watch
pnpm check:recipes
```

No builds, installs, package tests/typechecks, native/OS automation, visual
analysis, packaging or shared audit regeneration ran. Physical Tab, label mouse
input, key-loop timing across windows and assistive technology remain unqualified.


### AppKit busy feedback

ControlsDemo pairs a busy Switch with Spinner. The AppKit shared Spinner leaf
ignored size, label, shade and accessible name, and Switch never rendered a
loading indicator inside its thumb. A dedicated ActivityIndicator.macos leaf
now forwards named sizes (12/16/20/24/32), text/node labels, on-media contrast,
composed classes/style forms and named progress semantics. A labeled ring uses
one root ID and one progress owner. busy=false removes it. The shared ring stays
self-drawn; raw NSProgressIndicator chrome was not substituted for shared UI.

Switch now renders an xsm ring for pending saves or external isLoading. Its
single state/save owner and rollback/label guards are unchanged. CSS owns static
ring/row/size geometry; scheme/shade colors and user styles stay dynamic. The
ring remains static: parsed CSS animation playback is still an AppKit gap, and
no native animation or pixel parity is claimed. This is busy-state feedback,
not completion of animation support. Actual per-edge border/color support and
clipping must also be qualified.

Authored object-driver source cases cover sizes, labels/nodes, contrast,
class/style forms, one ID/progress owner and busy removal; Switch cases cover
ring presence during a save and removal on success. Syntax/whitespace only;
no package tests or native probes ran. Deferred:

```sh
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/activity-indicator.macos.mobile.test.tsrx src/switch.macos.mobile.test.tsrx
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
pnpm check:recipes
```

Actual CSS resolution, borders/contrast, compact clipping, focus/VoiceOver,
loading timing, animation, OS input and packaging remain unqualified/open.
No builds, installs, tests/typechecks, OS automation, visual analysis or shared
audit snapshot regeneration ran. No evidence checkbox is closed.


### Common-control accessibility prerequisite

While prioritizing tab navigation, source review found a renderer seam that
also invalidated earlier Switch/Slider UI-only handler assumptions: container
switch/tab/adjustable roles fell back to AXGroup, native increment/decrement
selectors did not exist, and accessible=false was ignored for action hosts.
UI handlers are not native accessibility dispatch evidence. This source repair
precedes further TabList input work.

AccessibleHostView now maps switch→AXCheckBox, tab→AXRadioButton,
tablist→AXTabGroup, adjustable→AXSlider and link→AXLink. Tab values read selected,
switches checked, adjustable values numeric. Explicit accessible=false/role none
ignores the host. Press rejects ignored/read-only controls. Increment/decrement
selectors are declared to ObjC and invoke the current callback through the
renderer's discrete event scope, rejecting missing/disabled/read-only/ignored
or detached roots. applyProps forwards these callback props before Mason's
per-type fallback; removal clears the stored callback. Value/checked/selected
prop changes post AXValueChanged after actual prop updates, avoiding initial or
equal-value announcements. Accepted dispatch does not assert a value changed.

Apple's [slider action contract](https://developer.apple.com/documentation/appkit/nsaccessibilityslider/accessibilityperformincrement%28%29)
requires value-change notification after a real change and distinguishes action
triggering from completion. The [role vocabulary](https://developer.apple.com/documentation/appkit/nsaccessibility-swift.struct/role?language=objc)
and local generated declarations inform the mapping. These are source/API
references, not a native run.

Authored focused renderer cases cover role/value changes, discrete dispatch,
callback clearing, blocked/ignored/detached actions and initial/equal/changed
notifications. TypeScript syntax parse and whitespace only; tests have not run.
Deferred until this task receives explicit human authorization:

```sh
pnpm exec turbo run test --filter=@octane-xplat/macos-renderer
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/slider.macos.mobile.test.tsrx src/switch.macos.mobile.test.tsrx
pnpm exec turbo run typecheck --filter=...@octane-xplat/macos-renderer --filter=...@octane-xplat/ui
pnpm check:recipes
```

Actual native selector export/JSC registration, VoiceOver, notification ordering,
ignored-parent child flattening, tab/panel relationships, keyboard/hit testing
and packaging remain unqualified. No builds, package tests/typechecks, installs,
OS automation, visual analysis or shared audit regeneration ran. The color
control adjustment backlog still needs its own UI-handler/OS review; no evidence
checkbox is closed by this prerequisite.


### AppKit tab-strip focus and reveal

Tabs uses the shared TabList for app pane/stack switching; controlled page tabs
also appear in the maintained app-building examples. The AppKit strip used
NativeScript getActualSize/horizontalOffset/originX/getMeasuredWidth and
scrollToHorizontalOffset on native NSViews/NSScrollView, so its selected-tab
reveal path had no native implementation. It also lacked composite keyboard
focus, omitted visible accessible names, and hid disabled tab roles entirely.

The reveal helper now converts the actual tab bounds into document coordinates,
reads native clip/document geometry and uses the existing AppKit offset helper
to move only horizontally. Oversized tabs align their leading edge; invalid or
unrelated geometry is ignored; offsets clamp and equal targets do not restart
scrolling. Instant movement avoids restarting clip animations on every window
update. Selection changes reveal the selected tab; keyboard movement reveals
its focused tab. Window updates reconcile geometry/attachment, preferring a
focused registered tab while focus is in the strip. Outer vertical offsets stay
unchanged. Native documents are still assumed to use the renderer's zero-origin
layout convention; nonzero document-bounds behavior needs qualification.

A target-specific controller traverses native child order, skips disabled/hidden
tabs and leases Tab exclusion for all except the focused/selected/first usable
Tab. Arrows/Home/End move focus without selecting; Enter/Space remain the
renderer's existing press path. Horizontal arrows follow useDirection; tablist
vertical arrows and modifier/IME keys are preserved, while nav strips accept both
axes. Focus rejection leaves the key untouched. Existing controlled value,
route-link activation and onPress behavior remain. TabMenu stays a separate
trigger outside this registry; full menu/composite behavior is still open.
Missing keyboard/suppression bridges retain their respective fallback; window
observation is guarded, cleaned up and reports installation failure.

Native tablist grouping and explicit visible/hidden tab labels now reach the
repaired renderer role bridge. Disabled tabs retain tab/link/button semantics
with disabled state and no press. Public props/exports are unchanged. Static
strip layout uses scoped macOS CSS. Added source cases for geometry, manual
focus/RTL/guards/order/lease cleanup, names/disabled/controlled selection; added
a direct-selection fixture, guide/skill/recipe/release coverage. Syntax and
whitespace only; no tests or probes ran. Deferred:

```sh
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/tab-list.macos.mobile.test.tsrx
pnpm exec turbo run test --filter=@octane-xplat/macos-renderer
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui --filter=...@octane-xplat/macos-renderer
pnpm probe run examples/probes/tab-list.macos.tsrx --target macos --watch
pnpm check:recipes
```

Actual key/Tab delivery, responder retention/loops across windows, window-update
observer timing, scrolling/hit testing/resize geometry, fades/overflow controls,
VoiceOver and tab-panel relations, RTL/layout/pixels and packaging remain open.
The native fixture run hook checks handler selection/state only; it does not
prove scroll visibility, keyboard input or native accessibility. No builds,
installs, package tests/typechecks, OS automation, visual analysis or shared
audit snapshot regeneration ran. No evidence checkbox is closed.


### AppKit text clear focus

AppKit TextInput/SearchInput exposed clear but only changed value/called onClear;
unlike web, it never returned focus to the input. Clear now preserves callback
order (onChange(''), onClear) and then requests the retained NSTextField as first
responder. A callback that unmounts the input leaves its ref null, so no detached
host is focused. Controlled parents still own display feedback; disabled/read-only
clear suppression is unchanged. The native field ref is now concrete NSTextField.

Authored source cases cover callback/focus ordering, controlled/uncontrolled
feedback, host retention, SearchInput, blocked clear and unmount before refocus.
Syntax/whitespace only; tests are unrun. Deferred:

```sh
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/text-controls.macos.mobile.test.tsrx
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
pnpm check:recipes
```

Actual clear pointer/key activation, first-responder/caret/selection retention,
IME candidate/commit behavior, accessibility and packaging remain unqualified.
No builds, installs, package tests/typechecks, probes, OS automation, visual
analysis or shared audit regeneration ran; no evidence gate is closed.


### Preserve modified action keys

AccessibleHostView previously consumed Enter/Space whenever a press handler
existed, including Control/Option/Command combinations. The activation guard
now preserves these modified keys for super.keyDown and checks disabled/read-only
accessibility state before invoking the press. Unmodified and Shift-only keys
retain the existing activation timing; repeat/key-up timing was not redesigned.
Missing handlers also pass through. This is shared self-drawn AppKit host code,
so it applies to button/switch/tab action hosts without changing their public API.

Authored renderer cases distinguish plain/Shift activation, all three shortcut
modifiers, read-only/disabled state and missing handlers. Source inspection also
found the existing focus-scope fixture invoked keyDown without supplying its
invokeAction dependency; the fixture now supplies that action dispatcher. No
test pass is inferred from repairing an unrun fixture. TypeScript syntax and
whitespace only; deferred:

```sh
pnpm exec turbo run test --filter=@octane-xplat/macos-renderer
pnpm exec turbo run typecheck --filter=...@octane-xplat/macos-renderer
pnpm check:recipes
```

Actual OS keys/menu equivalents, application shortcut routing, Control-Space
input-source switching, IME/dead keys, held-key repeat/key-up semantics, focus,
VoiceOver and packaging remain unqualified. No builds, installs, package tests/
typechecks, probes, OS automation, visual analysis or shared audit regeneration
ran. No evidence checkbox is closed.


### Logical AppKit inline scroll offsets

The public ScrollableArea handle defines distance from an axis's logical start,
but AppKit seeks/state treated inline start as physical left regardless of
direction. The target leaf/hook now use InternationalizationProvider direction:
RTL inline offset = maxX - physicalX, clamped at the public boundary. The stable
handle reads live direction, the hook remeasures when direction changes without
requiring scroll input, and inline-start/end padding swaps physical sides.
Missing/nonfinite seek axes are still ignored; other coordinates stay intact.

Internal scrollableAreaOffset/metrics stay physical because tab reveal/chat/
VirtualList callers rely on their left/top coordinate contract; only its comment
was clarified. No new public API/dependency or other target leaf changed. Native
refs in the touched scroll leaf/hook now name NSScrollView. Authored source cases
cover RTL inversion/clamps, start/end reads, live direction changes, stable handle,
omitted/invalid axes and padding. Syntax/whitespace only; no tests ran.

```sh
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/scrollable-area-appkit.mobile.test.tsrx src/tab-list.macos.mobile.test.tsrx
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
pnpm check:recipes
```

These commands remain deferred until this task's explicit human authorization.
The provider does not reorder native content or set initial clip position;
actual RTL layout/initial placement, backing geometry, elasticity/scroll input,
animation and packaging remain unqualified. No builds, installs, package tests/
typechecks, probes, OS automation, visual analysis or shared audit regeneration
ran. No evidence checkbox is closed.


### AppKit radio options and child parts

RadioList is a basic single-choice form flow. Its AppKit RadioGroup ignored
declared RadioListItem children and option descriptions/endContent, omitted
radio-group/radio roles and checked state, and rendered no standalone Field
metadata. The macOS root explicitly exported generic RadioListItem.tsrx, so
adding an OS suffix alone would not select a repaired child implementation.

Options and children now share the existing RadioListProvider and one state
owner. The target child leaf forwards radio/name/checked/selected state, group/
item disabled and read-only gates, descriptions/endContent, class/style forms
and the existing indicator registry. Standalone children remain presentational.
The target root export now explicitly selects RadioListItem.macos.tsrx. Stable
standalone FormField metadata wraps the group; an enclosing Field keeps its
ownership. Re-selecting the current value does not emit another change. Static
layout uses scoped macOS CSS. No public props/dependencies or other target
leaves changed.

Authored source cases cover mixed option/child composition, controlled feedback,
metadata host/state retention, blocked states, Field ownership and standalone
items. Added a maintained direct-selection fixture and guide/skill/recipe/release
coverage. TSRX/TypeScript syntax and whitespace only; tests/probes have not run.
Deferred after this task's explicit human authorization:

```sh
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/radio-list.macos.mobile.test.tsrx
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
pnpm probe run examples/probes/radio-list.macos.tsrx --target macos --watch
pnpm check:recipes
```

Actual pointer/Enter/Space delivery, focus/Tab, native radio grouping/VoiceOver,
custom indicator styling, descriptions/layout and packaging remain unqualified.
Radio arrow navigation and a roving Tab model remain unimplemented; this slice
does not claim a complete desktop radio composite. No builds, installs, package
tests/typechecks, OS automation, visual analysis or shared audit regeneration ran.
No evidence checkbox is closed.


### Mounted native handle type follow-up

Concrete NSTextField/NSScrollView refs include null for detach, while the existing
TextInputHandle/ScrollableAreaHandle native property is declared non-null for a
mounted owning public ref. Their getters now explicitly retain that existing
mounted-host type. This is a source typing follow-up to the concrete-ref changes;
runtime values/cleanup behavior and public types are unchanged. Captured stale
handles do not extend the host lifetime. TSRX syntax and whitespace only; deferred
`pnpm exec turbo run typecheck --filter=...@octane-xplat/ui`. No typecheck pass,
native behavior or packaging evidence is claimed.


### AppKit radio keyboard choices

RadioList now registers native option/child hosts and reuses the tab focus
controller as an internal choice-focus helper. Tabs retain manual activation;
ordinary form radios request selection only after Arrow/Home/End focus succeeds.
Horizontal arrows follow direction, vertical arrows wrap, disabled/hidden items
are skipped, and no selection falls back to the first usable Tab candidate.
Controlled parents still decide checked-state feedback. Disabled/read-only
groups omit key handlers. Native scrollRectToVisible requests reveal for the
focused radio; actual focus/scroll behavior remains unqualified.

The target-only registry is separate from shared selection context. Stable
callbacks update value keys and release only their own host entry on detach.
Window updates reconcile native ordering/focus; observers and reference-counted
Tab exclusions release on teardown. The helper now accepts keys only from a
registered host itself, preserving interactive endContent children's keys.
Missing keyboard/suppression bridges retain their existing capability fallback.
The private helper moved from tab-focus.macos.ts to choice-focus.macos.ts;
current TabList references/tests/recipe links were updated without an alias.

The [APG ordinary radio pattern](https://www.w3.org/WAI/ARIA/apg/patterns/radio/)
informs arrow selection and one-entry focus. Its special toolbar model is not
implemented here; toolbar-specific radio navigation remains unsupported.
Authored cases cover automatic/manual requests, focus failure, empty selection,
trailing children, host/value registration, blocked bridge props and observer
cleanup. The fixture adds a disabled choice; its run hook still dispatches a
press directly and checks state, not real keys or visibility. Syntax/whitespace
only; no test/probe ran. Deferred:

```sh
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/radio-list.macos.mobile.test.tsrx src/tab-list.macos.mobile.test.tsrx
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
pnpm probe run examples/probes/radio-list.macos.tsrx --target macos --watch
pnpm check:recipes
```

Actual OS arrows/Tab, native responder acceptance, reveal/observer timing,
nested controls, radio grouping/VoiceOver, toolbar integration, layout and
packaging remain unqualified/open. No builds, package tests/typechecks, installs,
OS automation, visual analysis or shared audit regeneration ran. No evidence
checkbox is closed.


### AppKit PIN field ownership

ComponentsDemo uses PinInput for a four-cell code. Its target leaf already used
the shared TextInputHandle for focus, but did not resolve enclosing Field state,
render standalone metadata, or name/identify cells independently. Under a Field,
cells could inherit the same input ID; their editability/callback group guards
also lacked the parent's disabled/read-only state. The target now resolves Field
props, provides one stable standalone FormField or reuses its parent, assigns
unique per-digit IDs/names and forwards inherited hints/state to the inputs.
Static row layout moved into scoped macOS CSS. Entered values/hosts survive
metadata changes. Pending focus is cleared when blocked or outside a shrunken
length; controlled value/completion behavior otherwise remains unchanged.

Authored cases cover unique IDs/names, one metadata owner, parent gates, pending
controlled focus cancellation and validation retention. Shared last-character
paste and suffix-truncation deletion are unchanged. Empty-cell Backspace,
OTP autofill and native digit filtering are not implemented by this slice.
Actual physical keyboard/caret/focus/IME, secure-field changes, VoiceOver and
packaging remain unqualified. Syntax/whitespace only; tests are unrun.

```sh
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/pin-input.macos.mobile.test.tsrx src/text-controls.macos.mobile.test.tsrx
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
pnpm check:recipes
```

Commands remain deferred until this task's explicit human authorization. No
builds, installs, tests/typechecks, probes, OS automation, visual analysis or
shared audit regeneration ran; no evidence gate is closed.


### Late AppKit click-action prerequisite

While implementing CheckboxList source review found that wireViewAction gave
semantic-only controls an action ID but no recognizer. setAction installed a
recognizer only when creating a new ID, so a checkbox/radio/switch mounted
blocked could later have a callback but no native click path. This affects
ordinary disable/save/re-enable form flows and precedes the list repair.

Identity allocation is now separate from node-owned click recognizers. setAction
lazily creates exactly one recognizer for a live callback even with an existing
AX ID, updates the current callback and disables the recognizer when cleared.
Raw disabled prop changes resync enabled state; queued callbacks retain the
existing disabled guard. Clearing an initially noninteractive host does not
manufacture an ID/recognizer. Destroy disables/removes the owned recognizer.
No always-on recognizer was added to semantic-only groups.

Authored source cases cover late installation, callback replacement, clear/
re-add identity, disabled callbacks and empty clear. Existing queued-press cases
remain. Teardown/raw-disabled integration and actual parent/child arbitration
still require native verification. TypeScript syntax/whitespace only; no test ran.

```sh
pnpm exec turbo run test --filter=@octane-xplat/macos-renderer
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/checkbox.macos.mobile.test.tsrx src/switch.macos.mobile.test.tsrx src/radio-list.macos.mobile.test.tsrx
pnpm exec turbo run typecheck --filter=...@octane-xplat/macos-renderer --filter=...@octane-xplat/ui
pnpm check:recipes
```

All commands remain deferred until this task's explicit human authorization.
Actual re-enable mouse/keyboard delivery, gesture arbitration, native recognizer
lifecycle, VoiceOver and packaging remain unqualified. No builds, installs,
package tests/typechecks, OS automation, visual analysis or shared audit snapshot
regeneration ran; no evidence checkbox is closed.


### AppKit checkbox-list composition

ComponentsDemo uses CheckboxList for ordinary multi-choice forms. Its AppKit
leaf ignored CheckboxListItem children, option descriptions/endContent and
hasDividers, and the macOS root explicitly exported generic child .tsrx code.
The target now provides the existing CheckboxListContext to both option and
child rows, with one checked-set owner. Uncontrolled batched writes read the
latest set; unchanged membership requests are idempotent. Controlled parents
still own feedback. Value-less/standalone rows use isChecked/onCheck independently,
including mixed→true requests. Group and item disabled/read-only gates apply.

The new target child exposes checkbox/name/checked/mixed semantics, descriptions/
endContent, normalized class/style forms and indicator registry support. Root
exports explicitly select it. One stable FormField renders standalone metadata;
parent Field keeps ownership. Static layout is scoped macOS CSS; horizontal and
divider classes are forwarded without claiming native appearance. Each action
host remains an independent Tab candidate, using the repaired late-click bridge;
there is no radio-style roving behavior for these multi-choice rows.

Authored source cases cover options/children, batched/idempotent membership,
controlled feedback, standalone mixed state, metadata/host retention and Field
gates. Added a maintained direct-selection/select-all fixture and reconciled
guide/skill/recipe/release coverage. Syntax/whitespace only; no tests/probe ran.

```sh
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/checkbox-list.macos.mobile.test.tsrx src/checkbox.macos.mobile.test.tsrx
pnpm exec turbo run test --filter=@octane-xplat/macos-renderer
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui --filter=...@octane-xplat/macos-renderer
pnpm probe run examples/probes/checkbox-list.macos.tsrx --target macos --watch
pnpm check:recipes
```

All commands remain deferred until this task's explicit human authorization.
Actual click/re-enable/key/Tab delivery, mixed-state VoiceOver, trailing-control
arbitration, divider/RTL/layout appearance, custom indicators and packaging remain
unqualified. No builds, installs, tests/typechecks, OS automation, visual analysis
or shared audit regeneration ran; no evidence checkbox is closed.


### Formatted text letter spacing

Issue #62 identifies formatted-run spacing as absent. Plain labels already set
NSKernAttributeName, but textRuns omitted letterSpacing and rich host defaults
dropped it. Composition now inherits host computed/inline spacing, folds nested
local overrides and writes finite nonzero points per run. Zero/normal resets
omit the attribute on freshly constructed runs, matching plain-label policy.
Apple's [kern documentation](https://developer.apple.com/documentation/foundation/nsattributedstring/key/kern)
distinguishes omitted font defaults from explicit zero disabling kerning.
No new direct JSX property or arbitrary CSS unit conversion is promised.

Authored source cases cover inheritance, local zero/negative/normal, removed
values, reparenting, validation, host computed/inline defaults and mocked native
attribute dictionaries. They remain unrun. Reviewed source paths also show
normal macOS harness imports tokens/chrome, probe case config imports tokens,
and the AppKit Vite preset connects stylesheet queuing to the CSS registry.
A missing import is not established; emitted CSS and actual layout remain open.
No shared CLI change or audit snapshot regeneration was made.

```sh
pnpm exec turbo run test --filter=@octane-xplat/macos-renderer
pnpm exec turbo run typecheck --filter=...@octane-xplat/macos-renderer
pnpm check:recipes
pnpm exec turbo run build --filter=@xplat/macos
```

All commands remain deferred until this task's explicit human authorization.
Only TypeScript syntax parsing, semantic/source review and whitespace checks ran.
Native attributed text, shaping/measurement, CSS delivery, input/editing and
packaging remain unqualified. No visual analysis, native automation, dependency
install or evidence-gated checkbox closure occurred.


### Formatted host line height

Follow-up source review found rich composition read props.computedStyle, while
computed cascade values live on ElementNode.computedStyle. Host stylesheet line
height was therefore omitted unless separately present inline. syncText now
passes effective host lineHeight in composition defaults; the paragraph uses
that value before inline fallback. Fresh paragraph construction clears fixed
minimum/maximum height for normal, removal or nonpositive/nonfinite input.
No new run-local paragraph-height or arbitrary-unit API was added.

Two authored source cases cover computed precedence, inline fallback, removal,
normal reset and native paragraph dictionaries. They remain unrun. Syntax,
semantic/source and whitespace checks only; no native measurement result.

```sh
pnpm exec turbo run test --filter=@octane-xplat/macos-renderer
pnpm exec turbo run typecheck --filter=...@octane-xplat/macos-renderer
pnpm exec turbo run build --filter=@xplat/macos
pnpm check:recipes
```

All commands remain deferred pending this task's explicit human authorization.
Multiline wrapping, host sizing, baseline/line-height behavior, CSS delivery and
packaged native editing still require qualification. No builds, package tests,
typechecks, installs, OS automation, visual analysis or checkbox closures ran.


### Raw SearchBar marked-text synchronization

Search is a common app flow. Shared SearchInput delegates through NSTextField,
but raw searchbar syncSearchBar directly assigned NSSearchField.stringValue,
bypassing existing marked-text deferral. It now reuses updateNativeTextValue;
notifySearchTextChange reads the live field editor before the backing string.
The adapter emits the raw SearchBar property-change notification after an actual
write, preserving its different contract from shared onChange. Latest external
text wins unless a matching native echo supersedes it. Dropping text still
requests empty text (deferred during composition), not an uncontrolled handoff.
Existing teardown already disposes writers for searchbar nodes.

Authored source cases use the real writer with a controlled scheduler to cover
marked editor preservation, latest value, matching echo, deferred clear/current
handler, deduplication and disposal. Existing submit/cancel/property cases remain.
The search fixture already exercises retained hosts and text/hint/handler removal;
no new automated native result is claimed. Only syntax/source/semantic review
and whitespace checks ran. Shared SearchInput behavior/API is unchanged.

```sh
pnpm exec turbo run test --filter=@octane-xplat/macos-renderer
pnpm exec turbo run typecheck --filter=...@octane-xplat/macos-renderer
pnpm exec turbo run test:text-controls --filter=@xplat/macos
pnpm check:recipes
```

All commands remain deferred until this task's explicit human authorization.
Actual NSSearchField editor ownership, IME, observer delivery/window moves,
selection/undo, focus, cancel/submit delivery and packaging remain unqualified.
No builds, package tests/typechecks, dependency installs, OS automation, visual
analysis or shared audit regeneration ran; no evidence checkbox is closed.


### AppKit button links and busy actions

ComponentsDemo renders action/loading/disabled buttons with primitive children;
the shared public props also document href and inherited Pressable metadata.
Assumption: save/help flows have greater demand than niche integrations. The old
AppKit controls leaf dropped href and most inherited props, passed primitive
children straight into a layout host and swapped out content while busy.

Dedicated Button.macos now uses TextSlot, forwards existing Pressable props,
keeps content under a same-cell busy overlay and exposes busy/name/value metadata.
The existing sanitizer gates the existing platform openUrl call before action
dispatch. Target has no native browsing-context behavior; this is not route
navigation. No new dependency or shared manifest/CLI edit was required.

A synchronous token guards noninterruptible reentry; interruptible overlap uses
a set so every call must settle before busy clears. Explicit/group disablement
always wins; interruptible external loading follows the existing shared native
contract. Layout-effect cleanup cancels pending UI ownership without changing
public ref identity. Failures still reach onActionError/default error reporting.
Native tooltip presentation remains missing and is explicitly retained as a gap.

Authored object-driver cases cover href sanitization/order/disablement, retained
content/host, busy naming, same-frame duplicates, overlap, sync/rejected errors,
group/loading gates, forwarded metadata/refs, primitive children and teardown.
Tests remain unrun. TSRX syntax parsing, semantic/source review and whitespace
checks only; no native input or geometry result is claimed.

```sh
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/button.macos.mobile.test.tsrx
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
pnpm exec turbo run build --filter=@xplat/macos
pnpm check:recipes
```

All commands remain deferred pending this task's explicit human authorization.
Actual mouse/keyboard delivery, CSS overlay sizing/appearance, label/name
aggregation, VoiceOver busy announcements, OS browser opening and packaging
remain unqualified. No builds, package tests/typechecks, dependency installs,
OS automation, visual analysis or audit snapshot regeneration ran; no evidence
checkbox is closed. Existing demos exercise the retained public API; no new
public workflow is introduced.


Button case review follow-up: the retained-content case now supplies width in
its documented style channel and separately checks the inherited row prop's
zero-based-to-CSS grid translation. This avoids asserting an undeclared Button
width prop. Syntax/whitespace only; the case still has not run. The deferred
commands and native limitations in the preceding section are unchanged.


### AppKit URL dispatch and Link composition

The prior source turn completed Button URL dispatch. Follow-up review found
nav-href.macos used __xplatAppKitOpenWindow({url}) for external links. The host
openWindow options construct an app window and never consume url; this is a
source contract mismatch, not a newly observed blank-window runtime result.
The helper now uses the existing platform openUrl after sanitizeUrl; relative
paths keep canonical routing. Callers include Link, list/sidebar/token and
breadcrumb navigation. No shared/mobile/GTK helper or host was changed.

Plain Link also ignored function as/LinkProvider and passed primitive children
into a layout host. It now uses the existing resolver/TextSlot, forwards color/
style and standard presentation classes, lays out an external decorative marker
in a target CSS row, and invokes onPress before default navigation. Safe valid
injection owns navigation; rejected destinations never reach the injected
function. Custom intrinsic strings beyond the default a sentinel, native target
browsing contexts and tooltip presentation remain absent. Underline is forwarded
to primitive text hosts; arbitrary supplied components keep their own styling.

Demand assumption: help/documentation links and shared navigation are common
app flows. The maintained Link.parity fixture already composes Link with Text;
new helper/object-driver source cases additionally cover primitive children,
normalized URL/relative routing, no app-window call, blocked schemes, injection
precedence/ownership, metadata and callback order. These cases remain unrun.
Only TypeScript/TSRX syntax, semantic/source and whitespace checks ran.

```sh
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/nav-href.macos.mobile.test.tsrx src/link.macos.mobile.test.tsrx src/button.macos.mobile.test.tsrx
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
pnpm exec turbo run build --filter=@xplat/macos
pnpm check:recipes
```

All commands remain deferred pending this task's explicit human authorization.
Native URL launch, router integration across consumers, key/mouse activation,
VoiceOver, inline wrapping/appearance and packaged lifecycle remain unqualified.
No builds, package tests/typechecks, installs, OS automation, visual analysis or
shared audit regeneration ran; no evidence checkbox is closed.


### Pressable identifiers and accessibility-element forwarding

Pressable underlies everyday action controls. Its AppKit leaf dropped both
accessible and testID, including Button's inherited metadata after the prior
forwarding repair. The renderer vocabulary also accepted testID without any
native application path. Renderer prerequisite first: applyProps now assigns
concrete hosts' accessibilityIdentifier once, independently of CSS id/labels,
and consumes the prop before leaf dispatch. Removal clears to an empty string;
viewless nodes do not allocate an identifier/view. The leaf now forwards both
props, preserving normal press callbacks when accessible is false.

Apple's [identifier property](https://developer.apple.com/documentation/appkit/nsaccessibility-c.protocol/accessibilityidentifier)
is programmatic identity. This is not a spoken label, AX exposure override or
proof an automation tool can find the element. The existing AccessibleHostView
ignored-element path already honors accessible=false; actual native behavior is
still unqualified. hitSlop, live-region announcements and escape-bag modifiers
remain separate Pressable gaps; no new support claim is made for them.

Two renderer cases cover identity updates/clear/separation and viewless behavior;
two object-driver cases cover Pressable metadata/retention/removal and Button
busy/disabled forwarding. All cases are authored but unrun. Public identifier
guidance now distinguishes this AppKit source subset from previously qualified
iOS/web selector evidence. No other composite forwarding audit is implied.

```sh
pnpm exec turbo run test --filter=@octane-xplat/macos-renderer
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/pressable.macos.mobile.test.tsrx src/button.macos.mobile.test.tsrx
pnpm exec turbo run typecheck --filter=...@octane-xplat/macos-renderer --filter=...@octane-xplat/ui
pnpm exec turbo run build --filter=@xplat/macos
pnpm check:recipes
```

All commands remain deferred pending this task's explicit human authorization.
Only syntax parsing, semantic/source review and whitespace checks ran. Native
identifier setters, accessibility-tree discovery/replay, ignored-element behavior,
reparenting and packaged lifetime remain unqualified. No installs, builds,
package tests/typechecks, OS automation, visual analysis or shared audit
regeneration ran; no evidence checkbox is closed.


### AppKit toggle-button action ownership

ActionControlsDemo uses pin toggles and a view-mode group. Demand assumption:
these ordinary action/selection flows matter before niche integrations. The
AppKit leaf directly invoked pressedChangeAction without declared pending
presentation/duplicate suppression, dropped most inherited Button props and
ignored node icons. It now delegates to Button.macos; standalone uncontrolled
choices flip before callbacks/save, controlled display follows the parent,
normal pending duplicates are blocked and interruptible overlap remains busy
until all calls settle. A live local choice ref supports same-frame uncontrolled
interruptible flips. Failure keeps the optimistic state and reports through
onActionError, matching the shared contract (not Switch rollback semantics).

Group membership still owns controlled single/multiple selection and ignores
member saves. The group handler now independently rejects disabled changes and
exposes named group semantics. Each member keeps its native activation path;
no group/toolbar roving keyboard implementation is claimed. Existing Button
metadata, icon-only/node icon, loading, ref and teardown behavior is reused.
Reserved semibold label width and tooltip presentation remain missing.

Renderer prerequisite: boolean pressed state on a semantic button maps to
AXCheckBox and numeric 0/1; removing pressed returns AXButton. Pressed changes
join existing AXValueChanged dispatch, with initial/equal states silent. This
follows the shared props contract's checked native representation; actual
protocol registration/role-change/VoiceOver announcements remain unqualified.

Authored six object-driver cases and one renderer case cover order, optimistic/
controlled state, errors without rollback, pending duplicates/overlap, icons,
metadata, membership, disablement, teardown and pressed getters/notifications.
A maintained native fixture includes manual success/failure controls and a
scripted direct-action/native-value lookup path. All tests/fixture remain unrun.
Only TypeScript/TSRX syntax, semantic/source and whitespace checks ran.

```sh
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/toggle-button.macos.mobile.test.tsrx src/button.macos.mobile.test.tsrx
pnpm exec turbo run test --filter=@octane-xplat/macos-renderer
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui --filter=...@octane-xplat/macos-renderer
pnpm probe run examples/probes/toggle-button.macos.tsrx --target macos --watch
pnpm check:recipes
```

All commands remain deferred pending this task's explicit human authorization.
OS mouse/key delivery, VoiceOver role/value/busy reporting, grouped focus,
busy/icon layout, native teardown and packaging remain unqualified. No builds,
package tests/typechecks, installs, OS automation, visual analysis or shared
audit regeneration ran; no evidence checkbox is closed.


### AppKit IconButton delegates to Button

ActionControlsDemo places Share inside a sized ButtonGroup and includes a separate disabled group. The old
AppKit IconButton duplicated stale action logic, ignored group disablement,
dropped inherited metadata/href and replaced the icon while busy. It is now the
same thin Button wrapper as shared native/web leaves. Two appended source cases
cover retained busy icon/name/ref/metadata, duplicate suppression, group defaults/
disablement and href dispatch. They remain unrun. Existing Button coverage and
native limitations apply; no claim is made for tooltip presentation.

```sh
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/button.macos.mobile.test.tsrx
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
pnpm check:recipes
```

All commands remain deferred pending explicit human authorization for this task.
Only syntax/source/semantic review and whitespace checks ran. Native mouse/keys,
busy/icon geometry, VoiceOver, URL launch and packaging remain unqualified; no
builds, package tests/typechecks, installs, OS automation, visual analysis or
checkbox closure occurred.


### AppKit interactive card links and text hosts

ActionControlsDemo and maintained card examples use open/select collection
surfaces. Demand assumption: these app navigation/selection flows precede niche
integrations. AppKit ClickableCard ignored href; it now uses sanitizeUrl and the
existing platform openUrl before onPress, retains disabled guards and exposes
link semantics for href or button semantics for callback-only cards. This is
native URL handling, not router navigation or browser target/modifier behavior.

Both interactive cards use TextSlot for primitives without replacing supplied
components. ClickableCard now forwards elevation and SelectableCard forwards
variant/elevation, matching existing shared native presentation classes. Existing
padding/dimension precedence and parent-owned SelectableCard requests remain.
The public action guide's stale AppKit href absence statement is reconciled;
IconButton guidance is now beside Button and the Share/group demand note is
precise. No shared API/manifest/CLI or non-AppKit leaf changed.

Three authored object-driver cases cover URL normalization/order/unsafe/disabled
paths, role changes, primitive/nested host preservation, dimensions/classes and
controlled selection/disablement. They remain unrun. Host preservation does not
prove physical nested gesture arbitration. The declared disabled-but-focusable
SelectableCard behavior still lacks an AppKit path: ordinary disabled hosts are
excluded from sequential focus. This limitation remains public and unclosed.

```sh
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/interactive-cards.macos.mobile.test.tsrx src/button.macos.mobile.test.tsrx
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
pnpm exec turbo run build --filter=@xplat/macos
pnpm check:recipes
```

All commands remain deferred pending explicit human authorization for this task.
Only syntax parsing, semantic/source review and whitespace checks ran. Native
URL launch, mouse/keyboard and nested-control arbitration, VoiceOver, disabled
focus, variant/elevation geometry/appearance and packaging remain unqualified.
No builds, package tests/typechecks, installs, OS automation, visual analysis or
shared audit regeneration ran; no evidence checkbox is closed.


### Disabled SelectableCard focus ownership

The preceding slice recorded a concrete mismatch with the public card contract:
disabled selection cards were removed from native focus because Pressable
removed their action and AccessibleHostView rejects disabled key views. Native
controls should remain disabled; globally relaxing disablement was not justified.
The renderer now owns an opt-in reference-counted disabled-focus set, published
through the internal retainDisabledFocus bridge. Claimed hosts can accept focus
and join native key-view order without acquiring an action. Hiding, independent
Tab suppression and programmatic-only scope ownership still exclude Tab stops.
Native key/AX activation continues to reject disabled hosts.

SelectableCard now owns its concrete mason host/ref and disabled-focus claim;
it releases on enablement/ref detach and refreshes the native key-view loop.
Its static flex/column normalization moved into target CSS, retaining the
pressable class and existing card padding/dimensions/text/checkbox metadata.
No public prop or non-AppKit leaf changed. Missing bridge keeps the ordinary
disabled-focus behavior; bridge presence is not runtime proof.

FocusScope's eligibility filter now honors explicit native canBecomeKeyView
when only AX enabled state is false, while retaining native enabled/isEnabled
and hidden gates. This keeps the opted-in card in contained Tab traversal and
still rejects ordinary disabled native fields/actions. Authored cases cover
renderer claim counts/independent owners/release, action rejection, hiding/Tab/
scope suppression, card enable/detach cleanup and scope candidate traversal.
They remain unrun; object-driver ownership is not real native Tab/AX evidence.
Existing class-slice fixtures default the new private focus set to no claims.

```sh
pnpm exec turbo run test --filter=@octane-xplat/macos-renderer
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/interactive-cards.macos.mobile.test.tsrx src/focus-scope-state.macos.test.ts
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui --filter=...@octane-xplat/macos-renderer
pnpm exec turbo run build --filter=@xplat/macos
pnpm check:recipes
```

All commands remain deferred pending explicit human authorization for this task.
Only syntax parsing, semantic/source review and whitespace checks ran. Actual
Tab order, native FocusScope containment/restoration, disabled AX announcements,
window moves, nested hit-testing, CSS layout and packaged lifetime remain
unqualified. No builds, package tests/typechecks, installs, OS automation,
visual analysis or shared audit regeneration ran; no checkbox is closed.


### AppKit finite selection mode and view contract

ComponentsDemo uses Selector for fruit choice; public selection examples cover
multiple/bulk choice. Demand assumption: finite form choices precede niche
integrations. Select.macos omitted the multiple view flag that shared native/web
containers pass. MultiSelector's alias delegates to this same target container,
so its multi-value state could not reach checkbox/select-all presentation.
The flag is now wired without changing shared state or public types.

SelectView now gives multiple rows checkbox semantics and single rows radio
checked state, with native disabled props and absent handlers when pending,
disabled or read-only. Bulk selection uses a raw mixed-state checkbox host.
Trigger metadata includes expanded/busy/validation state and blocked triggers
have no action. Existing useSelect coordinates array/scalar callbacks, pending
ownership and failure rollback; this slice does not replace that state machine.

renderOption and single renderValue now use TextSlot for primitive/component
results; absent selected options use the existing summary fallback. Default
option icon content is included. Native anchor/search refs are stable concrete
NSView/NSTextField refs rather than fresh any callbacks. Native ownership and
focus still require evidence. Badges, alternate presentation/ghost chrome,
arrow/typeahead navigation, popup/search/return focus and live-region behavior
remain absent or unqualified; standalone metadata ownership needs separate review.

Four authored source cases cover mode/preset/bulk arrays and mixed state,
pending/duplicate/rollback, custom/default content/missing keys and blocked view
semantics. Popover is intentionally substituted inline in this suite: it does
not exercise separate roots, OS focus, hit-testing or native input. All cases
remain unrun. Only TSRX syntax, semantic/source and whitespace checks ran.

```sh
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/select.macos.mobile.test.tsrx
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
pnpm exec turbo run build --filter=@xplat/macos
pnpm check:recipes
```

All commands remain deferred pending explicit human authorization for this task.
NSPopover root/anchor lifetime, keyboard/search/return focus, real selection and
clear gesture arbitration, VoiceOver, layout and packaging remain unqualified.
No builds, package tests/typechecks, installs, OS automation, visual analysis or
shared audit regeneration ran; no evidence checkbox is closed.


### AppKit Selector keyboard and focus ownership

The preceding Selector repair left all key behavior absent. This slice adapts
the existing web key policy to native focus ownership and reuses AppKit choice
ordering/reveal/suppression. The private helper now exposes ordered keys/manual
focus without requesting automatic selection. An explicitly false key-dispatch
capability releases roving Tab suppression (also benefiting existing tab/radio
owners); matching older test adapters retain their existing unspecified behavior.

The native trigger is now a concrete mason host so useKeyboard props reach an
intrinsic. Mounted keyed row parts own stable NSView registration. A popup
surface owns programmatic-only fallback focus, one option Tab stop and an
observer while open. Initial focus waits for attached window/search/row refs,
uses selected/edge choices or search, and does not disturb already marked search
input. Typed search handoff requests caret-at-end; actual IME/caret behavior is
not proven. Ref detachment/close releases choice claims and surface fallback;
observer cleanup is explicit. Static trigger/surface layout is target CSS.

Plain arrows/Home/End/Page keys move option focus without selection. Enter/Space
commit, pending guards remain, Escape closes without cascading to another layer,
closed Delete/Backspace clears and prefix/repeated-character matching follows
the shared policy. Search typing/caret/space and IME stay native; modified keys
pass through except nonediting multi Command/Control+A bulk choice. Nested custom
controls keep ordinary activation keys. Tab/Shift+Tab pass same-window anchor
nextValidKeyView/previousValidKeyView intent via Popover.finalFocusRef to existing
layer cleanup; this is not proof of native close/return timing. Apple's
[key-view documentation](https://developer.apple.com/documentation/appkit/nsview/nextvalidkeyview?language=objc)
is the API basis. No new public prop or shared/non-AppKit leaf changed.

Rows recheck current open/blocked/pending/catalog state and their native ref
before picking, including callbacks retained during delayed popup teardown.
Search/bulk callbacks also consult current ownership. A closing surface blocks
stale plain-key activation while leaving composition and OS shortcuts alone.
The wiring case retains old callbacks to inspect these guards; it still cannot
prove actual native teardown ordering.

Six policy cases, one inline-popup/native-shaped wiring case and two choice
helper cases are authored, plus a maintained keyboard fixture. All remain unrun.
The wiring test asserts focus/return intent using fake windows and substitutes
Popover; it cannot qualify NSPopover, physical keys, layer timing or VoiceOver.
Only TypeScript/TSRX syntax, semantic/source and whitespace checks ran.

```sh
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/select-keyboard.macos.mobile.test.tsrx src/select.macos.mobile.test.tsrx src/tab-list.macos.mobile.test.tsrx src/radio-list.macos.mobile.test.tsrx
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
pnpm probe run examples/probes/select-keyboard.macos.tsrx --target macos --watch
pnpm exec turbo run build --filter=@xplat/macos
pnpm check:recipes
```

All commands remain deferred pending explicit human authorization for this task.
Physical key/IME delivery, separate-popup root/window lifetime, actual initial/
return/Tab focus, modal FocusScope integration, nested-input arbitration, native
scroll reveal, VoiceOver and packaging remain unqualified. Removable badges,
alternate presentation/ghost chrome, live announcements and standalone Field
ownership remain separate gaps. No builds, package tests/typechecks, installs,
OS automation, visual analysis or shared audit regeneration ran; no checkbox
is closed.


Selector wiring-case review follow-up: its fake notification center now isolates
window-update claims, and the case requires one active observer before asserting
close cleanup. This prevents an absent observer from making cleanup appear
covered. The case remains unrun; syntax/whitespace only, with the same deferred
commands and native qualification limits above.


### AppKit Selector Field metadata ownership

The next common form gap was standalone metadata: Select.macos resolved Field
props but never rendered FormField labels/descriptions/status. It now uses the
existing useFieldControl ownership boundary, generates one stable control ID and
wraps only standalone views in FormField. Parent Field keeps text ownership and
inherited blocked state. The existing view keeps its trigger class/style and
selection owner; metadata updates do not intentionally replace the host. TestID
now reaches the raw trigger and ghost forwards the existing vx-select--ghost
class. No new public prop, external dependency or shared/non-AppKit leaf changed.

Three authored cases cover standalone metadata/hints/required/status/generated
identity, parent Field single ownership and disablement/read-only state, and
hidden names/ghost reset on retained hosts. The maintained keyboard fixture now
includes description/testID metadata. All remain unrun; only syntax, semantic/
source and whitespace checks ran. Native FormField layout, label interaction,
tooltip/AX relationships and identifier replay remain unqualified.

Badge/remove controls are deliberately not added in this slice: existing clear
controls are nested in the trigger and renderer click arbitration with interactive
children needs a separate source/runtime review before expanding that pattern.
This is not a new runtime finding or a reason to close any evidence gate.
Alternate presentation, badges and live announcements remain implementation gaps.

```sh
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/select.macos.mobile.test.tsrx src/select-keyboard.macos.mobile.test.tsrx
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
pnpm probe run examples/probes/select-keyboard.macos.tsrx --target macos --watch
pnpm check:recipes
```

All commands remain deferred pending explicit human authorization for this task.
Physical keys/IME, separate-root popup/focus lifetime, label/clear arbitration,
Field geometry/ghost painting, VoiceOver, identifier discovery and packaging
remain unqualified. No builds, package tests/typechecks, installs, OS automation,
visual analysis or shared audit regeneration ran; no checkbox is closed.

### AppKit nested primary click ownership

Common cards and Selector clear controls nest actions inside clickable hosts.
Source inspection found no explicit primary-click ownership gate; default AppKit
arbitration was unqualified, not a demonstrated double-activation runtime bug.
Primary action recognizers now opt into an attempt delegate which consults the
actual native hit ancestry. Root hit testing uses content-superview coordinates.
Registered native controls, semantic widgets (including disabled ones), and live
action hosts block ancestor actions; decorative labels/images/groups do not.
The gate reads current metadata/actions rather than retaining old callbacks.
Only setAction primary clicks opt in; other gesture defaults stay unchanged.
No public props/exports, shared manifests, dependencies or audit snapshots changed.

Seven authored source cases cover hit coordinates/ancestry, invalid ownership,
classification, live action/role updates, reuse and optional delegate lifetime.
Only TypeScript syntax, source review and whitespace checks ran. All tests below
remain unrun. Registered renderer nodes delimit the policy; unregistered native
subviews retain AppKit defaults. Native callback registration, actual pointer
activation, nested clear controls, keyboard/AX, long-press competition and hosted
engine behavior remain unqualified; no runtime checkbox is closed.

```sh
pnpm exec turbo run test --filter=@octane-xplat/macos-renderer
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/select.macos.mobile.test.tsrx src/interactive-cards.macos.mobile.test.tsrx
pnpm exec turbo run typecheck --filter=...@octane-xplat/macos-renderer --filter=...@octane-xplat/ui
pnpm exec turbo run build --filter=@xplat/macos
pnpm check:recipes
```

All commands remain deferred pending explicit human authorization for this task.
No builds, package tests/typechecks, installs, OS automation, visual analysis or
shared audit regeneration ran. Removable selection badges and presentation/live
announcement gaps remain separate implementation work.

### AppKit removable multi-selection badges

MultiSelector/Selector multiple mode now honors triggerDisplay=badges with keyed
native token hosts, selected-order labels and fallback labels for unlisted keys.
Known enabled choices remove through existing onPick/shared useSelect state,
including save ownership/deduplication/rollback. Blocked/pending/disabled/unlisted
choices retain inert removal controls. Handlers read current props/options and
selection and reject detached anchors or changes away from badge/multiple mode.
The source renderer primary-click gate from c5102119d is a prerequisite, not
native mouse proof. Only AppKit view and target fixture/cases changed; no shared
state/export/manifest/dependency change. Existing badge chrome is reused with
AppKit flex container classes.

Three authored cases cover order/fallback/uncontrolled removal, stale guard/
option/detach reads and pending deduplication/failed-save restoration. All remain
unrun. Syntax/source/whitespace checks only; sem cannot resolve the TSRX SelectView
entity and is not behavior evidence. Guide/skill, finite-select recipe AC8 and
the existing maintained keyboard fixture now cover badge display.

```sh
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/select.macos.mobile.test.tsrx src/select-keyboard.macos.mobile.test.tsrx
pnpm exec turbo run test --filter=@octane-xplat/macos-renderer
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui --filter=...@octane-xplat/macos-renderer
pnpm probe run examples/probes/select-keyboard.macos.tsrx --target macos --watch
pnpm exec turbo run build --filter=@xplat/macos
pnpm check:recipes
```

All commands remain deferred pending explicit human authorization for this task.
Actual pointer isolation, badge wrapping/hit geometry, keyboard focus/Tab behavior,
VoiceOver/AX naming and packaging remain unqualified. No build, package tests/
typechecks, installs, OS automation, visual analysis or shared audit regeneration
ran; no evidence checkbox is closed. Alternate picker presentations and live
announcements remain separate implementation gaps.

### AppKit empty-cell PIN Backspace

ComponentsDemo contains a four-cell PinInput. The source already advances focus
on entry but had no empty-cell key path. The target group now consumes plain
Backspace only from its own empty editable, non-first mounted cell and requests
previous-cell focus. It leaves the contiguous code and change/completion
callbacks untouched. Filled cells, unavailable future cells, first cells,
unrelated targets, prevented events, IME and modified shortcuts keep native
editor ownership. Parent disabled/read-only state blocks this path.

The private intrinsic handler needs the native target to match existing
TextInputHandle.native identities: portable useKeyboard deliberately strips
native targets. The existing renderer maps a shared field editor back to its
owning text field and reports marked-text composition. No new public keyboard
prop, renderer change, dependency, shared state or layout wrapper was added.
Two authored object-driver cases cover controlled/uncontrolled focus intent
without edits and the preserved editor/blocked-target gates. They remain unrun.
Only TSRX syntax, semantic/source review and whitespace checks ran. The existing
Components demo continues to provide the maintained four-cell usage; public
PIN guidance, skill and pin-entry recipe AC5 now document this target behavior.

```sh
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/pin-input.macos.mobile.test.tsrx src/text-controls.macos.mobile.test.tsrx
pnpm exec turbo run test --filter=@octane-xplat/macos-renderer
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
pnpm exec turbo run build --filter=@xplat/macos
pnpm check:recipes
```

All commands remain deferred pending explicit human authorization for this task.
Physical Backspace/field-editor target mapping, native focus/caret, IME, secure
input/VoiceOver and packaged operation remain unqualified. OTP autofill and
native digit filtering remain implementation gaps. No build, package test/
typecheck, install, OS automation, visual analysis or shared audit regeneration
ran; no evidence checkbox is closed.

### AppKit editable-field test identifiers

The public testing guide recommends TextInput testID for editable-field targeting.
AppKit TextInputControl/TextAreaControl dropped that public prop; SearchInput
inherits TextInput, so it also lost the identifier. Both native editable leaves
now forward testID to the textfield/textview, retaining the existing renderer
accessibilityIdentifier mapping. Shells, labels and clear buttons do not inherit
it. No new dependency, shared API, renderer or manifest change.

Two authored object-driver cases cover all three controls, identity update/removal,
retained edited text/host/ID/spoken label, and parent Field/clear separation. They
remain unrun. Only TSRX syntax, source review and whitespace checks ran; sem could
not resolve these TSRX control entities. Guide/skill and agent-ui-checks recipe
source scope were updated; the existing test-identifier public usage remains the
maintained example. No native automation discovery/replay result is claimed.

```sh
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/text-controls.macos.mobile.test.tsrx
pnpm exec turbo run test --filter=@octane-xplat/macos-renderer
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
pnpm exec turbo run build --filter=@xplat/macos
pnpm check:recipes
```

All commands remain deferred pending explicit human authorization for this task.
Actual accessibility identifier update/removal, field-editor/native control
identity, automation discovery/replay, VoiceOver and packaged operation remain
unqualified. No builds, package tests/typechecks, installs, OS automation, visual
analysis or shared audit regeneration ran; no evidence checkbox is closed.

### AppKit FileInput operation ownership

FileInputDemo is an ordinary attachment flow. Source review found no immediate
picker lock, stale captured values/constraints in picker completions, sync throws
bypassing cleanup, and no detached-result guard. The AppKit control now uses a
small target-only controller which owns one picker/save token before calling
user code. Picking/saving/removing/clearing share the lock. Acceptance reads
current values/constraints/blocked state; removal looks up current URI identity
rather than a stale index. Sync/async picker/save failures become validation
status and release busy; cancellation retains existing selection/errors.
Parent-owned values are not rolled back on save failure, preserving the existing
FileInput contract. Stale detached completions cannot clear a newer attached
operation. A custom picker is not cancelled, and this is not a global panel broker.

A stable concrete NSView trigger ref owns attachment and teardown; the public
handle reads its current native host and calls the stable controller. The target
leaf imports files.macos explicitly, avoiding reliance on native-default plugin
resolution at this seam. No new dependencies, shared manifests, props or non-AppKit
leaves changed. The maintained FileInputDemo remains the usage harness. Public
files/date-picker docs, service skill and date-picker recipe AC9 cover ownership.
Seven authored pure-controller cases cover reentry, latest constraints/values,
blocked results, sync failures/cancellation, detached/newer ownership, URI reorder
and save teardown. Cases remain unrun; UI/native ref wiring is source-only.
Only TypeScript/TSRX syntax, semantic/source review and whitespace checks ran.

```sh
pnpm exec turbo run test --filter=@octane-xplat/files -- src/file-input-state.macos.test.ts src/files.macos.test.ts
pnpm exec turbo run typecheck --filter=...@octane-xplat/files
pnpm exec turbo run build --filter=@xplat/macos
pnpm exec turbo run test:packed --filter=@octane-xplat/files
pnpm check:recipes
```

All commands remain deferred pending explicit human authorization for this task.
Actual panel/cancel interaction, native refs/focus/AX, sandbox/grants and packaging
remain unqualified; AppKit drag/drop is unimplemented. No build, package tests/
typechecks, install, OS automation, visual analysis or shared audit regeneration
ran; no evidence checkbox is closed. No fix release note is added for this
unqualified source gap; no containing stable tag was found for the source audit
commit in the local tag inventory.

### AppKit FileInput default metadata

FileInputDemo accepts image/*,.pdf, but AppKit's files picker returns only name
and URI. FileInput MIME checks require MIME metadata, so source composition
rejected common images after picking; missing size also skipped maxSize. The
AppKit default component adapter now enriches picks with finite extension-based
MIME hints and optional Foundation file-size metadata before controller validation.
Custom pickers keep their supplied metadata; files.pick/FileRef exports and
other targets remain unchanged. The existing AppKit MIME table moved unchanged
to a target-private helper so picker filtering and hints share entries; a direct
source comparison confirmed extraction preserved all entries.

Metadata reads use a decoded NSURL path and best-effort NSFileManager attributes,
accept zero/nonnegative safe byte sizes, preserve supplied metadata, and balance
only acquired security-scope claims. Missing bridge/attributes or unknown types
stay optional. This is filename inference, not content discovery/verification;
metadata can become stale, missing sizes still skip maxSize, and readBytes maxBytes
remains the actual read limit. No UniformTypeIdentifiers integration or new
system MIME coverage is claimed. Native bridge behavior remains unqualified.

Five authored cases cover the demo image filter/maxSize, NSNumber/zero/invalid
sizes, scope balance/errors, preserved/missing/remote metadata, recognized concrete
MIME aliases and controller validation. All remain unrun. Only TypeScript/TSRX syntax, semantic/source review,
MIME-table source comparison and whitespace checks ran. Files/date-picker guides,
services skill and date-picker recipe AC10 now describe this boundary; the existing
FileInputDemo remains the maintained usage fixture.

```sh
pnpm exec turbo run test --filter=@octane-xplat/files -- src/file-input-details.macos.test.ts src/file-input-state.macos.test.ts src/files.macos.test.ts
pnpm exec turbo run typecheck --filter=...@octane-xplat/files
pnpm exec turbo run build --filter=@xplat/macos
pnpm exec turbo run test:packed --filter=@octane-xplat/files
pnpm check:recipes
```

All commands remain deferred pending explicit human authorization for this task.
Actual native NSNumber/dictionary/NSURL metadata, security grants, panel acceptance,
ref/focus/AX and packaging remain unqualified. No builds, package tests/typechecks,
installs, OS automation, visual analysis or shared audit regeneration ran; no
checkbox is closed. Drag/drop and OS content-type discovery remain separate gaps.

### AppKit menu host prerequisites

ComponentsDemo and OverlayDemo use shared action menus, checkbox/radio choices
and submenus. Before keyboard navigation work, source review found disabled rows
retained native activation handlers (despite semantic disabled state), dropdown
button refs/IDs were overwritten, and controlled disabled menus could still show
surfaces. AppKit action/checkbox/radio/submenu hosts now receive disabled; group
radio state applies to the native row/class. Dropdown preserves button.ref and
uses button.id unless its own ID overrides it. Concrete NSView anchors replace
these touched any refs. All five actionable row kinds forward destructive tone.

Effective dropdown visibility now includes own/button/ButtonGroup disablement;
context/submenu visibility includes own disablement. Blocked surfaces suppress
requested open immediately and request onOpenChange(false), while keeping parent
state authoritative when enabled again. Submenu expanded metadata follows effective
visibility. Existing Popover/layer ownership remains unchanged; no new dependencies,
exports, shared props/manifests or other target leaves changed.

Five authored target object-driver cases cover host reenable/retained identity,
controlled checkbox/radio requests, trigger ref/ID handoff, own/button/group disabled
visibility, context/submenu close intent and tone reset. They remain unrun and
substitute inline content for Popover, so no real popup/focus/refs are qualified.
Only TSRX syntax, source/semantic review and whitespace checks ran. Shared menus
recipe AC6 and guide/skill now cover the target scope; stale Dropdown trigger
snippets/component index were reconciled to the current button prop. Existing
ComponentsDemo/OverlayDemo remain maintained usage harnesses.

```sh
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/menu-family.macos.mobile.test.tsrx
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
pnpm exec turbo run build --filter=@xplat/macos
pnpm check:recipes
```

All commands remain deferred pending explicit human authorization for this task.
Hardware arrow/typeahead/submenu navigation, native secondary-click opening and
full menu AX roles/checked announcements remain implementation gaps. Native
popup/ref/focus/Tab timing, OS hit testing, physical keys, VoiceOver and packaging
remain unqualified. No builds, package tests/typechecks, installs, OS automation,
visual analysis or shared audit regeneration ran; no checkbox is closed.

### AppKit menu surface keyboard ownership

ComponentsDemo/OverlayDemo use menus and nested choices. After b6095f8d9 repaired
native disabled/trigger ownership, MenuSurface now owns a target-private registry
of current row intents and concrete NSView refs. Each popup root provides its own
registry; native child order/visibility and current disabled flags determine the
manual navigation set. Up/Down wrap, Home/End move to edges, and 500ms label-prefix/
repeated-character search moves focus without choosing. Enter/Space calls existing
action/checkbox/radio/link selection owners. Forward/backward submenu arrows follow
RTL; the obsolete web-only submenu key attachment was removed from the target.
Row callbacks read current props and reject disabled/detached hosts.

The surface waits for a native window before initial first/last/container focus,
uses the existing choice-helper Tab-stop claims/reveal path, and releases native
fallback focus claims/observers on detach. Dropdown/submenu request first-row focus
and supply anchor return refs to existing Popover/layer owners; controlled close
requests do not intentionally restore before acceptance. Surface Escape remains
with layer dismissal; Tab requests close while preserving native Tab default.
Nested endContent editors retain key ownership. A raw surface intrinsic is needed
for key attachment; its prior column layout is preserved by target CSS. No new
public props/exports/dependencies or shared manifests changed.

Five authored policy cases and two fake-window/inline-popup wiring cases cover
manual navigation/activation, RTL submenu intents, prefixes/expiry, IME/modifiers,
empty/rejected focus, current props/disabled/detach guards, nested editor keys,
registry isolation, controlled close intent and claimed observer/Tab/focus cleanup.
They remain unrun; fake Popover/windows cannot prove real initial/return focus.
The new maintained menu-keyboard.macos fixture dispatches only the existing trigger
in its runner and synthesizes no OS keys. Docs/skill and shared-menus AC7 now cover
the source path and gaps. Only TypeScript/TSRX syntax, semantic/source and whitespace
checks ran; sem misparses the complex TSRX surface as deleted, but the actual export
and parser input remain present.

```sh
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/menu-keyboard.macos.mobile.test.tsrx src/menu-family.macos.mobile.test.tsrx src/tab-list.macos.mobile.test.tsrx
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
pnpm probe run examples/probes/menu-keyboard.macos.tsrx --target macos --watch
pnpm exec turbo run build --filter=@xplat/macos
pnpm check:recipes
```

All commands remain deferred pending explicit human authorization for this task.
Closed-trigger arrow opening and reliable cross-popup Tab return remain separate
implementation gaps, alongside native secondary click and full menu AX roles/
checked announcements. Physical keys/IME, actual initial/return/Tab focus, separate-
root window timing, RTL provider delivery, native reveal, nested/modal integration,
mouse hit testing, VoiceOver and packaging remain unqualified. No builds, package
tests/typechecks, installs, OS automation, visual analysis or shared audit snapshot
regeneration ran; no evidence checkbox is closed.

### AppKit dropdown trigger arrow ownership

After menu-surface keys landed in d6acdee56, the ordinary closed dropdown trigger
still ignored Up/Down because Button/Pressable intentionally do not forward public
keyboard props. Added private owned view-key subscriptions beside reconciled
handlers in the existing renderer dispatcher, sharing its single native monitor.
Prop handlers run first; same-view listeners share prevention, ancestor stopping
remains separate from native default, and mid-delivery removed listeners are
skipped. Leases are independent even for reused handler objects. The renderer
bridge gates current node identity/blocked state, enters discrete event scope and
uses one node destroy hook to release outstanding subscriptions. Ref release and
node fallback cleanup do not replace unrelated key/modality owners.

A target-private hook attaches to the DropdownMenu Button's actual NSView, reads
current handlers and accepts only that exact target, preserving descendant editor
keys. Plain closed-trigger Down/Up now requests first/last-row opening; the ref
hint survives delayed controlled acceptance. Current disabled/open state, IME,
modified/prevented events are preserved. Ordinary activation resets first-row
intent. Existing button ID/ref/layout are retained; no wrapper, new public prop,
workspace dependency or shared manifest change. An older/missing subscription
bridge retains existing Button activation without the new arrow path.

Four dispatcher cases, three bridge-slice cases and two fake-window/menu cases
cover independent ownership/monitor lifetime, same-view prevention/ancestor
ordering, mutation/disposal, node scope/disabled/stale/released guards, teardown
without skipping other hooks, trigger edges, controlled acceptance, descendant
keys and ref cleanup. All nine are unrun. Only TypeScript/TSRX syntax, source/
semantic review and whitespace checks ran. The existing maintained menu-keyboard
fixture now describes trigger arrows but its runner still dispatches only the
ordinary trigger, with no OS key synthesis. Docs/skill, renderer README, feature
note and shared-menus AC8 were reconciled; public props/root exports are unchanged.

```sh
pnpm exec turbo run test --filter=@octane-xplat/macos-renderer
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/menu-family.macos.mobile.test.tsrx src/menu-keyboard.macos.mobile.test.tsrx
pnpm exec turbo run typecheck --filter=...@octane-xplat/macos-renderer --filter=...@octane-xplat/ui
pnpm probe run examples/probes/menu-keyboard.macos.tsrx --target macos --watch
pnpm exec turbo run build --filter=@xplat/macos
pnpm check:recipes
```

All commands remain deferred pending explicit human authorization for this task.
Native monitor order/deduplication, actual view refs/registration, physical arrows/
IME, popup initial/return focus, modal interaction, RTL provider delivery, VoiceOver
and packaging remain unqualified. Reliable cross-popup Tab return, secondary-click
opening and full menu AX roles/checked announcements remain separate implementation
gaps. No builds, package tests/typechecks, installs, OS automation, visual analysis
or shared audit snapshot regeneration ran; no evidence checkbox is closed.

### AppKit owned menu Tab return intent

Menu surfaces still used native Tab after requesting close, leaving a separate
popup window to decide movement. Source review found a prerequisite in generic
layer focus restoration: it always called the initially captured window even
when an explicit final target belonged to a different live window, and retained
shared field editors rather than their stable owner. Added an AppKit layer-keys
leaf with the same public capture signature and unchanged Escape monitor source;
its focus adapter uses the explicit target's window, resolves field editors,
rejects detached/hidden/disabled targets and moved fallback views, and honors
explicitly focusable disabled-card claims. Its native-host path sets first responder without adding
window activation. Actual native behavior is unqualified.

Owned DropdownMenu and submenus now provide private return owners within each
popup root. Tab/Shift-Tab resolves the outer trigger's current same-window next/
previous valid key view (or the trigger fallback), records intent and requests
closure; the policy consumes owned Tab without eagerly moving focus. Dynamic
return refs choose the closest accepted open ancestor's row, delegating to the
root target after the chain closes. Thus an accepted child close with a declined
root close does not intentionally jump into the app window. Existing layer
accepted-close restoration remains the only execution owner. Ordinary dismissal/
trigger actions reset Tab intent. ContextMenu and unowned surfaces retain native
Tab fallback; no new public props, dependencies or shared file changes were made.

Four layer-focus, three return-owner, one policy and two inline-popup cases cover
explicit windows/field owners, native flags, nested accepted visibility, same-window
neighbors/stale targets, direction/fallback, controlled return intent and absence
of eager focus calls. All ten are unrun. Only TypeScript/TSRX syntax, semantic/
source and whitespace checks ran. Existing menu fixture text, guide/skill, feature
note and shared-menus AC9 were reconciled. The runner still dispatches only the
ordinary trigger and does not synthesize OS keys. The new target Escape setup was
copied unchanged from the existing default; no new Escape dispatch result is claimed.

```sh
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/layer-focus.macos.mobile.test.tsrx src/menu-return.macos.mobile.test.tsrx src/menu-keyboard.macos.mobile.test.tsrx src/menu-family.macos.mobile.test.tsrx
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
pnpm probe run examples/probes/menu-keyboard.macos.tsrx --target macos --watch
pnpm exec turbo run build --filter=@xplat/macos
pnpm check:recipes
```

All commands remain deferred pending explicit human authorization for this task.
Native effect/cleanup order, actual Tab traversal and focus restoration, key-window
activation timing, secure-field/IME behavior, modal/FocusScope interaction, AX and
packaging remain unqualified. ContextMenu/unowned Tab intent, secondary click and
full menu AX roles/checked announcements remain implementation gaps. Native-backed focus handles receive attachment checks; explicit opaque custom
focus delegates preserve caller-owned behavior whose attachment cannot be inspected. No builds, package tests/typechecks, installs,
OS automation, visual analysis or shared audit snapshots ran; no checkbox is closed.

### AppKit context menu keyboard and invoker return

ComponentsDemo exposes context actions through a visible text trigger and long
press. AppKit ContextMenu had no keyboard opening path, invoker return ownership
or primitive trigger host. It now requests open on Shift+F10 from a current owned
focused descendant, preserving prevented/composing/Alt/Ctrl/Meta events and current
disabled/open state. A typed native key target is needed to remember the invoker;
the renderer already normalizes shared field editors to their control. Nested
context scopes stop the accepted key from reaching ancestors. No standalone
wrapper Tab stop or no-op primary action was added.

Keyboard origins and visible-trigger refs now feed the existing private menu
return owner. They must remain eligible, inside the wrapper and in its current
window; an invalid remembered origin falls back to the visible trigger. Tab/Shift-
Tab records neighbor intent through controlled acceptance and existing layer
restoration; ordinary dismissal resets it. Long-press-only menus with no live
invoker keep native Tab fallback. Stable wrapper binding preserves remembered
origins across render, while layout effects retain existing escape-prop updates.
Visible trigger primitives use TextSlot; wrapper/menu labels fall back to label
and effective expanded/disabled metadata is forwarded. No public API/dependency,
shared manifest or renderer change was needed.

Three origin-policy and three appended inline-popup cases cover same-window
ancestry/eligibility, Shift+F10/control acceptance, visible-trigger primitive/text
and return, live blocked/detach/foreign/IME/modifier guards and originless fallback.
All six remain unrun. Fake native-tree hydration now supplies simulated superview
links, so origin checks cannot pass on absent ancestry. Only TypeScript/TSRX
syntax, semantic/source review and whitespace checks ran. Existing maintained
menu-keyboard fixture now includes a focused ContextMenu example; its runner still
only dispatches the ordinary dropdown trigger. Guide/skill, feature note and
shared-menus AC10 were reconciled. Also corrected an earlier guide edit that used
DropdownMenu's button prop on ContextMenu; its public prop remains trigger.

```sh
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/context-menu-origin.macos.mobile.test.tsrx src/menu-family.macos.mobile.test.tsrx src/menu-return.macos.mobile.test.tsrx
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
pnpm probe run examples/probes/menu-keyboard.macos.tsrx --target macos --watch
pnpm exec turbo run build --filter=@xplat/macos
pnpm check:recipes
```

All commands remain deferred pending explicit human authorization for this task.
Native Shift+F10 delivery, actual invoker/popup/Tab focus, refs/window timing,
long-press/nested gesture arbitration, field-editor/IME behavior, full menu AX and
packaging remain unqualified. Native secondary click and dedicated hardware
Context Menu key normalization remain implementation gaps. No builds, package
tests/typechecks, installs, OS automation, visual analysis or shared audit snapshots
ran; no evidence checkbox is closed.


### AppKit context pointer ownership

ComponentsDemo's document/context actions are an everyday desktop flow; the
previous target implementation had Shift+F10, visible-trigger and long-press
paths but no secondary-click ownership. The AppKit renderer now retains a private
lease on each existing ContextMenu wrapper. A single local pointer monitor sends
secondary-down or plain Control-primary-down through the actual hit view's native
ancestry, nearest live owner first. Ordinary primary events and Control with
Shift/Option/Command remain native defaults. Hit testing reuses the existing
content-view superview coordinate conversion; the primary-click gate policy is
unchanged. This is source evidence only.

Owned handlers enter discrete event scope and check current node/props; ref and
node teardown release subscriptions. Declining handlers allow outer scopes;
accepted intents consume the down event, and logged handler faults remain
consumed. Pointer modality observers run before context delivery so consuming the
event cannot starve focus-visible state of that pointer observation. Modality
readers use the shared pointer lease when present; older bridges retain their
previous native observation path. Decorative hits choose an eligible focusable
ancestor as return host, then the visible trigger. Existing controlled acceptance
and menu/layer return owners remain in charge; no public prop/dependency or shared
package manifest changed.

Five dispatcher, two renderer-bridge, one origin, two modality and two appended
inline-popup cases were authored, all twelve unrun. The popup cases invoke fake
bridge callbacks; they do not prove native primary-action suppression. Source
semantic review, TypeScript/TSRX syntax parsing and whitespace checks passed.
Guide/skill/renderer contract, existing feature note, maintained menu fixture and
shared-menus AC11 were reconciled. The fixture runner still dispatches only the
ordinary dropdown trigger; it synthesizes no OS key or mouse events.

```sh
pnpm exec turbo run test --filter=@octane-xplat/macos-renderer
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/menu-family.macos.mobile.test.tsrx src/context-menu-origin.macos.mobile.test.tsrx
pnpm exec turbo run test --filter=@octane-xplat/ui -- src/focus-visible-source.macos.test.ts
pnpm exec turbo run typecheck --filter=...@octane-xplat/macos-renderer --filter=...@octane-xplat/ui
pnpm probe run examples/probes/menu-keyboard.macos.tsrx --target macos --watch
pnpm exec turbo run build --filter=@xplat/macos
pnpm check:recipes
```

All commands remain deferred pending explicit human authorization for this task.
Native down/up delivery, primary-action suppression, hit-testing, monitor ordering,
popup/ref/focus/Tab timing, nested/long-press/embedded-engine arbitration, IME,
VoiceOver and packaging remain unqualified. Dedicated hardware Context Menu key
normalization, originless/unowned Tab ownership and full menu AX roles/checked
announcements remain implementation gaps. No builds, package tests/typechecks,
installs, OS automation, visual analysis or shared audit snapshots ran; no evidence
checkbox is closed.


### AppKit dedicated Context Menu key intent

Continuing the common document-action flow, source inspection found that the
keyboard dispatcher left the dedicated Context Menu key unmapped and ContextMenu
accepted only Shift+F10. Checked the installed Apple SDK headers (CommandLineTools
MacOSX.sdk): HIToolbox Events.h declares kVK_ContextualMenu = 0x6E; AppKit
NSEvent.h declares NSMenuFunctionKey = 0xF735. These are source constants, not
runtime evidence. The renderer now normalizes the virtual key to key/code
ContextMenu and the function character to logical key ContextMenu. Character-only
identification preserves the reported physical code, including empty unknown
codes. Modifier, key-up, marked-text and field-editor handling stay in the existing
dispatcher. No new public API or dependency was introduced.

ContextMenu accepts only plain dedicated-key intent (or its existing Shift+F10),
reusing live owned invoker, disabled/open/prevented/IME guards and controlled
acceptance/return ownership. Two Node cases were authored and two existing
parameterized menu cases expanded to the dedicated key, adding two menu cases;
all four are unrun. TypeScript/TSRX syntax parsing, semantic/source review and
whitespace checks only. Guide/skill/renderer contract, existing feature note,
maintained fixture and shared-menus AC10 were reconciled. No OS input was
synthesized by the fixture runner.

```sh
pnpm exec turbo run test --filter=@octane-xplat/macos-renderer
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/menu-family.macos.mobile.test.tsrx
pnpm exec turbo run typecheck --filter=...@octane-xplat/macos-renderer --filter=...@octane-xplat/ui
pnpm probe run examples/probes/menu-keyboard.macos.tsrx --target macos --watch
pnpm exec turbo run build --filter=@xplat/macos
pnpm check:recipes
```

All commands remain deferred pending explicit human authorization for this task.
Physical keyboard availability/native delivery, modifier/key-equivalent routing,
IME, popup/ref/focus/Tab timing, VoiceOver and packaging remain unqualified. Full
menu AX roles/checked announcements and originless/unowned Tab ownership remain
source gaps. No heavy checks, installs, OS automation, visual analysis or shared
audit regeneration ran; no evidence checkbox is closed.


### AppKit native enabled selector prerequisite

Before extending menu AX roles, source review found a common-control prerequisite:
AccessibleHostView exposed accessibilityIsEnabled, while the installed Apple SDK
NSAccessibilityProtocols.h declares accessibilityEnabled with getter
isAccessibilityEnabled. Generated platform declarations also expose the latter.
UI focus helpers read the former name. Direct source-slice callbacks could pass
while never overriding the selector AppKit uses for AXEnabled. This is a verified
source mismatch, not an observed native AX failure, and belongs to Xplat's local
renderer rather than an asserted upstream limitation.

The host now exposes/uses the correct getter for native press, adjustments, direct
key activation and Tab eligibility. AppKit choice/grid/FocusScope/layer-return/
context-origin eligibility reads the same native getter, preserving disabled-card
focus claims without enabling actions. Updated target fixtures use the native
name, including the maintained gesture case. No compatibility alias, new public
prop, dependency, shared manifest or other platform leaf was introduced.

One new selector/retained-state case checks the exposed protocol name and that
state updates override a simulated inherited enabled default. Existing checkbox,
common-control, grid/scope/layer/context/select/menu/tab fixtures were reconciled;
all cases remain unrun. TypeScript/TSRX syntax, semantic/source review and
whitespace checks only. Renderer contract/skill, existing feature note and
appkit-control-accessibility AC5 were reconciled. No app-building workflow/API
changed; existing component usage stays valid.

```sh
pnpm exec turbo run test --filter=@octane-xplat/macos-renderer
pnpm exec turbo run test --filter=@octane-xplat/ui -- src/grid-navigation.macos.test.ts src/focus-scope-state.macos.test.ts
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/context-menu-origin.macos.mobile.test.tsrx src/layer-focus.macos.mobile.test.tsrx src/select.macos.mobile.test.tsrx src/menu-family.macos.mobile.test.tsrx src/tab-list.macos.mobile.test.tsrx
pnpm exec turbo run typecheck --filter=...@octane-xplat/macos-renderer --filter=...@octane-xplat/ui
pnpm probe run packages/macos-renderer/test/fixtures/gestures.macos.tsrx --target macos --watch
pnpm exec turbo run build --filter=@xplat/macos
pnpm check:recipes
```

All commands remain deferred pending explicit human authorization for this task.
Native ObjC registration/override, AXEnabled queries, disabled/native choice focus,
key-view traversal, layer restoration and disabled-card focus, VoiceOver and
packaging remain unqualified. Full menu AX roles/checked announcements remain a
separate source gap; no evidence checkbox is closed. No builds, package
tests/typechecks, installs, OS automation, visual analysis or shared audit
regeneration ran.


### AppKit menu role and state query metadata

Continuing everyday menu support after the enabled-selector prerequisite, source
review found that shared leaves already authored menu/menuitem/menuitemcheckbox/
menuitemradio roles and selected/expanded state, but AccessibleHostView returned
AXGroup for those roles and had no native selected/expanded getter override.
DropdownMenuLink also omitted its text label from host AX metadata. ComponentsDemo
uses these row families, so this is a common interaction prerequisite rather than
a niche integration. Installed Apple SDK NSAccessibilityConstants.h and
NSAccessibilityProtocols.h plus generated platform declarations establish the role
constants and exact getters; Apple protocol docs corroborate the query meanings.
This is source evidence, not an AX or assistive-technology run.

The renderer now maps menu to AXMenu and all menu row roles to AXMenuItem. Row
titles use the current AX label; other roles keep the inherited native title.
isAccessibilitySelected/isAccessibilityExpanded expose only current strict-true
selected/expanded state. Action dispatch cannot replace parent feedback. Checkbox/
radio checked state is not substituted for selection or an invented menu value.
Menu links forward current string labels and clear absent/non-text labels.

Two renderer cases cover live roles/titles, inherited title fallback, exact native
selector metadata, parent-owned query state and removal. One inline-popup link
case covers retained host/label updates and non-text clearing. All three are
unrun. TypeScript/TSRX syntax, semantic/source review and whitespace checks only.
Guide/skill/renderer contract, existing feature note and shared-menus AC12 were
reconciled. No public API/dependency, shared manifest or other platform leaf changed.

```sh
pnpm exec turbo run test --filter=@octane-xplat/macos-renderer
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/menu-family.macos.mobile.test.tsrx
pnpm exec turbo run typecheck --filter=...@octane-xplat/macos-renderer --filter=...@octane-xplat/ui
pnpm probe run examples/probes/menu-keyboard.macos.tsrx --target macos --watch
pnpm exec turbo run build --filter=@xplat/macos
pnpm check:recipes
```

All commands remain deferred pending explicit human authorization for this task.
Menu mark-character attributes, expanded-state notifications and complete
shown-menu/selected-child relationships remain source gaps. Existing value-change
policy is unchanged. Native ObjC selector/property forwarding (including inherited
title access), actual AX roles/queries/tree, checked-state announcements, popup/
focus timing, VoiceOver and packaging remain unqualified. No builds, package
tests/typechecks, installs, OS automation, visual analysis or shared audit snapshot
regeneration ran; no evidence checkbox is closed.


### AppKit local file-drop ownership

Revisited high-demand attachment flows after menu prerequisites. The sandbox's
FileInputBasic/FileInputShowcase examples exercise attachment entry, and the
public FileInput dropzone contract calls for pointer drops. The AppKit leaf only
changed presentation and opened a picker. Assumption: receiving local document
files is more demanded than niche integrations or menu polish. Existing exports,
shared props and picker service imports already resolve; no shared manifests or
other platform leaves needed changes.

Added a private renderer destination lease on existing AccessibleHostView wrappers.
NSDraggingDestination entered/updated/prepare/perform selectors use the SDK's
64-bit NSUInteger/BOOL contracts. Registration adds public.file-url, preserves
existing/later other types and releases independent leases through ref/node
teardown. Admission requires copy and file-URL-readable pasteboard content;
delivery reads NSURL objects with the file-URLs-only option, deduplicates URIs,
checks the current destination window and owners/props/root and enters discrete event scope. Native SDK headers
and Apple NSDraggingDestination/NSPasteboard docs were inspected; source presence
is not proof of ObjC registration, drag hit routing or delivery.

FileInput attaches in both input/dropzone presentations, matching the web wrapper
contract, keeps its existing public native trigger handle and checks current
blocking/busy/attachment state. The files leaf inspects
local URLs for regular-file attributes and metadata with balanced security scopes,
then feeds the existing picker/save controller. Extracted common validation from
picker completion; cancellation still preserves selection/errors. Accepted drops
share the immediate operation token, current validation and parent feedback;
receipt is not successful validation/save, and save errors do not roll back parent
values. Directories, symlinks, uninspectable/promised/non-file payloads are excluded.
Filename MIME hints and optional sizes retain their previous limits.

Four registry, one bridge, two inspection and two controller cases were authored,
all nine unrun. The maintained fileinput-drop fixture mounts controls only; its
runner synthesizes no drag or OS file access. TypeScript/TSRX syntax parsing,
semantic/source review and whitespace checks only. Files/renderer/guide/skill,
feature note and date-picker AC11 were reconciled. No new dependencies, shared
manifest edits, other-target leaves or audit snapshot regeneration.

```sh
pnpm exec turbo run test --filter=@octane-xplat/macos-renderer
pnpm exec turbo run test --filter=@octane-xplat/files -- src/file-input-state.macos.test.ts src/file-input-drop.macos.test.ts src/file-input-details.macos.test.ts
pnpm exec turbo run typecheck --filter=...@octane-xplat/macos-renderer --filter=...@octane-xplat/files
pnpm probe run examples/probes/fileinput-drop.macos.tsrx --deps @octane-xplat/files --target macos --watch
pnpm exec turbo run build --filter=@xplat/macos
pnpm check:recipes
```

All commands remain deferred pending explicit human authorization for this task.
Native selector/ABI/registration, ref cleanup, presentation changes, destination hit routing,
copy cursor/drag/validation/save behavior, sandbox/security grants, Foundation
metadata, focus/VoiceOver and packaging remain unqualified. Promised files,
custom hover feedback/autoscroll, directories/symlink resolution and persistent
grants remain outside this source path. No package tests/typechecks, builds,
installs, OS automation or visual analysis ran; no evidence checkbox is closed.


The same source review found a 64-bit admission correction after the initial drop
slice: NSDragOperationEvery is NSUIntegerMax in the installed NSDragging.h. Its
unsigned Number representation rounds to 2**64, so Number(mask) & 1 loses Copy.
Admission now recognizes signed/unsigned all-operation masks and BigInt flags,
while safe finite ordinary masks test the Copy bit without 32-bit coercion.
Expanded the existing registry case for Every and no-copy/invalid masks; it is
still unrun. TypeScript syntax and whitespace/source review only. The exact
renderer test/typecheck/native probe commands above remain deferred; no native
bridge representation, drag or OS behavior is claimed.


### AppKit Switch callback ownership

The previous turn made concrete source progress on local file drops. Returned to
common form/save flows next: ComponentsDemo uses switch settings, and the shared
Switch contract orders onChange before changeAction. Source inspection found the
AppKit token was claimed after onChange, permitting reentrant duplicate toggles/
saves before pending could render. Cached control handlers also retained old
blocking props. A rollback callback throw could reject the settlement promise and
cleanup could publish pending after that callback detached the host.

The target now claims ownership before application callbacks and reads current
props/value through a live ref. Forward callback errors release the claim and
propagate without starting a save. The event's original changeAction still runs
if onChange detaches the control, preserving save ordering/intent, while busy and
settlement updates require the attached token owner. Rollback callback faults are
logged; finally cleanup checks ownership again so callback-driven detach does not
write state afterward. Existing controlled display/rollback ownership is retained.
No public API/shared props, manifest, other target leaf or dependency changed.

Four appended source cases cover immediate reentry, detached event-save dispatch,
forward throw/recovery, rollback callback fault/cleanup and cached current props.
All four remain unrun. TypeScript/TSRX syntax, semantic/source review and whitespace
checks only. The semantic impact output was truncated by a broken output pipe;
target switch tests were read directly and no test execution is inferred. Guide,
skill, existing feature note and appkit-switch-actions AC6 were reconciled.

```sh
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/switch.macos.mobile.test.tsrx
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
pnpm probe run examples/probes/switch.macos.tsrx --target macos --watch
pnpm exec turbo run build --filter=@xplat/macos
pnpm check:recipes
```

All commands remain deferred pending explicit human authorization for this task.
Native callback/effect/ref timing, physical pointer/keyboard/label activation,
actual busy paint, focus/Tab/AX and packaging remain unqualified. No builds,
package tests/typechecks, installs, OS automation, visual analysis or shared audit
snapshot regeneration ran; no evidence checkbox is closed. The separate Checkbox
mixed rollback/type contradiction was surfaced for a human contract choice; no
shared callback type or checkbox save behavior was silently changed.


### AppKit checkbox label tooltip forwarding

Checkbox already delegated standalone label/description chrome to FormField but
omitted labelTooltip. Forwarded that existing prop; parent Field ownership and
hidden-label suppression remain with the existing conditional chrome. Shared
callback types and async checkbox behavior were not changed while the mixed
rollback contract choice is pending. Guide/skill, existing feature note and
appkit-checkbox-metadata AC1 were reconciled. This is a one-prop forwarding fix;
no additional tests were added. Source/diff, TSRX syntax and whitespace review
only, without native tooltip/input/focus/AX or presentation evidence.

```sh
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/checkbox.macos.mobile.test.tsrx
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
pnpm exec turbo run build --filter=@xplat/macos
pnpm check:recipes
```

All commands remain deferred pending explicit human authorization for this task.
Existing source cases remain unrun. No new dependency, shared manifest/other target
leaf, audit snapshot, OS automation or visual analysis was involved; no evidence
checkbox is closed.


### AppKit Calendar day keyboard ownership

The prior turn made concrete Switch/checkbox metadata progress. Scheduling/date
entry is another common form flow: ComponentsDemo and NativeDatePickerDemo show
shared date inputs. Their AppKit Calendar leaf had tap selection and native day
buttons, but no keyboard handler, day registry or roving day Tab ownership.
The portable calendarKeyTarget already defines bounded/disabled row/column/page
navigation, so this target adapter reuses it instead of introducing a second date
policy. DateInput/DateTimeInput/DateRangeInput AppKit surfaces reuse this Calendar;
native time-list keyboard binding remains a separate gap.

Added a private per-calendar focus owner backed by existing choice-focus leases.
Day components retain current native refs; one enabled day is a Tab candidate
across both panes, preferring focused/selected/today/first enabled. Root key routing
requires the current attached first-responder day and skips header/foreign/
disabled/hidden/IME/prevented input. Alt and modified shortcuts remain outside,
except explicit Command/Control Home/End. Arrows, Home/End and month pages use
existing bounds/disabled/range predicates and explicit/provider RTL. Enter/Space
uses the existing selection callback; unfinished range Escape cancels the anchor
before a surrounding layer can dismiss. Ordinary Tab/Escape remain native/layer
owned. Pointer day activation requests focus without replacing selection ownership.

Page focus retains request-window intent while controlled focusDate waits for
parent acceptance and native cells. Queued refreshes coalesce; window updates
repair pending/invalidated day focus without stealing header focus. Header and
imperative navigation cancel pending intent; root/day teardown releases Tab and
observer ownership. The public navigateTo handle stays unchanged and uses a ref
to avoid assuming imperative-handle callback timing. No public API/dependency,
shared manifest or other platform leaf changed; CalendarProps comment now separates
AppKit source intent from unqualified delivery and unbound NativeScript keys.

Six adapter and two object-driver wiring cases cover current/RTL/disabled/row/
grid navigation, manual/range ownership, controlled page acceptance, unsupported
bridges, window moves, hidden/detached roots, ref teardown and stale activation. All eight remain unrun.
The maintained calendar-keys fixture synthesizes no OS keys. Only TypeScript/TSRX
syntax, source/semantic review and whitespace checks ran. Guide/skill, feature note
and date-picker AC12 were reconciled. Shared Checkbox mixed rollback choice remains
pending; no shared checkbox callback type or async behavior was changed.

```sh
pnpm exec turbo run test --filter=@octane-xplat/ui -- src/date-keyboard.test.ts src/calendar-focus.macos.test.ts
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/calendar.macos.mobile.test.tsrx
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
pnpm probe run examples/probes/calendar-keys.macos.tsrx --target macos --watch
pnpm exec turbo run build --filter=@xplat/macos
pnpm check:recipes
```

All commands remain deferred pending explicit human authorization for this task.
Physical key/Tab delivery, native ref/window/observer/effect timing, focus/reveal,
popup/FocusScope/modal integration, geometry, RTL provider delivery, AX/VoiceOver
and packaging remain unqualified. AppKit live announcements and native time-list
keys remain source gaps. No builds, package tests/typechecks, installs, OS
automation, visual analysis or shared audit snapshot regeneration ran; no evidence
checkbox is closed.


### AppKit Escape dispatcher before layer dismissal

While continuing time-entry keyboard work, found a prerequisite for the newly
added Calendar range Escape owner: layer-keys.macos installed its own Escape
monitor and dismissed through the layer stack without first asking the renderer.
Its ordering relative to the renderer monitor was not guaranteed. Source model
handlers alone could therefore not establish local Escape precedence.

The AppKit layer monitor now asks the existing shared keyboard dispatcher first.
A prevented event returns null and skips dismissal; stopped propagation alone
skips Xplat dismissal while returning the native event. The dispatcher caches the
same native event, preserving one handler call in either monitor order. Existing
non-Escape, marked-text and older-bridge paths remain. Four source cases cover
local-then-layer Escape, stop/default independence, composition/fallback, and both
monitor orders using the actual pure dispatcher with simulated native monitors.
All four are unrun. Source/semantic/syntax/whitespace review only. Calendar guide/
skill/feature note and renderer contract were reconciled; date-picker AC12 remains
the affected recipe. No public API/dependency, shared manifest or other target
leaf changed.

```sh
pnpm exec turbo run test --filter=@octane-xplat/ui -- src/layer-keys.macos.test.ts src/calendar-focus.macos.test.ts
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/calendar.macos.mobile.test.tsrx
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
pnpm probe run examples/probes/calendar-keys.macos.tsrx --target macos --watch
pnpm exec turbo run build --filter=@xplat/macos
pnpm check:recipes
```

All commands remain deferred pending explicit human authorization for this task.
Native monitor/proxy identity, actual local Escape vs popup dismissal, IME,
ref/focus/AX and packaging remain unqualified. No builds, package tests/typechecks,
installs, OS automation, visual analysis or shared audit regeneration ran; no
checkbox is closed. Native time-option navigation and the shared Checkbox mixed
rollback choice remain independent unfinished work.


### AppKit typed date-time submit wiring

Continuing common scheduling entry, source inspection found that DateInput,
TimeInput and both DateTimeInput textfields supplied blur handlers but no onSubmit,
even though the renderer already dispatches textfield submission through its
composition-aware target/action path. Web counterparts commit pending drafts on
Enter. Added the four direct onSubmit bindings to the existing commit functions;
no parser, clear/null, bounds, selection or callback type was replaced.

This is straightforward handler wiring; no additional unit tests were added.
The maintained date-submit fixture shows all segments and compares Return/blur,
invalid/empty drafts and IME, but synthesizes no input. Source/diff, TSRX syntax
and whitespace review only. Guide/skill, feature note and date-picker AC13 were
reconciled. No public API/dependency, manifest or other platform leaf changed.

```sh
pnpm exec turbo run test --filter=@octane-xplat/ui -- src/date-keyboard.test.ts
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
pnpm probe run examples/probes/date-submit.macos.tsrx --target macos --watch
pnpm exec turbo run build --filter=@xplat/macos
pnpm check:recipes
```

All commands remain deferred pending explicit human authorization for this task.
Existing parsing cases and the fixture are unrun. Native target/action and
Return/blur order, IME, draft/caret/focus/validation, AX and packaging remain
unqualified. Standalone time stepping and preset-list navigation remain unfinished;
these prerequisites do not close those gaps. No package tests/typechecks, builds,
installs, OS automation, visual analysis or shared audit snapshots ran; no evidence
checkbox is closed.


### AppKit preset-time option keyboard ownership

The prior turn completed real Escape/Return prerequisite source work. Continued
DateTimeInput's preset-time gap: NativeDatePickerDemo supplies timeOptionInterval,
and the AppKit leaf already rendered a filtered pointer list but had no field
opening key, option registry, roving focus or key-based selection/return owner.
The adapter reuses timeOptionIndex for bounded movement, choice-focus for native
refs/Tab claims and the existing private popup return owner; no new layer engine,
public API, dependency, shared manifest or other platform leaf was introduced.

Alt+Down from the current noncomposing enabled time field opens presets. The popup
requests native option focus near current/typed time, owns one option Tab candidate,
and moves bounded Up/Down/Home/End without emitting a value. Enter/Space selects
through current filtered options and the existing commitTime path. Native option
highlight remains distinct from selected state. Ref/window notification refresh
waits for attachment, repairs removed focused options, and releases claims/observer
ownership on hide/detach. Ordinary Escape remains with the coordinated layer owner;
Tab/Shift-Tab records a current same-window field neighbor through accepted close,
with a field fallback. Explicit final focus uses the field's own window adapter.

Date/time/anchor refs are now concrete and stable; the time field receives the
matching `${id}-time` identifier. Open-state and choosing refs guard stale or
reentrant option callbacks even when onChange flushes parent metadata. Current
blocked/busy state suppresses both popup surfaces and cached toggle handlers;
empty options close the time surface. Pointer selection remains available on older
bridges. Date-less selection keeps existing timeDraft behavior. No parser or time
interval/bounds generation policy changed. The renderer also stops classifying
known navigation/function keys with empty Alt-modified characters as dead text;
real printable dead keys and marked editors stay composing. One appended renderer
case covers that source prerequisite; it too is unrun. The source uses native popup option
focus rather than claiming an editable active-descendant field relationship.

Four focus-policy/five object-driver cases cover seeding, bounded focus vs commit,
manual activation, current rows, blocking/teardown, old bridges, Alt+Down guards,
field/neighbor return intent, selection reentry and cached callbacks. All ten
remain unrun. The maintained preset-times fixture synthesizes no OS input. Only
TypeScript/TSRX syntax, source/semantic review and whitespace checks ran. Guide/
skill, feature note and date-picker AC14 were reconciled. The initial semantic
impact graph found no resolved test reach to the private control; new wiring
cases import the target leaf explicitly but are not execution evidence.

```sh
pnpm exec turbo run test --filter=@octane-xplat/macos-renderer
pnpm exec turbo run test --filter=@octane-xplat/ui -- src/time-list-focus.macos.test.ts src/date-keyboard.test.ts
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/datetime-options.macos.mobile.test.tsrx src/menu-return.macos.mobile.test.tsrx
pnpm exec turbo run typecheck --filter=...@octane-xplat/macos-renderer --filter=...@octane-xplat/ui
pnpm probe run examples/probes/preset-times.macos.tsrx --target macos --watch
pnpm exec turbo run build --filter=@xplat/macos
pnpm check:recipes
```

All commands remain deferred pending explicit human authorization for this task.
Native key/ref/window/observer order, field-editor/IME, focus/Tab/return and busy
save timing, scroll reveal, popup/FocusScope/modal integration, geometry, AX and
packaging remain unqualified. Row-to-editor text/typeahead relay, full listbox/
option AX relationships, standalone TimeInput stepping and AppKit live announcements
remain gaps. Shared Checkbox mixed rollback choice is still pending. No package
tests/typechecks, builds, installs, OS automation, visual analysis or shared audit
snapshot regeneration ran; no evidence checkbox is closed.


### AppKit TimeInput minute key stepping

The preceding preset-time commit c73d9e42e added real source support and retained
native qualification gates. The standalone TimeInput contract already exposes
increment, while the web leaf binds Up/Down and AppKit had no key handler. This
is an ordinary time-entry flow in the date-family examples; it takes priority
over niche platform integrations. The assumption is that desktop time entry
needs the existing public minute-step contract, with AppKit modified editing
commands preserved.

The target leaf now binds plain current-field Up/Down through shared adjustTime,
currentISOTime and isTimeInRange: committed value or local current time when
empty, configured minute increment, optional seconds, midnight wrap and rejection
outside bounds. Valid requests clear private typed drafts after dispatch; the
current parent value still wins even when the parent declines a change. Foreign,
detached, blocked, prevented, modified and composing input is left alone. The
AppKit composition leaf checks the field editor. No public type, dependency,
shared manifest, parser policy or other platform leaf changed.

The new key entry point also requires synchronous change ownership: fireChange
claims before onChange so callback reentry/parent metadata flush cannot duplicate
saves. Pending changeAction excludes further edits before/after rendering, retains
the accepted event's captured save callback and releases on either outcome.
An accepted save still dispatches if onChange unmounts, while detached settlement
avoids busy-state writes. Failure preserves the parent value and existing
app-owned status policy; no automatic rollback is introduced. Stable concrete
NSTextField refs make teardown guards explicit.

Five authored object-driver cases cover seconds/increment/controlled echo and
midnight wrap, current bounds/blocking/modifiers/field-editor composition/detach,
empty-time seeding and invalid drafts, callback reentry/pending/released failure,
and forward callback errors/accepted save after teardown. All remain unrun. The
maintained time-step fixture performs no native key synthesis. Only source and
semantic review, TypeScript/TSRX syntax parsing and whitespace checks ran. Public
guide, skill reference, feature note and date-picker AC15 were reconciled;
documentation coverage is separate from execution evidence.

```sh
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/time-step.macos.mobile.test.tsrx src/datetime-options.macos.mobile.test.tsrx
pnpm exec turbo run test --filter=@octane-xplat/ui -- src/datetime.test.ts
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
pnpm probe doctor
pnpm probe run examples/probes/time-step.macos.tsrx --target macos --watch
pnpm exec turbo run build --filter=@xplat/macos
pnpm check:recipes
```

All commands remain deferred pending explicit human authorization for this task.
Physical keys/repeat, native field-editor targeting, IME, caret/draft/focus/busy
save timing, AX/VoiceOver and packaged behavior remain unqualified. DateTimeInput
closed-field timeIncrement stepping, row-to-editor preset text relay, complete
listbox relationships and live announcements remain source gaps. No package
tests/typechecks, builds, installs, OS automation, visual analysis or shared audit
snapshot regeneration ran; no evidence-gated checkbox is closed. Checkbox mixed
rollback remains pending the human contract choice already asked.


### AppKit DateTimeInput closed-field stepping

The preceding standalone TimeInput slice a9bb6fb4a was committed and pushed with
verification deferred. Continued the adjacent public timeIncrement gap rather
than treating preset navigation as a complete time keyboard workflow. The web
leaf already separates minute steps from timeOptionInterval; the AppKit source
previously handled only Alt+Down opening in the time field.

Plain current-field Up/Down now steps through shared adjustTime/currentISOTime/
isTimeInRange with current increment, seconds and date-endpoint bounds. Preset
cadence does not quantize stepped values. Midnight wrap keeps the date unchanged;
without a date, the existing local timeDraft is stepped and retained for a later
valid date commit. Parent values remain authoritative; successful request dispatch
clears private display drafts, while rejected bounds keep them. Either open popup
retains plain field arrows. Alt+Down still requests nonempty presets. Modified,
prevented, marked-editor/composing, foreign/detached and current blocked events
stay outside stepping. No public type, shared manifest, dependency, parser policy
or other platform leaf changed.

The common target fireChange boundary now claims before application callbacks
can reenter or flush parent metadata, and pending changeAction excludes edits and
popup entry before/after rendering. Accepted saves retain captured callbacks even
when onChange unmounts; detached settlement skips busy-state writes. Synchronous
forward errors release the write claim, and failed saves release busy state
without automatic parent rollback. The preset choose/clock/calendar entry paths
also respect these synchronous guards. Native focus return while busy remains
unqualified.

Four new object-driver cases cover current increment/seconds/controlled values,
endpoint bounds/same-date midnight wrap, date-less drafts and modified/marked/open
popup ownership, callback reentry/pending/sync+async failure, and forward errors/
accepted save after teardown. All are unrun, as are the prior five DateTimeInput
preset wiring/four focus-policy/one renderer cases. The existing preset-times
fixture now exposes 5-minute closed-field steps beside 15-minute presets and
synthesizes no OS input. Only source/semantic, TypeScript/TSRX syntax and whitespace
review ran. Guide/skill/feature note and date-picker AC16 were reconciled.

```sh
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/datetime-options.macos.mobile.test.tsrx src/time-step.macos.mobile.test.tsrx
pnpm exec turbo run test --filter=@octane-xplat/ui -- src/datetime.test.ts src/time-list-focus.macos.test.ts
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
pnpm probe doctor
pnpm probe run examples/probes/preset-times.macos.tsrx --target macos --watch
pnpm exec turbo run build --filter=@xplat/macos
pnpm check:recipes
```

All commands remain deferred until explicit human authorization for this task.
Physical keys/repeat, native field-editor routing/IME/caret/draft, actual bound/
save/blur/focus ordering, popup/FocusScope/modal/AX/VoiceOver and packaging remain
unqualified. Row-to-editor preset text relay, full listbox/option relationships
and live announcements remain source gaps; Checkbox mixed rollback is still
pending the previously asked human contract choice. No package tests/typechecks,
builds, installs, OS automation, visual analysis or shared audit snapshots ran;
no evidence-gated checkbox is closed.


### AppKit date-family ref handles

The previous goal turn committed/pushed standalone and date-time minute stepping
through 134aaa48b; that was implementation progress, not native qualification.
The next common form flow is returning to a date field from an action. Existing
DateInput, TimeInput and DateTimeInput props expose TextInputHandle refs, but the
AppKit leaves did not deliver them. DateRangeInput delivered inert focus/blur
methods and a snapshot native host. This source expectation mismatch motivates a
private responder adapter rather than new public API or niche platform work.

The four target leaves now use normal useImperativeHandle ownership with stable
host refs and a live native getter. DateInput/TimeInput focus their textfields,
DateTimeInput focuses its date segment, and DateRangeInput focuses its trigger.
Focus requests the current host's window first responder only when attached,
visible, enabled and unblocked by current local/inherited state. It does not
activate a window, select/parse/commit text, or open/close layers. Blur checks only
live owned views/current field editors and leaves unrelated responders alone;
DateTimeInput checks both segments. Native responder transitions own any editing
callbacks they cause. Held handles resolve null/no-op after host teardown. No
observers, timers, dependency, public type, shared manifest or other-target leaf
were introduced; this does not change the existing generic text-control adapter.

Three pure adapter cases and six object-driver cases (four parameterized control
wiring/lifecycle cases, secondary-editor ownership and inherited Field blocking)
are authored and unrun. They cover current hosts, native method/property editor
forms, hidden/disabled/detached/blocking guards, ref object/callback/nested-list
replacement, unmount clearing and composite blur. The date-focus fixture only
mounts/records a manual diagnostic surface; it synthesizes no focus or input.
Guide/skill/feature note, component-refs AC4 and date-picker AC6 evidence were
reconciled. Only source/semantic, TypeScript/TSRX syntax and whitespace review ran.

```sh
pnpm exec turbo run test --filter=@octane-xplat/ui -- src/date-field-handle.macos.test.ts
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/date-refs.macos.mobile.test.tsrx src/time-step.macos.mobile.test.tsrx src/datetime-options.macos.mobile.test.tsrx
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
pnpm probe doctor
pnpm probe run examples/probes/date-focus.macos.tsrx --target macos --watch
pnpm exec turbo run build --filter=@xplat/macos
pnpm check:recipes
```

All commands remain deferred pending explicit human authorization for this task.
Actual native ref ordering, responder/field-editor identity, focus refusal,
blur/submit/IME/draft/caret callbacks, popup/FocusScope/modal integration, AX and
packaging remain unqualified. DateInput/TimeInput hasAutoFocus attachment timing,
preset row-to-editor text relay, full listbox/option relationships and live
announcements remain source gaps. Checkbox mixed rollback still awaits the
previously asked human contract choice. No package tests/typechecks, builds,
installs, OS automation, visual analysis or shared audit snapshots ran; no
evidence-gated checkbox is closed.


### AppKit date and range save ownership

The ref-handle slice 837b81041 was completed/pushed before continuing independent
implementation. Source review exposed the adjacent date/range operation gap:
fireChange called onChange before setting busy, captured old constraints and wrote
settlement state after teardown. Reentrant parent callbacks could duplicate saves,
and DateInput accepted calendar values without rechecking current constraints.
The existing TimeInput/DateTimeInput write-claim pattern is reused for these
ordinary date-entry flows rather than introducing a new shared service.

DateInput and DateRangeInput now synchronously claim before validation/application
callbacks, read current constraints and block detached/reentrant/pending writes.
Accepted saves capture their event callbacks, dispatch after onChange teardown,
and settle without detached busy-state updates; forward errors release claims
and sync/async save errors release loading. Parent state is not rolled back.
Stable open refs guard cached picker entry/selection, selection requires current
open ownership, blocked popups close, and post-callback draft/close writes require
attachment. DateInput validates calendar dates against current bounds/predicates.
Range preset activation resolves the current label-keyed preset and evaluates its
range once for that activation before current endpoint/span validation; removed
presets are rejected. Rendering still evaluates pure getters. Existing ref focus
also respects the immediate pending-save guard. No dependency/public type/shared
manifest, parser policy or other-platform leaf changed.

Seven authored object-driver cases (three date/range parameterized pairs and one
preset-registry case) cover callback reentry, pending edits/popup entry and release,
current bounds/predicates/blocking/open/detach ownership, forward/sync/async save
errors, accepted save after teardown and replaced/removed/invalid presets. They
and the maintained date-save fixture are unrun; the fixture mounts a manual save
completion/failure surface and synthesizes no native callbacks/input/focus. Guide,
skill and date-picker AC17 were reconciled. This fixes unreleased target behavior;
no stable-release fix note is added. Only source/semantic, TSRX syntax and
whitespace review ran.

```sh
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/date-save.macos.mobile.test.tsrx src/date-refs.macos.mobile.test.tsrx src/time-step.macos.mobile.test.tsrx src/datetime-options.macos.mobile.test.tsrx
pnpm exec turbo run test --filter=@octane-xplat/ui -- src/datetime.test.ts src/date-entry.web.test.tsx src/date-field-handle.macos.test.ts
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
pnpm probe doctor
pnpm probe run examples/probes/date-save.macos.tsrx --target macos --watch
pnpm exec turbo run build --filter=@xplat/macos
pnpm check:recipes
```

All commands remain deferred pending explicit human authorization for this task.
Actual native callback ordering, repeated activation, field-editor/IME/draft/caret,
save/blur/focus and layer/FocusScope/modal integration, AX and packaging remain
unqualified. No cancellation, automatic rollback or native error announcement is
introduced. Autofocus timing, preset row text relay/full listbox relationships
and live announcements remain source gaps; Checkbox mixed rollback is pending the
previously asked contract choice. No package tests/typechecks, builds, installs,
OS automation, visual analysis or shared audit snapshots ran; no checkbox closed.


### AppKit TabMenu overflow keyboard ownership

The previous goal turn committed/pushed date focus and save ownership through
352ccacc3. Re-read the current issue, source audit/target rows and dependency
candidates; they remain source-only historical evidence. Demand was revisited:
ComponentsDemo composes TabList with a More TabMenu, while PagerDemo also exposes
an unsupported paging workflow. Basic navigation/input takes priority here over
new playback/paging host machinery. TabList already has roving tab focus/reveal;
TabMenu still used independent pointer rows and was absent from its registry.

The target TabMenu now registers the concrete trigger in the strip, using the
selected overflow value or a private stable key, without ref churn on selection
changes. Down/Up on that trigger requests first/last-row popup focus; repeats
while opening stay consumed without reopening. Pointer/Enter/Space activation
retains Pressable ownership. The popup composes the existing MenuSurface,
useAppKitMenuRow and return owner: wrapping arrows, edges, typeahead, manual
activation, current Tab/Shift-Tab neighbor intent and ordinary layer Escape.
Selection reads current options/context, claims before application reentry and
closes through callback errors/teardown without detached UI writes. Empty options
disable entry and close an existing popup; pointer selection remains available
on older bridges. Trigger expanded/selected state and menu radio-row metadata
are supplied, without claiming native mark/announcement delivery. No public
prop/type, shared manifest, dependency, new layer engine or other-target leaf
changed.

Six object-driver cases cover selected overflow strip registration, concrete
trigger edge opening, menu focus/manual activation/prefix/return, current
neighbor/ordinary Escape intent, reentry/parent flush/removed rows/empty/detach,
modified/composing/foreign guards and older-bridge pointer fallback. All are
unrun. The maintained tab-menu fixture performs no native keys/focus automation.
Only source/semantic, TSRX syntax and whitespace checks ran. Public guide, skill,
feature note and appkit-tab-navigation AC4 were reconciled. New bridge/platform
runtime behavior is not established by this source work.

```sh
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/tab-menu.macos.mobile.test.tsrx src/tab-list.macos.mobile.test.tsrx src/menu-keyboard.macos.mobile.test.tsrx src/menu-return.macos.mobile.test.tsrx
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
pnpm probe doctor
pnpm probe run examples/probes/tab-menu.macos.tsrx --target macos --watch
pnpm exec turbo run build --filter=@xplat/macos
pnpm check:recipes
```

All commands remain deferred pending explicit human authorization for this task.
Native ref/key/window/notification order, physical keys/Tab, popup/FocusScope/modal
integration, scroll reveal, focus/return/IME, AX/VoiceOver/menu radio marks and
packaging remain unqualified. The reused MenuSurface still lacks explicit repair
when a nonempty menu removes its focused row; this is a remaining source gap,
not covered up by current-option selection guards. Pager/video, autofocus timing,
preset text relay/listbox relationships and live announcements also remain gaps;
Checkbox mixed rollback is still pending the already asked human choice. No
package tests/typechecks, builds, installs, OS automation, visual analysis or
shared audit snapshot regeneration ran; no evidence-gated checkbox is closed.


### AppKit menu row focus repair

The prior goal turn added TabMenu source keyboard ownership through 7ee8671d4
and explicitly retained the nonempty focused-row-removal gap. Continuing that
ordinary dynamic-menu flow: MenuSurface initialized focus once but did not
capture row detachment/disabled changes, so registered rows could disappear while
its native responder/Tab claims still referred to the old host. ComponentsDemo
and shared action/tab menus already consume this surface; no new native engine
or package is needed.

A private menu-focus owner now keeps enabled native row order, current focused
row/window and pending repair intent. Row ref removal notifies before unregister;
row-disabled metadata and surface commits queue one refresh after the commit.
Existing window notifications cover native hidden/layout/focus changes, including
the previous window when a root detaches. Removed/disabled/hidden current rows
request the row now at the previous index (clamped to last), or retained menu
container when no eligible rows remain. Keyboard navigation records its native
focus immediately. Captured same-window row/container/window/null fallback is
allowed; a current unrelated responder cancels repair, preserving nested editors
and other menus. Selection is never invoked by repair.

Scope/window replacement, hidden/detached roots and missing bridges release old
claims/intent; failed native focus may retry. Epoch/ref checks reject synchronous
teardown during a native focus request, and refresh/reset guards prevent native
notification recursion from restoring released leases. Root teardown clears the
attachment before releasing its focus-target lease; queued work sees current
scope only. The existing keyboard/typeahead, layer dismissal and return owner are
retained. No dependency, public type/prop, shared manifest, new observer family,
other-target leaf or shared audit snapshot changed.

Five pure policy/three object-driver surface/one appended TabMenu cases are
newly authored, all unrun. They cover initial edges, same-position/all-empty
repair, disabled/hidden and unrelated mutations, captured native fallback,
nested/foreign responders, scope/capability/focus refusal, notification recursion,
synchronous/queued teardown, row commit notifications and actual TabMenu
composition. The maintained menu-keyboard fixture adds self-removing/disabling
actions; its runner still performs only direct trigger dispatch, no native keys
or focus. Guide/skills, the existing feature note's stale gap text, shared-menus
AC13 and appkit-tab-navigation AC4 coverage were reconciled. This fixes an
unreleased target gap, so no stable-release fix note is added. Only source/
semantic, TypeScript/TSRX syntax and whitespace checks ran.

```sh
pnpm exec turbo run test --filter=@octane-xplat/ui -- src/menu-focus.macos.test.ts
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/menu-focus.macos.mobile.test.tsrx src/tab-menu.macos.mobile.test.tsrx src/menu-family.macos.mobile.test.tsrx src/menu-keyboard.macos.mobile.test.tsrx src/menu-return.macos.mobile.test.tsrx
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
pnpm probe doctor
pnpm probe run examples/probes/menu-keyboard.macos.tsrx --target macos --watch
pnpm probe run examples/probes/tab-menu.macos.tsrx --target macos --watch
pnpm exec turbo run build --filter=@xplat/macos
pnpm check:recipes
```

All commands remain deferred pending explicit human authorization for this task.
Native responder/ref/notification order and fallback identity, focus refusal,
physical keys/repeat/IME, popup/FocusScope/nested-modal integration, scroll reveal,
AX/VoiceOver and packaging remain unqualified. Pager/video, autofocus timing,
preset text relay/listbox relationships and live announcements remain source
gaps; Checkbox mixed rollback is still pending the previously asked human
choice. No package tests/typechecks, builds, installs, OS automation, visual
analysis or audit regeneration ran; no evidence-gated checkbox is closed.


### AppKit Carousel navigation and handle

The previous goal turn completed source menu-focus repair through c4abedff0.
Continued an ordinary attachment/media-preview gap: ChatComposerDrawerAttachments
uses Carousel, and the maintained carousel-paging fixture/public props expect
programmatic navigation and proportional slides. The AppKit leaf had only a
horizontal row and explicitly omitted buttons, loop and handle. Native scrolling
already has working source axes/offset helpers; the old horizontal alias is
recognized, so no renderer-axis fix is claimed or shared renderer edit made.

The target leaf now delivers the existing CarouselHandle and optional Previous/
Next controls. A private native geometry adapter reads current clip/document
metrics, pages by viewport, converts slide rectangles to document coordinates,
clamps index/range and preserves the untouched vertical clip origin. Current
count/loop/direction drive capability methods; loop requires multiple slides and
actual overflow. Hidden/detached/invalid geometry cannot act, and refs invalidate
held handles on teardown. Logical RTL conversion, row/button direction and
leading-edge alignment follow useDirection; initialization waits for usable
geometry and is claimed before native callbacks can reenter.

Proportional slides use measured viewport widths and explicit track extent,
including gaps, instead of an ambiguous percentage basis in overflowing native
content. Dynamic slides retain intrinsic sizing. Named slide groups, root
metadata, class/style ownership and child normalization remain. Layout/scroll
callbacks and one owned window-update observer refresh button/width state,
including old-window detach. Updates coalesce and skip detached UI writes.
The existing AppKit offset helper owns animator/fallback requests. Carousel now
reuses readReducedMotion; a prerequisite normalizes its live property or callable
receiver-bound getter so a false-returning function is not treated as true.
Semantic impact reaches existing UI animations/route transitions, whose runtime
qualification remains deferred. No dependency, public API/type, shared manifest,
other-target leaf or shared audit snapshot was changed.

Five pure geometry-policy/three object-driver/one appended animation-getter cases
are authored, all unrun. They cover viewport steps/edges/loop/current count,
indexed conversion/clamps/foreign geometry, RTL/alignment, initial geometry,
reduced-motion/animator fallback, hidden/detach/retained handles, proportional
wiring/button state/ref replacement/resize/observer cleanup and live getter forms.
The maintained carousel fixture mounts a manual diagnostic surface and performs
no native scrolling/input/visual automation. Only source/semantic, TypeScript/
TSRX syntax and whitespace checks ran. Guide/skill/feature note/shared-overlays
AC11 were reconciled. The surrounding guide also corrects its stale suggestion
that the separate AppKit Video leaf supplies playback; that leaf is still an
explicit placeholder.

```sh
pnpm exec turbo run test --filter=@octane-xplat/ui -- src/carousel-scroll.macos.test.ts
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/carousel.macos.mobile.test.tsrx
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
pnpm probe doctor
pnpm probe run examples/probes/carousel.macos.tsrx --target macos --watch
pnpm exec turbo run build --filter=@xplat/macos
pnpm check:recipes
```

All commands remain deferred pending explicit human authorization for this task.
The native task's existing Node prelude includes tests/animated-value.test.mjs;
its appended getter case is unrun too. Native intrinsic/proportional sizing,
RTL and initial geometry, scroll/animation and reduced-motion delivery, actual
button overlay/hit testing/keyboard/trackpad, resize/focus/AX and packaging remain
unqualified. hasSnap/hasEdgeFade are still unimplemented AppKit flags; Pager/video,
autofocus timing, date preset text relay/listbox relationships and live
announcements remain gaps. Checkbox mixed rollback still awaits the previously
asked human contract choice. No package tests/typechecks, builds, installs,
OS automation, visual analysis or audit regeneration ran; no checkbox is closed.


### AppKit Carousel user-scroll snapping

The previous goal turn implemented navigation/handle/layout source through
b8eff70ba and explicitly retained snap/fades. Continued hasSnap before decorative
edge treatment because attachment/gallery input should settle coherently. The
installed SDK's AppKit NSScrollView.h:163-177 documents main-thread user-live
scroll notifications and explicitly says legacy mice may not bracket updates
with start/end. Read via xcrun --show-sdk-path and targeted header inspection;
this is API source evidence, not actual native scrolling/momentum evidence.

A private per-viewport snap owner now binds WillStartLiveScroll, DidLiveScroll
and DidEndLiveScroll, filtering native object identity and current view/window.
Active tracking holds off the timer; an end or unbracketed user update schedules
one trailing 140 ms quiet interval, replaced by further user updates. Generic
onScroll/animation bounds changes only measure and cannot arm snap. Claim occurs
before native writes; the geometry adapter chooses the current nearest clamped
logical slide edge, skips already aligned positions, preserves vertical offsets
and honors RTL/reduced motion. No polling, synthetic input or new layer/renderer
engine is introduced.

Valid programmatic moves cancel queued snap. Flag/count/direction/variant/gap,
actual slide ref/structure and viewport width changes invalidate stale intent;
incidental parent renders do not clear a live gesture. Hidden/detached/moved
scope and teardown cancel timers, partial observer installation cleans prior
tokens, and per-binding generations reject old native callbacks even when the
same viewport is rebound. Old timer callbacks cannot replay. User-live activity retires
initial alignment. A related prerequisite also marks accepted handle requests
and preserves a nonzero pre-existing native offset, so late initialization cannot
reset an earlier request or an unbracketed user position. Native observation still
marks user intent with hasSnap false; it does not request snap then. Missing live
observation leaves ordinary navigation available without a snap guarantee.

Six intent-policy/two geometry/two appended object-driver cases are newly
authored, all unrun. They cover tracked/unbracketed/after-end updates, stale timer
claims, foreign/hidden/detached/moved/disabled scope, metadata/partial subscription
cleanup, nearest LTR/RTL edges and motion, late initialization, actual notification
wiring vs generic bounds changes, programmatic cancellation and teardown. Earlier
nine Carousel cases remain unrun too. The maintained carousel fixture adds a snap
toggle and manual input prompts; its runner synthesizes no native scroll/input.
Guide/skill/feature note/shared-overlays AC12 and prior AC11 gap text were
reconciled. Only source/semantic, TypeScript/TSRX syntax, targeted SDK-header reads
and whitespace checks ran. No public API/type, dependency, shared manifest,
other-target leaf or shared audit snapshot changed.

```sh
pnpm exec turbo run test --filter=@octane-xplat/ui -- src/carousel-snap.macos.test.ts src/carousel-scroll.macos.test.ts
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/carousel.macos.mobile.test.tsrx
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
pnpm probe doctor
pnpm probe run examples/probes/carousel.macos.tsrx --target macos --watch
pnpm exec turbo run build --filter=@xplat/macos
pnpm check:recipes
```

All commands remain deferred pending explicit human authorization for this task.
Native registration/ref/notification and momentum ordering, wheel/trackpad/thumb/
keyboard delivery, layout/RTL/proportional geometry, animation/focus/AX and
packaging remain unqualified. Edge fades, Pager/video, autofocus timing, date
preset text relay/listbox relationships and live announcements remain source
gaps; Checkbox mixed rollback still awaits the previously asked human contract
choice. No package tests/typechecks, builds, installs, OS automation, visual
analysis or audit regeneration ran; no evidence-gated checkbox is closed.

### AppKit Pager full-host pages and user settlement

Continued Pager before Carousel edge fades: PagerDemo explicitly presents
onboarding/media galleries with controlled dots and Previous/Next actions,
while the selected AppKit leaf returned an unsupported label. Assumed small,
bounded page collections are the first useful desktop subset. No shared audit
snapshot was regenerated, and no other target leaf/configuration was changed.

The AppKit leaf now composes public UI ScrollableArea/useDirection; no mobile
pager/plugin/runtime is imported along its selected source path. The existing
mobile package dependency is retained. Viewport geometry drives full-host eager
page widths/heights and current RTL logical offsets. Current props/callbacks,
controlled/default ownership, count clamping, empty/refill, native scope changes
and teardown are explicit. Defaults seed once; programmatic placement never
reports. A settled user request claims before application callbacks, waits for
actual native offset alignment before reporting, and lets controlled parent
acceptance/rejection govern the next placement. Pending user work is invalidated
by current requests/count/direction/size/window changes and replaced native refs.

Per-viewport live-scroll observation uses the SDK's user-only WillStart/DidLive/
DidEnd notifications, with trailing 140 ms quiet time and legacy unbracketed
updates. Native bounds/window updates only measure; they cannot create user
intent. Active tracking holds placement off, foreign/hidden/moved/detached scope
is rejected, old callbacks are binding-version guarded, and partial subscription
failure removes prior observers. The renderer already enables clip bounds
notifications through ScrollableArea's existing onScroll handler
(packages/macos-renderer/src/index.ts setScrollAction); no renderer change was
needed. Direct NSWorkspace preference reading handles either property or callable
bridge exposure. AppKit useMediaQuery supports no reduced-motion query, so the
implementation does not pretend that hook can supply it.

Pager's existing UI peer minimum rises from >=0.6.0 to >=0.18.0 for its current
public scrolling API; the feature note and package guide mark this breaking
requirement. No dependency install or lockfile regeneration ran. Six state,
four observer-lifetime and four object-driver cases are authored, all unrun.
Object cases mock the public UI module to the actual AppKit ScrollableArea and
shared direction context, because Pager's existing native test resolver is
mobile-oriented. This tests authored composition only when run; it does not
prove production barrel selection or native behavior. The maintained manual
fixture includes controlled/default flows, rejection, empty/refill, direction
and nested text inputs; its runner mounts/records only. Existing parity targets
remain web/iOS/Android. The package guide, skill, feature note and appkit-paging
recipe distinguish source coverage from qualification.

Only TypeScript/TSRX syntax parsing, focused source/semantic review and whitespace
checks ran. No tests, typechecks, builds, installs, native/OS automation, visual
analysis or packaging checks ran. Deferred exact commands:

```sh
pnpm exec turbo run test:native --filter=@octane-xplat/pager -- src/pager-state.macos.mobile.test.ts src/pager-scroll-events.macos.mobile.test.ts src/Pager.macos.mobile.test.tsrx
pnpm exec turbo run typegen --filter=@octane-xplat/pager
pnpm exec turbo run typecheck --filter=...@octane-xplat/pager --filter=...@octane-xplat/ui
pnpm exec turbo run pack:check --filter=@octane-xplat/pager
pnpm probe doctor
pnpm probe run examples/probes/pager.macos.tsrx --target macos --watch
pnpm exec turbo run build --filter=@xplat/macos
pnpm check:recipes
```

All remain deferred until explicit human authorization for this task. Pager has
no own typecheck script: its typegen emits public declarations and does not
qualify the AppKit implementation. Verify selected tasks/environments before
reporting coverage. Production import/registration, actual ref/context/notification
ordering, page sizing and RTL placement, trackpad/legacy wheel/keyboard/momentum,
animation/reduced motion, nested input/focus, VoiceOver/live announcements,
eager-page memory behavior and packaged consumers remain unqualified. Full
native page virtualization is not implemented. Carousel edge fades, video,
autofocus timing and date preset text relay/listbox relationships remain source
gaps. Checkbox mixed rollback still awaits the previously asked human contract
choice. No evidence-gated checkbox is closed.

Pager fixture/import review follow-up: the maintained AppKit host does not
declare Pager directly, so the target-specific manual fixture imports Pager's
explicit macOS source entry. It does not establish consumer package resolution;
that remains a separate deferred gate. The leaf normalizes root classes with
the existing cx utility (already declared lib dependency), matching neighboring
UI leaves and object-driver class tokens. Syntax/whitespace only; the same
14 cases and all native/package checks remain unrun.

### AppKit policy test registration correction

While scoping date/time autofocus, read UI's current test script and Vitest
include/exclude globs. Four earlier target policy files (menu-focus,
date-field-handle, carousel-scroll and carousel-snap) imported node:test despite
being selected by the UI Vitest task. Changed only their test registration import
to Vitest, preserving assertions/cases. This is a source runner mismatch and
registration correction, not an observed execution failure/pass. Their earlier
unrun status is unchanged. No shared runner/config/manifest changed.

```sh
pnpm exec turbo run test --filter=@octane-xplat/ui -- src/menu-focus.macos.test.ts src/date-field-handle.macos.test.ts src/carousel-scroll.macos.test.ts src/carousel-snap.macos.test.ts
```

Command remains deferred until the human explicitly authorizes this task.
TypeScript syntax and whitespace only; no tests/typechecks/build/native checks.

### AppKit date and time autofocus requests

The preceding Pager slices and policy-runner correction changed authoritative
source state; they were implementation progress, not native qualification.
Continued initial form focus before Carousel edge fades or niche integrations.
Assumed booking/onboarding form entry has high demand, following the existing
date-family APIs/examples and maintained date-focus fixture. DateInput and
TimeInput expose hasAutoFocus and their web leaves use it, but targeted AppKit
source inspection found the flag was entirely ignored. This is a framework leaf
omission, not evidence of an upstream renderer autofocus guarantee or a newly
observed native runtime failure. DateTimeInput/DateRangeInput have no such flag;
no new public API is invented for them.

A private target request owner now connects current date/time props and native
textfield refs. It queues after commit, can wait for the first window/visible
host, snapshots responder ownership, recognizes an already-owned field editor,
checks native method/property visibility/enabled guards and requests first
responder only once. Native refusal does not rearm. A request can start before
its first ref. Ref replacement after binding, window moves/detach, current
blocking/flag removal and teardown retire it. Late competing requests snapshot
before claim so a first successful focus move invalidates a stale second one.
No value edits, picker opening, window activation or synthetic input are added.

Pending requests alone own two native notifications and a key/pointer monitor;
input is returned unchanged. Any observed user activity or app deactivation
cancels, and changed native responders preserve newer focus. Claim precedes
cleanup/native focus callbacks; stale queued/notification callbacks cannot replay.
Partial installation cleans installed tokens. Missing observation gets only an
attached post-commit attempt, never an unsafe delayed retry. Unblocking alone
preserves cancellation; false-to-true requests explicitly rearm. UI's existing
FocusScope or explicit focus delegates retain their own contracts; real modal
and simultaneous autofocus ordering still require native qualification.

Nine Vitest policy cases and six parameterized object-driver cases are authored,
all unrun. They cover delayed/no-ref attachment, foreign notifications, input/
deactivation/changed responder, hidden/detached/moved scope, current props and
inherited Field blocking, flag rearming, replacement/teardown, partial/missing
observation, native refusal/editor ownership and competing delayed requests.
Object cases mock Popover away and cannot prove layer integration. A maintained
manual fixture provides date/time mounting/removal, a competing editor, blocking
and flag toggles; its runner only waits/records. Date guide/skill, feature note
and appkit-date-autofocus recipe reconcile the old source-gap statement.

Only source/semantic review, TypeScript/TSRX syntax parsing and whitespace checks
ran. No package tests/typechecks/builds, installs, native/OS automation, visual
analysis or shared audit regeneration ran. Exact deferred commands:

```sh
pnpm exec turbo run test --filter=@octane-xplat/ui -- src/auto-focus.macos.test.ts src/date-field-handle.macos.test.ts
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/date-autofocus.macos.mobile.test.tsrx src/date-refs.macos.mobile.test.tsrx
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
pnpm probe doctor
pnpm probe run examples/probes/date-autofocus.macos.tsrx --target macos --watch
pnpm exec turbo run build --filter=@xplat/macos
pnpm check:recipes
```

All remain deferred until explicit human authorization for this task. Native
ref/commit/window notification and initiating-event ordering, first responder/
field editor refusal/caret/IME, actual key/pointer/hit testing, competing scopes,
focus appearance/VoiceOver/live announcements and packaging remain unqualified.
BaseTypeahead still needs initial-focus review; PowerSearch currently calls a
ref once on its flag effect and late attachment remains unqualified. Carousel
edge fades, video, date preset text relay/listbox relationships remain source
gaps. Checkbox mixed rollback awaits the previously asked human contract choice.
No evidence-gated checkbox is closed; the overall goal remains active.

Autofocus policy review follow-up: the refusal fake now keeps its original
responder when makeFirstResponder returns false, and the existing case asserts
that identity. This makes the no-retry assertion independent of the already-owned
editor short circuit. Same nine policy/six component cases, all unrun; syntax and
whitespace only. Exact deferred commands and native limits above are unchanged.

### AppKit typeahead focus and search request ownership

The prior date/time autofocus and policy-runner fixes are pushed through
17cbe4050; that was implementation progress, not runtime qualification. Continued
search/selection focus ahead of Carousel edge fades and niche integrations.
ComponentsDemo's controlled Fruit Typeahead and the sandbox token-label example
establish ordinary search demand. Assumed focus bootstrap, text entry, click
selection and safe ref actions are the next useful AppKit subset. Targeted
source reads found BaseTypeahead had no focus/blur/autofocus wiring and its
public handle captured a native snapshot and dereferenced a cleared ref. The
renderer already has focus events; old comments claiming no native focus/Return
support were stale. No source audit snapshot was regenerated.

BaseTypeahead now binds focus to bootstrap/reshow and whole-field blur to close
and cancellation. Blur is attached to the containing AppKit subtree, so moving
into inline result content does not immediately remove click targets. Actual
native focus/blur/click ordering is still unqualified. Stable typed input refs
feed a live getter and current handle methods; owned blur recognizes a method or
property field editor and preserves unrelated responders. Held handles no-op
after teardown. hasAutoFocus reuses the existing private queued request owner.
Native enabled/editable props reflect current local/inherited blocking; explicit
isFocusableDisabled permits focus discovery while editing/selection stay blocked.
The text path uses the existing raw-string AppKit facade adapter; raw strings
were already the renderer payload, not an observed payload bug.

Search ownership now invalidates immediately for every query, before debounce.
Current source changes invalidate render ownership immediately and abort in the
post-commit effect; no user abort callback runs from that render check. Source,
blocking/ref changes, field leave and teardown retire timers/controllers; even a
source ignoring abort cannot reopen a retired layer. Latest callbacks/options
are read before acceptance; current result generations and keyed identities gate
selection. Query/selection claims precede application reentry, and callback
teardown prevents later UI/layer writes. Failure only clears current work.
Existing inline result hosting is retained; no native popup engine, public type,
dependency, shared runner/manifest or other-target leaf changes.

Typeahead's wrapper resolves inherited Field state and delegates click-to-edit
query reporting once to the engine (previously it also reported directly), blocks readonly edit/clear and
omits the readonly clear affordance. A disabled-message field forwards existing
focusable-disabled intent. Normal public ref ownership remains with Octane.
The old minimal search flow is consolidated around current refs/generations;
bootstrap and asynchronous search share acceptance checks rather than relying
on abort cooperation.

Fourteen object-driver cases are authored, all unrun. They cover focus bootstrap/
refocus, stable hosts, raw text/search/current selection order, handle replacement/
owned editor blur/teardown, current inherited disabled/readonly guards, disabled
focus discovery, pre-debounce invalidation, source replacement, late bootstrap
blur, keyed/reentrant selection, callback teardown, autofocus composition,
wrapper duplicate-query/inherited readonly fixes, current rejection/retired failure
and explicit focus-callback queries superseding implicit bootstrap.
Native notifications/responders are faked and handlers are dispatched directly;
no case establishes OS input, native blur-to-result hit testing or AX. A manual
fixture adds competing editors, mount/removal, controlled selection, blocking,
ref actions and autofocus toggles; its runner only waits/records. Search guide,
skill, feature note, search-and-token-entry AC1 and appkit-typeahead-focus recipe
reconcile the source subset and remaining keyboard/AX gaps.

Only source/semantic review, TypeScript/TSRX syntax and whitespace checks ran.
Exact commands remain deferred until explicit human authorization for this task:

```sh
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/typeahead-focus.macos.mobile.test.tsrx src/date-autofocus.macos.mobile.test.tsrx
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
pnpm probe doctor
pnpm probe run examples/probes/typeahead-focus.macos.tsrx --target macos --watch
pnpm exec turbo run build --filter=@xplat/macos
pnpm check:recipes
```

No package tests/typechecks, builds, installs, native/OS automation, visual
analysis or packaging ran. Actual renderer ref/focus/blur/field-editor/IME and
notification ordering, debounce/source callbacks, result tap/hit testing, inline
layout and packaged imports remain unqualified. Consumer keydown, keyboard
option selection, listbox/active-option relationships and announcements remain
source gaps. PowerSearch initial-focus ownership, Carousel fades, video and
date preset text relay/listbox relationships remain separate work. Checkbox
mixed rollback still awaits the previously asked human contract choice. No
evidence-gated checkbox is closed; the persistent goal remains active.

### AppKit typeahead input keyboard ownership

The preceding focus/search slice is pushed through 1dc04c756; that was real
source progress, not native qualification. Continued the same common people/
label search flow rather than decorative Carousel fades or niche integrations.
Reviewed the current AppKit renderer key protocol: it resolves the owning
textfield from its field editor, reports composing/dead keys and distinguishes
preventDefault from ancestor propagation. No renderer changes were needed.
The typeahead view still had no key binding despite that existing prerequisite.

A private target policy now handles only the current visible input/owned editor
in its own window, including native method/property editor forms. Consumer
onKeyDown runs first; cancellation and callback-driven ref/window/focus/prop
changes are rechecked. Modified editing, composing/marked input and ordinary
text keys preserve native defaults. Closed ArrowDown offers results only for an
eligible query/bootstrap; open arrows wrap highlight, Home/End reach the ends,
Enter commits and Escape consumes only the open list. Tab/Shift+Tab close without
preventing traversal or taking ancestor FocusScope ownership. A stable per-input
claim rejects recursive dispatch and releases on consumer errors. Highlighting
does not move native first responder.

Container highlight intents validate the live result generation/current count.
Keyboard open intent is separate from actual focus notification, so ArrowDown
does not synthesize onFocus callbacks. Current keyed native row leases request
scrollRectToVisible only in the input's window while it/its editor owns focus;
old ref callbacks cannot delete a replacement lease. Existing inline hosting
is retained. Public/internal key comments now distinguish web/AppKit from mobile;
no public type shape, dependency, shared runner/manifest or other-target leaf
changed. Tokenizer's old comment claiming no AppKit key events was corrected,
but its Backspace-removal wrapper remains explicitly unwired.

Seven policy and five object-driver cases are newly authored, all unrun. They
cover wrap/endpoints/manual commit, closed eligibility, Escape/Tab ownership,
IME/marked editors/modifiers/ordinary editing, consumer cancellation/latest state/
reentry/error cleanup, foreign/hidden/detached/replaced/focus-moved targets,
field-editor forms, actual key prop/highlight/row reveal/Enter wiring, closed
open without fake focus callbacks, current readonly state and consumer-driven
source replacement/unmount. These use fake native responders and direct handler
dispatch, not OS keys. The maintained key fixture adds before/after editors,
consumer cancellation and read-only toggles; its runner only mounts/records.
Guide/skill/feature note, appkit-typeahead-focus AC3/AC4 and shared search recipe
platform wording reconcile the current source subset. Earlier fourteen focus
cases also remain unrun.

Only source/semantic review, TS/TSRX syntax parsing and whitespace checks ran.
Exact deferred commands, pending explicit human authorization for this task:

```sh
pnpm exec turbo run test --filter=@octane-xplat/ui -- src/typeahead-keys.macos.test.ts
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/typeahead-keys.macos.mobile.test.tsrx src/typeahead-focus.macos.mobile.test.tsrx
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
pnpm probe doctor
pnpm probe run examples/probes/typeahead-keys.macos.tsrx --target macos --watch
pnpm exec turbo run build --filter=@xplat/macos
pnpm check:recipes
```

No package tests/typechecks/builds, installs, native/OS automation, visual analysis
or packaging ran. Native key/field-editor/IME/dead-key/repeat/modifier delivery,
actual Tab/layer ordering, callback/render/ref timing, scrolling/reveal/layout,
VoiceOver and packaged imports remain unqualified. Native listbox/active-option
relationships and announcements, Tokenizer Backspace removal, PowerSearch focus,
Carousel fades, video and date-preset text relay remain source gaps. Related
source review correction: an existing date-composition.macos.ts leaf already
reads AppKit currentEditor/hasMarkedText. The earlier missing-guard inference
came from reading only the unsuffixed mobile helper and was incorrect. The key
policy independently reads renderer/native marked metadata; actual date IME
behavior remains unqualified. Checkbox mixed
rollback still awaits the previously asked contract choice. No evidence-gated
checkbox is closed; the persistent goal remains active.


### AppKit composition platform-leaf correction

Revalidated the previous turn's date-composition finding against the current
worktree before implementing. The repository already tracks
packages/ui/src/components/forms/date-composition.macos.ts, which reads currentEditor and
hasMarkedText in either property or receiver-bound method form, alongside event
isComposing/keyCode 229. The AppKit suffix chain selects this leaf for unsuffixed
date imports. Its existing date-composition.mobile.test.ts has explicit AppKit
cases, and the prior time-step/date-time cases already model marked editors.
None of those cases was executed. The earlier inference that AppKit lacked the
guard was incorrect; no duplicate helper or replacement architecture is needed.
The prior progress paragraph/issue are corrected and an append-only Silo
observation preserves the correction to the original account.

Source inspection of actual callers does show a separate draft ownership seam:
TimeInput and DateTimeInput text/submit handlers can use captured props and clear
or replace pending text before their current fireChange guard rejects a blocked,
pending or detached edit. That is the next implementation work, not evidence of
an IME guard omission. Native event/editor/IME behavior remains unqualified.
Only source review and whitespace checks ran for this correction; all heavy and
native verification remains deferred under the existing human boundary.

### AppKit TimeInput current draft ownership

After correcting the composition-leaf assessment, continued the actual typed
form seam before niche work. TimeInput's text/submit/clear paths could replace or
clear pending state before fireChange rejected current busy/blocking/reentry or
teardown. They also captured old seconds/bounds/pending text. Existing arrow
stepping guarded current action ownership; typed edits needed the same boundary.
This is a source-observed handler seam, not a newly reproduced native failure.

The target leaf now checks current attachment, disabled/read-only/loading,
writing and actionPending before touching a draft. A ref-owned draft record
tracks the latest pending text independently of old handler closures. Parsing
uses current seconds/min/max/shown value and returns actual fireChange
acceptance. Submit/blur, clear and stepped draft cleanup require the same owned
draft and a live input after callbacks; a parent correction or teardown wins.
Marked text continues through the existing explicit AppKit composition leaf,
which was already implemented. No composition helper, public API, renderer,
dependency, shared manifest/runner or other-target leaf changed.

Six object-driver cases are authored, all unrun. They cover existing marked
editor method/property forms, current disabled/read-only/loading preservation,
pending-save writes before/after busy render, latest seconds/bounds/text through
held callbacks, reentrant editing/submit/clear, callback teardown and parent
correction. A manual fixture provides delayed-save release, current blocking,
seconds, parent correction and removal. Its runner waits/records only. Guide,
skill, feature note and appkit-time-drafts recipe reconcile this source scope.
Only source/semantic, TSRX syntax and whitespace checks ran.

```sh
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/time-draft.macos.mobile.test.tsrx src/time-step.macos.mobile.test.tsrx
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
pnpm probe doctor
pnpm probe run examples/probes/time-draft.macos.tsrx --target macos --watch
pnpm exec turbo run build --filter=@xplat/macos
pnpm check:recipes
```

All remain deferred until explicit human authorization for this task. No package
tests/typechecks/builds, installs, native/OS automation, visual analysis or
packaging ran. Actual native draft/marked-editor/IME/Return/blur/save/ref/caret/
focus/AX and packaged behavior remain unqualified. DateTimeInput's analogous
draft handlers still need current ownership review. Tokenizer Backspace,
PowerSearch focus, native listbox relationships/announcements, Carousel fades,
video and date-preset text relay remain separate gaps. Checkbox mixed rollback
awaits the previously asked human contract choice. No evidence-gated checkbox
is closed; the persistent goal remains active.

### AppKit DateTimeInput current draft ownership

The preceding TimeInput slice is pushed through 74f8165a5; that was source
progress, not native qualification. Continued the analogous composite date/time
form flow before decorative or niche gaps. Actual AppKit source inspection found
both text/submit paths used captured draft/locale/options and wrote pending state
before current fireChange could reject busy/blocking/teardown. Date-less time
could also be read from an old render or return after a cleared empty draft.
The existing date-composition.macos.ts remains correct source for marked editors;
no missing composition implementation is alleged or introduced.

Separate ref-owned date/time text and local-time records now accompany state.
A current edit boundary checks attached fields/root, local/inherited blocking,
writing and pending save before draft changes. Retained handlers read current
locale, seconds, date/time parts and endpoint bounds. Date constraints run inside
an edit claim; reentrant draft/clear/key/preset/calendar actions are rejected,
and critical metadata replaced by a constraint callback invalidates that request.
Date-less time is immediately available to the next same-turn edit; empty submit
can clear it without emitting a parent date-time. Current same-day endpoint
clamping is retained. Identical committed values do not repeat onChange/save.

Commit helpers return acceptance, capture accepted callbacks/save ownership and
perform post-callback cleanup only for the same records/current attached hosts.
Parent correction, field replacement and teardown own subsequent display.
Clear/preset/step cleanup respects current draft ownership; key stepping reads
the latest local time and keeps existing modified/composing/popup policies.
Native save settlement avoids detached UI writes. No public type/API, new
composition helper, renderer, dependency, shared manifest/runner, other-target
leaf or audit snapshot changed.

Eight object-driver cases are authored, all unrun. They cover both marked-editor
forms, latest disabled/read-only/loading state, one save across both fields before
busy render, current date/seconds/bounds via held callbacks, immediate date-less
combination/clear, constraint/application reentry and metadata replacement,
callback correction/teardown, duplicate-value suppression and captured accepted
save callbacks across parent echo. Popover is mocked away; these are direct
handler/fake-host assertions, not native editor/picker evidence. The manual
fixture adds controlled/null-start drafts, held-save release, blocking/seconds,
parent correction and removal. Its runner only waits/records. Guide/skill/feature
note and appkit-time-drafts AC3/AC4 reconcile TimeInput versus composite coverage.
Only source/semantic, TSRX syntax and whitespace review ran.

```sh
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/datetime-draft.macos.mobile.test.tsrx src/datetime-options.macos.mobile.test.tsrx src/time-draft.macos.mobile.test.tsrx
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
pnpm probe doctor
pnpm probe run examples/probes/datetime-draft.macos.tsrx --target macos --watch
pnpm exec turbo run build --filter=@xplat/macos
pnpm check:recipes
```

All remain deferred until explicit human authorization for this task. No package
tests/typechecks/builds, installs, native/OS automation, visual analysis or
packaging ran. Actual native draft/editor/IME/Return/blur/save/ref/caret/focus/AX,
calendar/preset/key ordering and packaged behavior remain unqualified. Existing
preset text relay, listbox/active-option relationships/announcements, Tokenizer
Backspace, PowerSearch focus, Carousel fades and video remain separate source
gaps. Checkbox mixed rollback still awaits the previously asked human contract
choice. No evidence-gated checkbox is closed; the persistent goal remains active.

## AppKit Tokenizer empty-input Backspace and current selection

Demand assumption: everyday tag/people entry precedes niche integrations.
ComponentsDemo's token field and sandbox TokenizerEndContent's embedded Apply
button inform the slice. Source review found no wrapper key hook, two public
imperative registrations, captured removal metadata and unguarded mutation
callbacks. AppKit now routes empty-query Backspace through BaseTypeahead's
current-input/editor key owner. Cached query and actual native text must both
be empty; composing, marked-editor and modified keys retain native editing.

Current controlled selection, metadata, max count and inherited Field blocking
own add/create/remove/clear. Reentry/retired selections/teardown reject mutation.
Pointer restore preserves callback-selected focus and current native attachment.
One memoized handle exposes a live wrapper; delayed blur cancels stale work,
uses current callbacks and retains wrapper/panel descendant focus, including
AppKit's field-editor delegate chain. No public type shape, dependency, renderer,
shared manifest/runner, other-target leaf or audit snapshot changed.

Seven object-driver cases are authored, all unrun: current tail/controlled echo,
query versus editor text, modifiers/composition/marked editors, retained identity
and blocking, callback reentry/focus/teardown, public ref ownership and delayed
embedded-focus blur/current callbacks. These use fake hosts/direct dispatch;
they do not prove OS input. The manual fixture includes accepted/rejected
controlled state, an embedded action and adjacent editors; its runner only
waits/records. Guide/skill/recipe/feature note reconcile this source subset.

Only source/semantic review, TSRX/TypeScript syntax parsing and whitespace checks
ran. Exact deferred commands:

```sh
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/tokenizer-keys.macos.mobile.test.tsrx src/typeahead-keys.macos.mobile.test.tsrx src/typeahead-focus.macos.mobile.test.tsrx
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
pnpm probe doctor
pnpm probe run examples/probes/tokenizer-keys.macos.tsrx --target macos --watch
pnpm exec turbo run build --filter=@xplat/macos
pnpm check:recipes
```

All remain deferred until explicit human authorization for this task. No package
tests/typechecks/builds, installs, OS automation, visual analysis or packaging
ran. Native keys/repeat/IME/field-editor/focus/blur/popup/AX and package behavior
remain unqualified. Legacy optional getActualSize/getLocationRelativeTo overflow
measurement still needs a separate AppKit geometry review; this change does
not establish inline/layer truncation. Other remaining source gaps include
PowerSearch focus, active-option AX/announcements, preset text relay, Carousel
fades and video. Checkbox mixed rollback still awaits the earlier human contract
choice. Evidence-gated checkboxes stay open; the persistent goal remains active.

## AppKit PowerSearch owned initial focus

Demand assumption: the sandbox's PowerSearchContentSearch and
PowerSearchSearchWithTable make a searchable content/table filter bar a more
useful next input flow than niche integration. Source review of Tokenizer
geometry confirmed that replacing NativeScript measurement calls alone would
leave duplicated layer token refs and web-only truncation styles unresolved;
that source gap stays explicit rather than claiming layout parity.

PowerSearch's one-shot hasAutoFocus effect bypassed the existing private AppKit
request owner. It now binds the current typed shared-input native handle after
commit and delegates attachment/visibility/input/window/responder ownership to
that existing policy. Current inherited disabled/read-only/loading and active
editing cancel pending work. One memoized callback handle reads current input,
blocking and attachment, preserves foreign blur, and is inert after teardown.
No new null callback notification is added. No shared input public prop, renderer,
dependency, other-target leaf, runner or audit snapshot changed.

Correction to the initial investigation assumption: TextInput/TextArea have no
public hasAutoFocus flag. They were not missing implementation of that prop;
the PowerSearch view owns this existing flag directly. No shared input API or
source was changed. This distinction is reconciled in guide/skill/recipe.

Five object-driver cases are authored, all unrun: late attachment/one attempt,
input/flag/unmount cancellation and cleanup, inherited blocking and explicit
rearm, changed responder/active editing, and live callback handle replacement/
foreign blur/teardown. They use fake hosts/native observation and mock away
Popover; actual native ordering and modal behavior are not proven. The manual
fixture adds mount/remount, request/blocking toggles and another focus owner;
its runner only waits/records. Only source/semantic review, TS/TSRX syntax parsing
and whitespace checks ran.

```sh
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/power-search-focus.macos.mobile.test.tsrx src/auto-focus.macos.test.ts src/typeahead-focus.macos.mobile.test.tsrx
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
pnpm probe doctor
pnpm probe run examples/probes/power-search-focus.macos.tsrx --target macos --watch
pnpm exec turbo run build --filter=@xplat/macos
pnpm check:recipes
```

All remain deferred until explicit human authorization for this task. No package
tests/typechecks/builds, installs, OS automation, visual analysis or packaging
ran. Native attachment/notification/focus/caret/IME/modal/AX and package behavior
remain unqualified. Tokenizer overflow geometry/truncation, active-option AX/
announcements, preset text relay, Carousel fades and video remain source gaps.
Checkbox mixed rollback still awaits the earlier human contract choice.
Evidence-gated checkboxes stay open; the persistent goal remains active.

## AppKit native overflow clipping prerequisite

Tokenizer's collapsed layout needs an actual native clipping boundary before
replacing its legacy measurements. Source review found Mason recognizes overflow
enums for layout, but applyStyle never set NSView.clipsToBounds. The local Apple
SDK's AppKit/NSView.h marks that property available since macOS 10.9 and states
that the default changed from YES to NO in macOS 14, with specialized views
supplying their own defaults. This is SDK/source evidence, not runtime proof.

The AppKit style adapter now resolves final shorthand/axis declarations together:
two hidden/clip axes set clipsToBounds, two visible axes clear it. Removal/null
restores the original value for that native view; replacement restores the old
view and captures the new baseline. Unowned native clipping remains untouched.
Rounded CALayer clipping remains independent. Mixed axes and auto/scroll forms
restore the baseline and report unsupported properties; they do not create a
scroll container. No other target, dependency, manifest or snapshot changed.

Six source-slice style reconciliation cases are authored, all unrun: both native
defaults/removal, visible/null, CSS/inline/radius independence, explicit/mixed axes,
replacement and unrelated styles. The manual fixture only waits/records.
Renderer README, styling skill, recipe and feature note reconcile the subset.
Only source/SDK/semantic review, TypeScript/TSRX syntax parsing and whitespace
checks ran. Exact deferred commands:

```sh
pnpm exec turbo run test --filter=@octane-xplat/macos-renderer
pnpm exec turbo run typecheck --filter=...@octane-xplat/macos-renderer
pnpm probe doctor
pnpm probe run examples/probes/overflow-clip.macos.tsrx --target macos --watch
pnpm exec turbo run build --filter=@xplat/macos
pnpm check:recipes
```

All remain deferred until explicit human authorization for this task. No package
tests/typechecks/builds, installs, OS automation, visual analysis or packaging
ran. Native drawing/hit-testing/AX/shadow/resize/package behavior is unqualified.
Tokenizer still needs native geometry, separate collapsed/panel row refs and
counter layout; clipping alone does not prove token truncation. Evidence-gated
checkboxes stay open; the persistent goal remains active.

## AppKit Tokenizer native overflow geometry

Demand assumption: compact token entry with long labels, adjacent editors and
embedded actions is a common application flow; the sandbox token-entry examples
inform the slice. Building on c2689a486's renderer clipping prerequisite, the
AppKit leaf now puts collapsed tokens inside a clipped flex viewport, with its
counter outside. Tokens keep natural widths. Layer mode uses separate mounted
token copies; only the collapsed row registers measurement refs, and each mounted
copy owns a guarded release. The unused alternate row and NativeScript
getActualSize/getLocationRelativeTo measurements are removed.

Native bounds and convertRectToView compare both edges, covering RTL positions,
nonzero bounds origins, partial clipping and fractional tolerance. Missing,
foreign, detached, nonfinite and zero-size geometry preserve the last count.
Post-commit/native-layout measurement is coalesced and guarded after teardown.
Counter reclamation checks whether every token would fit without its reserved
space, then waits through stale viewport notifications; token width changes
retire that wait. This avoids a count reserving its own space after a resize.
No public API shape, dependency, manifest, runner, other-target leaf or shared
audit snapshot changed. Shared type comments remain unchanged in this slice.

Eight geometry cases and five object-driver cases are authored, all unrun.
They cover native coordinate conversion/invalid state/RTL/counter reclamation,
viewport/counter wiring, resize/count changes, inline focus expansion, current
selection/mode replacement, separate layer refs, incomplete geometry, teardown
and stale-layout/font-width transitions. Geometry/observation are fake; no native
layout ordering is proven. The manual fixture adds width/mode/reset/reorder and
embedded-action flows; its runner only waits/records. Guide/skill/recipes and
feature note reconcile the source subset, and the renderer README now links it.

Only source/semantic review, TypeScript/TSRX syntax parsing and whitespace checks
ran. Exact deferred commands:

```sh
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/tokenizer-overflow.macos.test.ts src/tokenizer-overflow.macos.mobile.test.tsrx src/tokenizer-keys.macos.mobile.test.tsrx
pnpm exec turbo run test --filter=@octane-xplat/macos-renderer
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui --filter=...@octane-xplat/macos-renderer
pnpm probe doctor
pnpm probe run examples/probes/tokenizer-overflow.macos.tsrx --target macos --watch
pnpm exec turbo run build --filter=@xplat/macos
pnpm check:recipes
```

All remain deferred until explicit human authorization for this task. No package
tests/typechecks/builds, installs, OS automation, visual analysis or packaging
ran. Native drawing/Mason sizing/resize/fonts/RTL/focus/IME/hit-testing/AX and
packaged behavior remain unqualified. Tokenizer's existing surfaces.macos
Popover still renders inline: this slice does not establish floating-layer
parity. Active-option AX/announcements, preset text relay, Carousel fades and
video remain separate source gaps; Checkbox mixed rollback awaits the earlier
human contract choice. Evidence-gated checkboxes stay open; the goal is active.

## AppKit plain text edit ownership

Demand assumption: Home's text input and shared name/message/search examples
make plain form edits higher demand than preset-row text relay. Source review
of DateTimeInput's remaining relay gap confirmed that NativeKeyboardEvent does
not expose the original NSEvent; composing/edit-command forwarding needs a
native handoff design, rather than reconstructing input from event.key. No relay
behavior is claimed or changed here.

The ordinary AppKit text controls previously used captured editable state and
callbacks, duplicated ref adapters, and unconditional clear refocus. TextInput
and TextArea now share a private target-local edit owner; SearchInput inherits
it through TextInput. Held callbacks read current inherited disabled/read-only
state, callbacks and multiline return-key policy. Mounted-host/reentry guards
reject retired/nested actions; rapid uncontrolled edits update current local
text before render. Controlled feedback stays parent-owned, and isLoading keeps
its documented descriptive behavior rather than disabling edits.

Marked drafts still report edit notifications. Submit/clear wait for unmarked
text, checking the NSTextView itself and the existing field-editor composition
helper. An accepted clear captures its onChange('')/onClear callback pair, even
if the first callback replaces props or removes the field. Subsequent focus work
requires the same native input/window/responder and current editable state;
callback-driven focus, blocking or teardown wins. Stable public handles reuse
the existing private native handle adapter, follow ref replacement, preserve
foreign blur and become inert after teardown. Read-only focus is allowed;
disabled/hidden/native-disabled focus is rejected. The adapter changed only its
comment to reflect reuse. No public API shape, new autofocus flag, dependency,
manifest, renderer behavior, other-target leaf or shared audit snapshot changed.

Ten object-driver cases are authored, all unrun. They cover current inherited
blocking/callback replacement, controlled correction, rapid local edits/reentry,
direct/editor marked state versus draft reporting, current multiline Return,
public refs/native focus/foreign blur, held clear guards/duplicate local clear,
accepted callback ownership/parent replacement/teardown, newer focus choices,
SearchInput delegation and claim release after callback failure. Hosts/editors/
responder changes are fake, so OS event ordering is not proven. The manual
fixture adds controlled acceptance/rejection, blocking, clear-to-next focus,
uncontrolled multiline/search and removal/remount; its runner only waits/records.
Guide/clear guidance/skill/target recipe and feature note reconcile the subset.

Only source/semantic review, TypeScript/TSRX syntax parsing and whitespace checks
ran. Exact deferred commands:

```sh
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/text-entry-ownership.macos.mobile.test.tsrx src/text-controls.macos.mobile.test.tsrx src/date-field-handle.macos.test.ts src/power-search-focus.macos.mobile.test.tsrx
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
pnpm probe doctor
pnpm probe run examples/probes/text-entry-ownership.macos.tsrx --target macos --watch
pnpm exec turbo run build --filter=@xplat/macos
pnpm check:recipes
```

All remain deferred until explicit human authorization for this task. No package
tests/typechecks/builds, installs, OS automation, visual analysis or packaging
ran. Native editing/IME/caret/selection/Return/clear hit-testing/focus/notification
ordering/AX and package behavior remain unqualified. Preset text relay, active-
option AX/announcements, Carousel fades, video and floating Tokenizer layer
hosting remain separate source gaps. Checkbox mixed rollback awaits the earlier
human contract choice. Evidence-gated checkboxes stay open; the goal is active.

## AppKit radio current selection ownership

Demand assumption: ComponentsDemo, theme preview and table-filter examples use
RadioList for ordinary settings/selection. Current source already selects the
AppKit RadioListItem leaf, despite the historical TSV pointing at the old mobile
leaf. That source snapshot stays unchanged. Pull-to-refresh has fewer repository
uses and is explicitly unsupported; video/lightbox remain separate gaps.

RadioGroup now reads current inherited blocking/options/callbacks through a live
record and updates uncontrolled local selection before render. Mounted root/current
registered value, duplicate selection and reentry guards own acceptance. Held
keyboard handlers check current blocking before native focus/navigation. Row
activation reads current props/group/registry and checks its attached registration;
per-binding leases preserve a newer registration during old-key/provider cleanup.
Controlled requests still await parent feedback and can repeat while rejected.
Callback-driven focus changes and teardown remain authoritative; failed consumer
callbacks release the claim. No shared context/public API shape, choice-focus
helper behavior, dependency, manifest, other-target leaf or audit snapshot changed.

Eight object-driver cases are authored, all unrun: rapid local duplicate/reentry,
controlled rejection/echo, current inherited blocking/held keys, per-row disable/
detach, changed child value/registration, current keyboard callbacks/teardown,
callback focus/removal and error release. Native row trees/responders are fake;
these do not prove OS navigation. The existing fixture adds blocking, child
value/state, acceptance and focus-move controls plus an uncontrolled group. Its
run hook remains direct selection only. Guide/skill/recipe AC5 and feature note
reconcile the subset; existing AC1–AC4 evidence remains unrun.

Only source/semantic review, TSRX syntax parsing and whitespace checks ran.
Exact deferred commands:

```sh
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/radio-ownership.macos.mobile.test.tsrx src/radio-list.macos.mobile.test.tsrx src/tab-list.macos.mobile.test.tsrx
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
pnpm probe doctor
pnpm probe run examples/probes/radio-list.macos.tsrx --target macos --watch
pnpm exec turbo run build --filter=@xplat/macos
pnpm check:recipes
```

All remain deferred until explicit human authorization for this task. No package
tests/typechecks/builds, installs, OS automation, visual analysis or packaging
ran. Native pointer/keyboard/Tab/RTL/focus/reveal/group relationships/VoiceOver,
layout and package behavior remain unqualified. Toolbar-specific radio navigation
remains unsupported. Evidence-gated checkboxes stay open; the goal remains active.

## AppKit typeahead native roles and relationships

Demand assumption: ComponentsDemo's people search and token-entry examples make
accessible suggestions a common application flow. Selector already has a local
AppKit keyboard/selection path; video remains a separate native placeholder.
Source review found the typeahead view had no combo/list/option roles or native
input/list/highlight relationships. The renderer's editable controls ignored
accessibilityRole and expanded state, so those prerequisites are fixed first.

The renderer maps native editable combobox to AXComboBox, host listbox/option to
AXList/AXRow and explicit input expanded state to native metadata. Dropped/null
role/expanded overrides restore each view's original metadata; replacement
releases old owners and captures fresh baselines. Existing multiline enabled
mirroring and other host roles remain intact.

The AppKit result view now names options/list and exposes pending AX selection
from highlight, independently of the committed controlled value/checkmark.
A private owner links the same-window inline input/list, preserves unrelated
baseline links and publishes the highlighted current descendant as selected
children on both. Hidden/foreign/detached rows are excluded. Row identity changes
request AXSelectedChildrenChanged. Close/block/ref/window changes restore
metadata; late attachment uses scoped window-update observation. Queued work,
partial native-write failure and teardown release ownership. No focus-changing
API is called by this helper. Native AX hierarchy/navigation/spoken output are
not proven by this source model; the existing inline host remains unchanged.

API evidence: Apple's [selected-children property](https://developer.apple.com/documentation/appkit/nsaccessibility-c.protocol/accessibilityselectedchildren)
represents current selected child elements; [linked UI elements](https://developer.apple.com/documentation/appkit/nsaccessibility-c.protocol/accessibilitylinkeduielements?language=objc)
defines relationships between UI elements. Local AppKit declarations also expose
the role/expanded/selected-children/link setters and notification constant.
These establish API availability/meaning only, not our native tree's correctness
or VoiceOver behavior. No third-party source was copied or dependency added.

Four renderer source-slice cases, ten relationship cases and five object-driver
view cases are authored, all unrun. They cover native role/expanded restoration,
replacement, preserved links/current pending row, invalid visibility/window,
late attachment/old-window detach, NSArray baselines, disposal/partial-write
cleanup and actual view role/key/result/blocking wiring. Native metadata/views/
observation are fake; no OS AX query occurred. The new fixture only waits/records.
Guide/skill/recipe AC5/renderer README/feature note reconcile the subset. No public
API shape, dependency, manifest, other-target leaf or audit snapshot changed.

Only source/API/semantic review, TypeScript/TSRX syntax parsing and whitespace
checks ran. Exact deferred commands:

```sh
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/typeahead-accessibility.macos.test.ts src/typeahead-accessibility.macos.mobile.test.tsrx src/typeahead-keys.macos.mobile.test.tsrx src/typeahead-focus.macos.mobile.test.tsrx
pnpm exec turbo run test --filter=@octane-xplat/macos-renderer
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui --filter=...@octane-xplat/macos-renderer
pnpm probe doctor
pnpm probe run examples/probes/typeahead-accessibility.macos.tsrx --target macos --watch
pnpm exec turbo run build --filter=@xplat/macos
pnpm check:recipes
```

All remain deferred until explicit human authorization for this task. No package
tests/typechecks/builds, installs, native/OS/AX automation, visual analysis or
packaging ran. Native hierarchy, VoiceOver navigation/actions/announcements,
editor focus/IME/notification ordering and package behavior remain unqualified.
Selected-children notification requests do not establish live announcements or
fully qualified combo/listbox behavior. Other Selector/preset lists, floating
results, preset text relay, Carousel fades and video remain separate gaps.
Checkbox mixed rollback awaits the earlier human contract choice. Evidence-gated
checkboxes stay open; the persistent goal remains active.

## AppKit source-owned window-layer prerequisite

Demand assumption: floating search suggestions are a common form flow. Current
Typeahead/Tokenizer results still use the inline surfaces.macos Popover. Source
review found that swapping to Popover.macos directly would use an NSPopover with
a standalone root and separate native window, changing provider/input-focus
ownership. The existing same-window showLayer host is the appropriate engine
prerequisite; component integration remains outstanding after this slice.

WindowLayer now accepts a createContentRoot outlet in place of its standalone
root. Optional whenCommitted gates geometry to the current content commit;
deferPresentation/show separates preparation from visibility without a focus or
window-activation call. Old revision callbacks cannot resize/reveal retired work.
A malformed supplied root fails explicitly rather than falling back to detached
ownership. Default callers retain the standalone path. This is an internal host
seam, so no public component API or release note is added.

The original window/content container owns the layer; moving or detaching the
anchor retires it and notifies once. Optional anchor exclusion keeps compound-
field clicks inside the dismissal boundary. Staged hosts ignore dismissal;
visible outside events request controlled dismissal and pass through unchanged.
Close claims first and attempts every monitor/observer/notification lease/source
root/native-detach cleanup, then reports the first failure. Unchanged frames
avoid native writes, and invalid geometry is rejected before reaching AppKit.

Eight new source cases are authored, all unrun: custom outlet/default bypass,
commit/deferred/stale reveal, staged/anchor dismissal, changed window, changed
content container, cleanup failure, invalid/failed source roots and no-op/invalid
geometry. The source-portal fixture demonstrates a provider, stage/reveal,
updates and disposal; its runner only waits/records. No native portal or input
was exercised. Renderer README/overlay skill/target recipe reconcile the seam.
No dependency, manifest, UI leaf, other-target source or audit snapshot changed.
Only source/semantic review, TypeScript/TSRX syntax parsing and whitespace ran.

```sh
pnpm exec turbo run test --filter=@octane-xplat/macos-renderer
pnpm exec turbo run typecheck --filter=...@octane-xplat/macos-renderer
pnpm probe doctor
pnpm probe run examples/probes/window-layer-portal.macos.tsrx --target macos --watch
pnpm exec turbo run build --filter=@xplat/macos
pnpm check:recipes
```

All remain deferred until explicit human authorization for this task. No package
tests/typechecks/builds, installs, native/OS automation, visual analysis or
packaging ran. Native source portal/context/ref/commit ordering, geometry,
visibility, resize/scroll, focus, dismissal, AX and package behavior are unqualified.
Typeahead/Tokenizer results remain inline; actual source-owned result hosting,
compound blur/dismissal and current width/anchor integration are next work.
Generic native Popover/useLayer still own detached roots. Do not treat this host
prerequisite as a completed floating-result feature. Evidence gates stay open;
the persistent goal remains active.

## AppKit source-owned floating typeahead results

Demand assumption: ComponentsDemo's Typeahead and sandbox token-entry examples
represent ordinary assignee/tag forms; source-owned floating suggestions have
higher demand than remaining charts/polish. This slice connects the preceding
same-window renderer prerequisite to BaseTypeahead's AppKit view. Typeahead and
Tokenizer inherit that result view. Tokenizer's separate outer unfocusedLayer
editor remains inline; general native Popover/useLayer still own standalone
roots. No shared manifest/CLI/other-target implementation or audit snapshot
changed.

The private result host publishes a native source outlet, then renders children
through a portal under the field's declaring providers and layer depth. There is
no separately mounted result tree or inline compatibility fallback. A matching
source-outlet/staged-layer renderer is required; missing or legacy hosts fail
explicitly. Source commits gate initial reveal and changed sizing. Current
anchor/menuWidth/viewport/placement/direction choose bounded width/scroll height
and existing flip/clamp positioning. Native layout/scroll correctness remains
unqualified.

Current native input, anchor, window and source token own each presentation.
Replacement retires old callbacks/targets; source/window closure cancels until
an explicit close/open rearms. Cleanup claims ownership before reentry, attempts
observer release even after host failures and preserves original creation
errors. Source disposal during host creation closes a late returned handle
without post-disposal state publication. Controlled outside dismissal respects
current top-layer permission and excludes the anchor. No focus transfer or
restore is requested. Input/shared editor delegate and result descendants form
one native field-leave boundary, forwarding the original event to the latest
callback only when focus leaves both.

Fourteen controller/focus cases and four actual source-portal object-driver
cases are authored, all unrun. They describe commit/reveal, bounded/current
geometry and RTL, owner/ref/window/source retirement, controlled/nested dismiss
permission, missing/legacy hosts, reentrant disposal/window migration, failure
cleanup, compound focus and provider propagation. The recording portal driver
flattens physical targets; it does not prove native positioning or containment.
Existing state/key/AX/token cases explicitly mock this result host and retain
their state-policy scope. The manual fixture supplies clipped parent, 40 rows,
provider/source/width/RTL/blocking/removal controls; its runner only waits/records.

Guide, primitive/overlay skills, renderer README, release note and both affected
recipes reconcile the source change. Source/semantic review, TypeScript/TSRX
syntax parsing and whitespace are the only checks performed. No unit/component
test was executed. Exact deferred commands:

```sh
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/typeahead-layer.macos.test.ts src/typeahead-results.macos.mobile.test.tsrx src/typeahead-focus.macos.mobile.test.tsrx src/typeahead-keys.macos.mobile.test.tsrx src/typeahead-accessibility.macos.mobile.test.tsrx src/tokenizer-keys.macos.mobile.test.tsrx src/tokenizer-overflow.macos.mobile.test.tsrx
pnpm exec turbo run test --filter=@octane-xplat/macos-renderer
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui --filter=...@octane-xplat/macos-renderer
pnpm probe doctor
pnpm probe run examples/probes/typeahead-results.macos.tsrx --target macos --watch
pnpm exec turbo run build --filter=@xplat/macos
pnpm check:recipes
```

All remain deferred until explicit human authorization for this task. No heavy
build/typecheck/test/install, native/OS automation, visual analysis or packaging
ran. Source portal/provider/ref/commit timing, natural scroll sizing, clipping,
window resize/scroll/RTL, real input/caret/IME/focus/blur/click ordering, nested
layer dismissal, native AX/announcements and packaged imports remain unqualified.
Do not close floating-result or platform evidence gates from this implementation.
The persistent goal remains active.


## AppKit committed-result highlight readiness

Source follow-through on the floating-result integration found that the field's
highlight effect can run before portal rows mount. Publishing a target rerenders
the result child rather than necessarily rerendering its owning field, so the
parent effect alone cannot cover that readiness boundary. This is source
reasoning, not an observed native failure. It matters for current highlighted
rows and same-window AX links on initial result attachment/replacement.

The private controller now reports readiness only for a current, committed,
revealed session. Retired source roots, closed handles, changed native windows
and stale tokens cannot report readiness or count as present, including native
retirement during show. The source portal relays successful readiness to the
field's stable live callback. That callback refreshes native AX relationships
and requests scrolling of the current highlighted row only while the current
input/owned editor retains focus in the row's window. It rechecks live open,
blocking, result key and native refs; it does not transfer focus. The existing
parent highlight effect remains for ordinary navigation updates.

Two additional controller cases and three explicit readiness-boundary wiring
cases are authored, unrun. The complete floating-result source set is now sixteen
controller/focus, four portal and three readiness cases. Readiness cases mock
only the result host and signal the boundary after decorating fake native rows;
they cannot prove actual source/native commit timing or scrolling. Guide/skill/
recipe reconcile this addition; the previous feature note already covers the
same unreleased result host. No shared API, other-target source or audit changes.
Only source/semantic review, TS/TSRX syntax parsing and whitespace ran.

```sh
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/typeahead-layer.macos.test.ts src/typeahead-results.macos.mobile.test.tsrx src/typeahead-result-ready.macos.mobile.test.tsrx src/typeahead-keys.macos.mobile.test.tsrx src/typeahead-accessibility.macos.mobile.test.tsrx
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
pnpm probe doctor
pnpm probe run examples/probes/typeahead-results.macos.tsrx --target macos --watch
pnpm exec turbo run build --filter=@xplat/macos
pnpm check:recipes
```

Every command remains deferred until explicit human authorization for this task.
Native portal/context/ref/commit ordering, actual row reveal/scrolling, editor/
IME/focus/blur, AX/announcements and packaging remain unqualified. The prior
floating-result slice's other deferred checks still apply. The issue's native
proof gates remain open and the persistent goal stays active.


## AppKit decoded-image memory invalidation prerequisite

Demand assumption: ordinary avatar/feed/detail image reuse is a more common app
need than remaining niche integrations. The Services image preview and shared
image-gallery examples establish the display path. Source audit/current leaf
review confirms public AppKit prefetch/evict/query/configuration/clear functions
are still stubs. The public prefetch contract promises disk bytes rather than
decoded-memory warming, so a memory-only facade cannot honestly complete it.
Existing renderer loads share a bounded decoded cache and NSURLSession's shared
HTTP session; disk ownership, headers and public engine options remain separate
implementation work. No foreign plugin/import substitution was added.

The renderer's request manager now exposes private decoded-memory isCached,
evict and clear controls, wired through its AppKit host bridge and declared
there. Probe reads do not change LRU order. Eviction/clear remove cached decodes
and detach old in-flight sharing/cache-write ownership; later subscribers start
fresh work. Already subscribed views retain their deliveries and final-subscriber
cancellation, including after native start returns late. Invalidated completions
cannot rewarm old bytes or overwrite a newer same-source decode, and duplicate
or cancelled completions are ignored. Clearing never blanks mounted images or
forces an unchanged view to reload. NSURLSession HTTP caching is untouched; this
is not disk eviction, a privacy purge or a public image-cache support claim.

Six request-policy and two remote/main-queue fake cases are authored, all unrun.
They cover recency-neutral probes, per-source eviction, clear, current deliveries,
replacement cache ownership, final cancellation, native-start and listener reentry,
late/duplicate completion and invalidation between remote completion and main-
queue decode. The manual fixture exposes memory controls and mount/remove reuse;
its runner only waits/records. Renderer README/recipe AC5 and the primitive skill
record this prerequisite and the unchanged public boundary. No public API or
engine behavior is completed, so no release note is added for this internal seam.
Source/semantic review, TS/TSRX syntax parsing and whitespace are the only checks.

```sh
pnpm exec turbo run test --filter=@octane-xplat/macos-renderer
pnpm exec turbo run typecheck --filter=...@octane-xplat/macos-renderer
pnpm probe doctor
pnpm probe run examples/probes/image-memory-cache.macos.tsrx --target macos --watch
pnpm exec turbo run build --filter=@xplat/macos
pnpm check:recipes
```

All commands remain deferred until explicit human authorization for this task.
No tests/typechecks/builds/installs, OS/native automation, visual analysis or
packaging ran. Native decoding, memory lifetime/pressure, responsiveness,
threading/network completion, actual disk/HTTP caching and packaged bridge
availability remain unqualified. Public cache APIs still need owned disk/HTTP
integration and their actual advertised semantics, followed by qualification;
the issue's source/runtime gates remain open and the persistent goal is active.

## AppKit image-owned byte cache and public helpers

Demand assumption remains ordinary feed/avatar/detail reuse, reflected in the
Services preview, CachedImageDemo and maintained cached-image probe. Following
the decoded-memory prerequisite, the current AppKit image helpers now connect
to an image-owned byte backend instead of returning unconditional false/none.
No mobile plugin is imported or substituted; no dependency or shared UI/CLI
manifest changed. The image package now owns a focused Node test task for its
private adapter; it does not import that adapter through renderer tests or
claim coverage of its separate web Vitest cases. The native default host and matching optional image facade
must travel together. The macOS declaration now imports PrefetchOptions locally,
rather than referencing a name only re-exported from generated props; this is
source correction, not a passed consumer typecheck.

The backend uses Foundation URLCache with zero byte-memory capacity, a 64 MiB
disk allowance, and an app-bundle-scoped directory under user Caches. URLSession
is dedicated/credential-free with automatic caching disabled, so image eviction
never clears unrelated shared HTTP responses. This changes the prior shared-
session cookie/credential behavior and is recorded as an alpha hard cutover.
Apple's direct-cache/configuration documentation and installed SDK signatures
support the source API selection; native persistence/capacity are not proven.
No custom filesystem hashing/cache format or new engine dependency was added.

Display and prefetch share current byte work. Prefetch stores bytes without
constructing NSImage; successful current 2xx responses are eligible only without
no-store/no-cache/private, Vary or Set-Cookie markers. Stored-data readback must
match the response before reporting true. Native dictionary headers are handled.
Disk failure still permits network display, without claiming a warm cache.
Decoded memory takes precedence in public queries; otherwise owned disk/none
are reported. These are URL-identity engine bytes until explicit/OS eviction,
not HTTP freshness revalidation. Deferred disk reads/full-resolution decode can
still block the main loop; profiling/optimized decode scheduling remain open.

Per-source leases and a clear epoch invalidate old disk writers/sharing while
preserving existing view deliveries and final-subscriber cancellation. Old or
cancelled queued completion cannot overwrite a newer cached response. Public
eviction/clear invalidate both byte and decode owners; memory-only controls leave
disk available. Current mounted pixels remain and unchanged views are not forced
to reload. These APIs are not an account-data/privacy purge. Credential-free
transport does not establish support for cookie- or header-authenticated images.

The optional adapter reuses the existing batch concurrency helper. Missing hosts
resolve false/none; failed clear rejects. Header prefetch resolves false instead
of sharing protected data under a URL-only key. Configuration fields explicitly
throw, and unsupported decode-transform probes report none. Default initialization
is available; engine memory sizing/signatures, display headers/cachePolicy/decode
bounds/failure images/transitions/progressive and load/error callbacks remain gaps.
Display headers and cachePolicy="none" now throw before default persistent
loading instead of being ignored; the private validator is covered by the adapter
source cases. This is an explicit subset, not implemented cache-bypass behavior.
No full engine or native platform support is claimed.

Nine byte-cache cases, six public-adapter cases, seven remote-view cases and
updated placeholder coverage are authored, all unrun. Fake view cases evaluate
isolated source modules and recording Foundation objects; no real native cache,
file or network work is exercised. The target cached-image fixture offers public
prefetch/query/mount/evict/clear controls, initially without a mounted image; its
runner only waits/records. The older mobile/web fixture directs AppKit to this
case rather than waiting for unsupported load/error/transform callbacks. The DOM
CachedImageDemo is unchanged because its web/mobile engine callback flow is not
the AppKit qualification flow. Guide/README/known limits/skill/recipe AC6/release
note reconcile this source change; immutable audit snapshots remain unchanged.

```sh
pnpm exec turbo run test --filter=@octane-xplat/macos-renderer --filter=@octane-xplat/image
pnpm exec turbo run typecheck --filter=...@octane-xplat/image --filter=...@octane-xplat/macos-renderer
pnpm probe doctor
pnpm probe run examples/probes/cached-image.macos.tsrx --target macos --watch
pnpm exec turbo run build --filter=@xplat/macos
pnpm exec turbo run test:packed --filter=@octane-xplat/image --filter=@octane-xplat/macos-renderer
pnpm check:recipes
```

Every command remains deferred until explicit human authorization for this task.
Only source/semantic review, TS/TSRX syntax parsing and whitespace ran. No package
test/typecheck/build/install, probe, OS/native automation, visual analysis or
packaging ran. Native URLCache persistence across launch, capacity/eviction,
main-queue/disk I/O, HTTP redirects/errors/policy and unavailable storage,
network cancellation/reentry, source replacement, memory lifetime/responsiveness,
packaged image-helper imports and supported macOS versions remain unqualified.
The image/cache and distribution evidence gates stay open; the goal is active.

## AppKit per-image cache bypass

Demand assumption: per-image cache control is a common need for changing or
user-provided images; it is already part of the optional image package's public
contract/examples. The preceding slice rejected cachePolicy="none" to avoid
silently using persistent storage. This follow-through now implements the
framework bypass path instead of leaving that public option rejected. Headers,
config sizing/signatures and other engine options remain independent gaps.

CoreImage keeps its source/SVG/placeholder, class/style, parent-layout and source-
candidate normalization. The optional image leaf sends a private typed prop
through that component; the core public ImageProps contract is unchanged. A
private marker on the actual CoreImage function and a renderer capability flag
must both be present before a bypass render; older/missing packages fail rather
than silently dropping the option. Header requests still fail before loading.
No package manifest, dependency or shared CLI/UI export manifest changed.

The intrinsic imageCachePolicy carries the final per-view mode at native
creation and on complete-prop-bag mutation. Source, placeholder and policy changes
all re-evaluate the same final state; unchanged source/mode is idempotent. A mode
change on the same URI increments the view's request generation and releases
its old subscription. Default decoded/byte pools retain their existing cache
behavior. Bypass uses separate pending pools, shares only within its mode, never
retains a decoded cache entry, skips owned disk reads/writes/initialization, and
uses the existing automatic-cache-disabled transport. Local/file bypass avoids
the framework decode cache too. Displayed/placeholder bitmaps remain owned by
the view; platform NSImage/resource internals are not claimed cache-free.

Public cache clear/eviction leaves independent bypass consumers alive; their
completion cannot warm framework caches. Bypass does not purge an older default
entry or modify normal prefetch/display ownership. A URI cache query may still
report an entry created by another/default view. Returning to default can reuse
that entry; retired mode callbacks cannot replace the current view. This is a
request policy, not a privacy/account-data purge or an image reload imperative.

Sixteen cases are added, all unrun: three byte-owner, seven remote/local-view,
two adapter/capability, two native-prop dispatch and two CoreImage wiring cases.
The earlier rejection case is updated for implemented policy plus unsupported
headers/invalid modes. Total relevant suites now contain twelve byte, eight
adapter, fourteen remote-view, two prop-dispatch and six CoreImage cases, in
addition to earlier request/placeholder coverage. Prop cases exercise source
creation and the image dispatch branch under its complete-bag protocol; they
do not prove actual native batch/commit order. Core cases use the object driver.
Source review also found paint/placeholder/native-cancel reentry before the
subscription handle is stored. The owner now claims the prior release before
calling it, checks current generation after cancellation/decode, and either
stores or immediately releases a late handle. Three view cases cover teardown
while painting, cached-hit source replacement and cancellation-driven source
replacement. These are source cases, not observed native failures. No native
disk/network or AppKit interaction has run.

The target fixture can toggle mode on the same mounted source. README, guide,
primitive skill, recipe AC7 and the existing unreleased image-cache feature note
reconcile the implemented subset. Source/semantic review, TS/TSRX syntax parsing
and whitespace are the only checks performed. Exact deferred commands:

```sh
pnpm exec turbo run test --filter=@octane-xplat/macos-renderer --filter=@octane-xplat/image
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/image.macos.mobile.test.tsrx
pnpm exec turbo run typecheck --filter=...@octane-xplat/image --filter=...@octane-xplat/ui --filter=...@octane-xplat/macos-renderer
pnpm probe doctor
pnpm probe run examples/probes/cached-image.macos.tsrx --target macos --watch
pnpm exec turbo run build --filter=@xplat/macos
pnpm exec turbo run test:packed --filter=@octane-xplat/image --filter=@octane-xplat/macos-renderer
pnpm check:recipes
```

All remain deferred pending explicit human authorization for this task. No tests,
typechecks/builds/installs, probe, OS/native automation, visual analysis or
packaging ran. Actual cache bypass, disk absence/capacity, native same-source
policy mutation ordering, queue/cancellation/reentry, candidate/density/layout,
memory/bitmap lifetime, responsiveness and packed/mixed-version behavior are
unqualified. The original image/platform evidence gates remain open; the goal
is active and the audit snapshots are unchanged.


## AppKit current image load and error callbacks

Preview/loading/failure state is a common image flow in the repository's cached
image demo and native file preview screens. The optional AppKit Image previously
dropped onLoad/onError. This change adds the private typed handoff through
CoreImage without expanding public UI ImageProps. The adapter requires separate
UI and renderer event capabilities before loading; the private helper is now
withAppKitImageRequest, with no compatibility alias. No dependency or manifest
changed. Header/configuration/decode bounds/failureImage/progressive/fade remain
gaps; this is not the mobile engine.

The renderer records disk/network/local origin and distinguishes decoded-memory
hits. It queues terminal delivery after assignment, claims notification before
metadata/consumer reentry, then reads the current handler in the owning root's
discrete event scope. Request generation, host view/node and root are checked
again inside that scope. Replaced sources/modes and teardown retire notifications;
adding handlers after completion does not replay. Callback exceptions are logged
separately, never converted into image failures. Generic errors omit URI and
native NSError details. Empty sources and placeholder images emit no events.

Source review also found placeholder-only changes participating in request
identity. They now preserve source/mode work, repaint current pending/failure
chrome, and cannot cover success or retry/replay a terminal event. Placeholder
paint failure is isolated from the actual source request. This was a source
finding, not an observed native failure.

Dimensions are the largest positive reported NSImage representation in pixels,
or 0×0 for unknown/vector metadata; logical NSImage.size points are never used.
Apple documents [pixelsWide](https://developer.apple.com/documentation/appkit/nsimagerep/pixelswide)
and [pixelsHigh](https://developer.apple.com/documentation/appkit/nsimagerep/pixelshigh)
as device units. Representation metadata does not prove which bitmap was drawn.
The origin describes the request's serving path, not live cache presence.
Successful assignment is not native drawing or pixel qualification.

Fifteen cases were authored, all unrun: nine image-event lifecycle/reentry/error
cases, three pixel metadata cases, one root binding case, one adapter handshake
case and one CoreImage forwarding case. Existing byte expected values now include
origin. The target cached-image fixture records terminal events and dimensions;
the shared fixture still redirects AppKit because decode-transform cache probes
are unsupported. Package/renderer READMEs, components guide, primitive skill,
recipe AC8 and the unreleased image-cache note describe this subset.

Only source/semantic review, syntax parsing of eighteen TS/TSRX files and
whitespace checks ran. Exact deferred commands:

```sh
pnpm exec turbo run test --filter=@octane-xplat/macos-renderer --filter=@octane-xplat/image
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/image.macos.mobile.test.tsrx
pnpm exec turbo run typecheck --filter=...@octane-xplat/image --filter=...@octane-xplat/ui --filter=...@octane-xplat/macos-renderer
pnpm probe doctor
pnpm probe run examples/probes/cached-image.macos.tsrx --target macos --watch
pnpm exec turbo run build --filter=@xplat/macos
pnpm exec turbo run test:packed --filter=@octane-xplat/image --filter=@octane-xplat/macos-renderer
pnpm check:recipes
```

All remain deferred pending explicit human authorization for this task. No test,
typecheck/build/install, probe, native/OS/browser automation, packaging or visual
analysis ran. Actual native callback/queue/root-scope timing, metadata bridge,
image assignment/drawing, cancellation/reentry, bitmap retention, responsiveness,
layout/density and packed/mixed-version behavior remain unqualified. Source audit
snapshots and issue evidence gates remain unchanged; the persistent goal is active.


## AppKit multiline placeholder color

Continuing with everyday text fields after image callbacks, source review found
TextArea dropping its inherited placeholderTextColor prop. TextInput forwards it;
mobile/web TextArea already use it. Notes/composer entry in the maintained native
controlled-text fixture is the demand assumption. The AppKit renderer already
applies, updates, restores appearance and removes placeholderColor styles on its
NSTextView placeholder label. This change needs no renderer or host API addition.

The leaf now merges that prop as a default beneath authored styles using the
existing mergeStyle utility. Object/array/CSS-string styles retain their values;
an authored placeholderColor wins. Dropping the prop drops its override and lets
the current authored/cascade/native style apply. Text value, editing host and
composition ownership are unchanged. This is a small unreleased leaf omission;
no redundant implementation-mirroring test or release note was added. Existing
text-control suites remain unrun. Primitive guide/skill and text-entry recipe AC3
now cover the subset, and the maintained controlled-text fixture adds a manual
color toggle; its runner still only reads initial text metadata.

Only targeted source review, syntax parsing and whitespace checks ran. Graft and
sem did not index the TSRX TextAreaControl entity; the exact leaf span and existing
renderer style branches were reviewed directly. Deferred commands:

```sh
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/text-controls.macos.mobile.test.tsrx
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
pnpm probe doctor
pnpm probe run examples/probes/controlled-text.macos.tsrx --target macos --watch
pnpm exec turbo run build --filter=@xplat/macos
pnpm exec turbo run test:packed --filter=@octane-xplat/ui
pnpm check:recipes
```

All remain deferred until explicit human authorization for this task. No tests,
typechecks/builds/installs, native/OS/probe/browser automation, packaging or visual
analysis ran. Native placeholder paint/theme/removal, layout, editing/IME and
packaged behavior remain unqualified. Evidence gates and audit snapshots are
unchanged; the persistent goal remains active.

## AppKit current slider adjustment ownership

The ControlsDemo controlled volume slider and target price-range fixture make
ordinary settings adjustment the demand assumption. Source inspection found
retained thumb keyboard/accessibility callbacks capturing render-time value,
step, bounds, blocking and move callbacks. The parent move callback also lacked
an edit claim, allowing synchronous onValueChange reentry to issue duplicate
controlled requests. These are source findings, not observed OS input failures.

Thumb handlers now read current props, require their bound host, and reject
current disabled/read-only state. Retained disabled tap callbacks cannot take
focus; read-only thumbs remain focusable. Parent adjustments use current props,
limits and controlled state, require the bound track, and claim before state
writes or the app callback. Nested adjustments/pan events during that callback
are ignored. A finally block releases the claim even when the consumer throws;
the exception propagates. The pan helper already reads its current callback;
its additional bound-track/reentry guard makes retained work inert after teardown.
No new host selectors, dependencies, public props, loading-state semantics or
track-tap behavior were introduced. Dragging retains the existing delta contract.
Controlled drag-preview reconciliation with an unrelated external value update
is not addressed by this handler-ownership change and remains a follow-up.

Three cases are authored, all unrun: retained value/bounds/step/callback updates,
current blocking and ref detachment with focus exclusion, and controlled callback
reentry plus exception recovery. The slider suite now has ten source cases.
Guide/skill and appkit-slider AC2 describe the contract, and the target fixture
adds a manual range read-only toggle; its runner still checks initial metadata
only. This fixes an unreleased implementation omission; no release note added.

Only targeted source/semantic review, three-file TSRX syntax parsing and
whitespace checks ran. sem's static graph reported unresolved bare-name callers
for moveSlider; the exact leaf and test call sites were inspected directly.
Deferred commands:

```sh
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/slider.macos.mobile.test.tsrx
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
pnpm probe doctor
pnpm probe run examples/probes/slider.macos.tsrx --target macos --watch
pnpm exec turbo run build --filter=@xplat/macos
pnpm exec turbo run test:packed --filter=@octane-xplat/ui
pnpm check:recipes
```

All remain deferred pending explicit human authorization for this task. No test,
typecheck/build/install, probe, OS/native/browser automation, packaging or visual
analysis ran. Actual keyboard/pointer/VoiceOver dispatch, focus/ref timing, drag
ownership, layout/tooltips/pixels and packaged behavior remain unqualified.
Evidence gates and shared source-audit snapshots remain unchanged; goal active.


## AppKit controlled slider drag preview ownership

Continuing the ControlsDemo/price-range flow, source review confirmed the next
issue: preview validity used only bounds/step/shape. A different controlled value
could therefore remain covered by an earlier drag preview and the old gesture
could continue requesting deltas over it. The previous handler-ownership section
explicitly deferred this case; this change adds its source path. No runtime
failure has been observed.

Each preview now retains a specific private drag owner. That owner records the
normalized starting source, controlled mode and most recent requested value.
Current normalized parent values matching the starting source or latest request
count as feedback. A different value, controlled/uncontrolled transition,
bounds/step/shape change or blocking retires the owner during render, before an
obsolete preview can cover new state. Equal normalized writes cannot communicate
an explicit reset. Remaining moved/ended deltas cannot revive a retired session;
a new began event is required. Keyboard/accessibility adjustments end the drag
preview too. Owner identity checks keep old end cleanup from touching replacement
work. Passive effect cleanup no longer controls this source invalidation.

The request is recorded before state/app callbacks so synchronous matching
controlled feedback preserves the same delta gesture. Uncontrolled drags still
persist their internal value. The prior edit claim prevents nested gesture
starts during a change callback; exceptions retain the existing propagation.
No public API, renderer gesture protocol, dependency, loading semantics or
track-tap behavior changed. Three more cases are authored, all unrun: external
replacement retires deltas; matching echo continues while mode/limits/blocking
changes retire; keyboard adjustment retires preview. The slider suite now has
thirteen source cases. Guide/skill/recipe AC1 and target fixture reconcile this
contract. The fixture can schedule external range replacement while a human
drags; its runner still reads only initial metadata.

Only source/semantic review, syntax-only parsing of three TSRX files and
whitespace checks ran. Exact deferred commands:

```sh
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/slider.macos.mobile.test.tsrx
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
pnpm probe doctor
pnpm probe run examples/probes/slider.macos.tsrx --target macos --watch
pnpm exec turbo run build --filter=@xplat/macos
pnpm exec turbo run test:packed --filter=@octane-xplat/ui
pnpm check:recipes
```

All remain deferred pending explicit human authorization for this task. No test,
typecheck/build/install, probe, native/OS/browser automation, packaging or visual
analysis ran. Actual native pan/keyboard/VoiceOver timing, controlled feedback,
focus/ref lifetime, layout/tooltips/pixels and packaged behavior remain
unqualified. Audit snapshots and evidence gates remain unchanged; goal active.


## AppKit ProgressBar styles theme and state

ContentDisplayDemo's Upload progress and sandbox determinate/indeterminate
examples make basic loading status the demand assumption. Source inspection
found ProgressBar converting styles through styleRecord (dropping string/array
styles), reading system color once without a subscription/app override, and
calling the formatter despite isIndeterminate explicitly ignoring values. It
also dropped declared accessibility props and retained numeric unknown-mode
range metadata. These are source findings, not native observed failures.

The leaf now uses existing mergeStyle defaults under authored styles and the
existing useThemeScheme subscription, with no dependency or renderer changes.
Disabled opacity remains a default; authored styles win. accessible, hint and
determinate value override now reach the same progress owner. Disabled and
unknown-mode busy state are explicit; unknown numeric range/value are omitted.
Indeterminate mode does not invoke the formatter and still skips readout/marks.
Dropping props restores the existing defaults through complete-prop-bag updates.
The static 40% unknown fill remains a documented source limitation; no native
animation implementation or animation parity is claimed.

Four object-driver cases are authored, all unrun: style/ref/override removal,
unknown-mode formatter/value/marks transitions, accessibility override/removal,
and theme changes without parent-prop replacement. The new target fixture can
toggle known/unknown, inactive state and style form; its runner only records
that controls mounted. Guide/primitive skill and appkit-busy-feedback AC4 cover
the subset. This is an unreleased implementation omission; no release note added.

Only targeted source/semantic review, syntax parsing of three TSRX files and
whitespace checks ran. sem reports incomplete/unresolved ProgressBar callers;
actual AppKit leaf, shared props and demand example were inspected. Exact
deferred commands:

```sh
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/progress-bar.macos.mobile.test.tsrx
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
pnpm probe doctor
pnpm probe run examples/probes/progress-bar.macos.tsrx --target macos --watch
pnpm exec turbo run build --filter=@xplat/macos
pnpm exec turbo run test:packed --filter=@octane-xplat/ui
pnpm check:recipes
```

All remain deferred pending explicit human authorization for this task. No test,
typecheck/build/install, probe, native/OS/browser automation, packaging or visual
analysis ran. Actual theme subscription/native appearance, AX numeric-removal
and busy/disabled interpretation, ref timing, layout/marks, contrast/pixels and
packaging remain unqualified. Shared audit snapshots and issue evidence gates
remain unchanged; the persistent goal stays active.


## AppKit Meter entrypoint consolidation

Progress status source review found root Meter and ProgressGroup importing a
second implementation in macos-extras while purpose imports selected Meter.macos.
Both used the shared range helper, but root kept an unfilled track and caller
children while the purpose leaf substituted a text summary and dropped children.
Root also dropped string/array styles. Consolidating the entry prerequisite is
necessary before future measured-gauge work; ProgressGroup's CPU/memory example
provides the everyday status-flow assumption. No native discrepancy was observed.

Meter.macos is now the single implementation. The root and ProgressGroup import
it directly; the existing macos-extras barrel re-exports that same named function
rather than retaining another implementation. Heading is unchanged. The selected
leaf preserves the existing root track/children behavior, merges authored styles
under the standard override contract, and uses meterRange's normalized minimum
alongside its maximum/value. Size defaults to 24 when nonfinite/nonpositive;
nonfinite stroke width uses 3 and finite width clamps to [0,size]. No dependency,
shared manifest, public prop or renderer change. A measured arc and color are
still unimplemented; no filled ring, pixel parity or native AX support is claimed.

Four source cases are authored, all unrun: barrel identity/children, normalized
finite bounds and maxValue precedence, style forms/finite geometry/removal, and
ProgressGroup wiring. The existing progress target fixture now mounts root Meter
and ProgressGroup as well. Guide/skill/recipe AC5 reconcile the subset. These
repairs concern unreleased target leaves; no release note added.

Only source/semantic review, syntax parsing (five TSRX files plus the target TS
barrel) and whitespace checks ran. Static graph callers were incomplete; actual
root and ProgressGroup imports were inspected directly. Exact deferred commands:

```sh
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/meter.macos.mobile.test.tsrx src/progress-bar.macos.mobile.test.tsrx
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
pnpm probe doctor
pnpm probe run examples/probes/progress-bar.macos.tsrx --target macos --watch
pnpm exec turbo run build --filter=@xplat/macos
pnpm exec turbo run test:packed --filter=@octane-xplat/ui
pnpm check:recipes
```

All remain deferred pending explicit human authorization for this task. No tests,
typechecks/builds/installs, probes, native/OS/browser automation, packaging or
visual analysis ran. Native range normalization/AX, ring/child layout, style
mutation, shape clipping and root/purpose packed resolution remain unqualified.
Evidence gates and audit snapshots remain unchanged; persistent goal active.

## AppKit inline style normalization and text entrypoints

ContentDisplayDemo headings and the framework's shared Text host make ordinary
text styling a high-demand gap. Source review found Text and duplicate Heading
leaves dropping string/array styles through styleRecord; RichText/Span did too. Root/purpose Heading selected separate
implementations. The entrypoints now use one Heading.macos leaf, with the existing
macos-extras barrel re-exporting the same named function. Text/Heading merge
style defaults under authored values; rich hosts/spans forward them intact.
No public API, dependency or shared manifest changed.

Crucially, further source review found renderer validation rejecting style
strings before native allocation. Earlier progress/control/field forwarding
repairs were only source paths and did not establish native support. This change
supplies that missing prerequisite, rather than treating object-driver strings
as native evidence. normalizeHostStyleProps now runs in native validation,
makeNode and applyProps, covering batch create/recreate/update and direct
list-template creation. It snapshots string/array props without modifying the
app's bag; existing objects/unset styles retain their contract.

The css-engine adds a small opt-in normalizeInlineStyle export over its existing
CSS-tree dependency and cssValueToStyle converter. No GTK consumer changes.
Declaration-list parsing preserves quotes/delimiters, duplicate last-write order
and custom-property case, maps ordinary names to camelCase, and converts numeric
px/dip/pt values to native numbers. Arrays fold in order; prototype-like keys
become own data fields. Invalid lists/rules/primitives fail before native work.
!important has no separate priority, matching the native cascade. This parser
does not add new properties/units, shorthand expansion or inline variable behavior.
The native formatted-run validator still rejects invalid numeric attributes after
normalization. Existing source-slice fixtures receive the real normalizer rather
than an identity stub; tests remain unrun.

Ten cases are authored, all unrun: four CSS parser cases, two host/validation
cases and four Text/Heading/rich forwarding cases. UI cases use the object driver;
one host case evaluates the real formatted-node validation source. They do not
prove actual native mutation or glyphs. New target fixture switches style forms,
size and removal; its runner records mounting only. Renderer README, component
guide, primitive/styling skill references and appkit-text-styles recipe cover
this source subset. Existing typography/default/maxLines props are preserved;
heading-level native AX mapping is not added or inferred from the role.
These repair unreleased gaps; no release note added.

Only source/semantic review, TS/TSRX syntax parsing and whitespace checks ran.
Static caller graphs were incomplete; actual root/barrel/leaf/driver call sites
were inspected directly. Exact deferred commands:

```sh
pnpm exec turbo run test --filter=@octane-xplat/css-engine --filter=@octane-xplat/macos-renderer
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/text-style.macos.mobile.test.tsrx src/progress-bar.macos.mobile.test.tsrx src/meter.macos.mobile.test.tsrx
pnpm exec turbo run typecheck --filter=...@octane-xplat/css-engine --filter=...@octane-xplat/macos-renderer --filter=...@octane-xplat/ui
pnpm probe doctor
pnpm probe run examples/probes/text-styles.macos.tsrx --target macos --watch
pnpm exec turbo run build --filter=@xplat/macos
pnpm exec turbo run test:packed --filter=@octane-xplat/ui --filter=@octane-xplat/macos-renderer
pnpm check:recipes
```

All remain deferred pending explicit human authorization for this task. No tests,
typechecks/builds/installs, probes, native/OS/browser automation, packaging or
visual analysis ran. Actual parser bundle/resolution, batch/validation atomicity,
native style update/removal, native font/glyph/layout/truncation/AX, performance
and packed consumers remain unqualified. Audit snapshots and evidence gates
remain unchanged; persistent goal active.

## AppKit busy animation source and reduced motion refresh

Saving switches, uploads and the ControlsDemo spinner make visible busy feedback
a common flow. Source review found the renderer already samples/plays matched
keyframes on a shared 16 ms timer, including percentage translations and subtree
stop/overlay restoration. Older README/leaf comments saying keyframes never play
were stale. However, token rotation/slide rules were web-only and ProgressBar
never selected its indeterminate class. Source presence is not native proof.

The existing @platform macos token block now has uniquely named ring-rotation
and progress-slide tracks. Spinner classes already select the ring rule;
ProgressBar now selects/removes the unknown-mode class and clips the translated
40% fill to its track. AppKit compound selectors outrank a later generic spinner
rule so reduced-motion cancellation still wins across token/chrome ordering.
Reduced-motion media rules leave the ring/fill steady.
No new animation engine, dependency, component public API or manifest changed.
GTK leaves and consumers are unchanged; the reset correction below is shared.

Prerequisite: css-engine accumulates parsed animations per matched ruleset.
An animation:none rule previously added no track but failed to retire earlier
ones. Explicit animation:none/animation-name:none now clears earlier accumulated
tracks and earlier declarations in the same ruleset; a later animation may start
again. Other native per-ruleset accumulation remains, rather than claiming full
browser shorthand/longhand/list cascade parity. This is a local correction to
the engine's NativeScript-9.1.3-style port; source evidence is cascade.ts and the
keyframes.ts per-ruleset parser comments. Upstream runtime was not tested and no
upstream runtime bug is asserted. Revisit the local reset when upgrading the port.

Live preference prerequisite: one renderer-process observer registers on
NSWorkspace.sharedWorkspace.notificationCenter, using the main operation queue.
Apple's [display-option notification contract](https://developer.apple.com/documentation/appkit/nsworkspace/accessibilitydisplayoptionsdidchangenotification)
requires the workspace center. A notification with live roots queues the existing
coalesced media refresh; changed queries restyle/cancel old tracks. Registration
failures do not claim installation and a later root can retry. The observer token
is retained for the loaded renderer process, matching the existing resize-observer
lifetime; it does not allocate a new per-control observer. Actual native selector,
BOOL getter, notification delivery and main-queue behavior remain unqualified.

Seven cases are authored, all unrun: one explicit reset/cascade case, two token
rule/sampler/reduced-environment cases, one real playback-source/stop/timer case,
two observer-source cases and one added ProgressBar class/clipping case. The
playback source case manually invokes a fake timer; it is not native timing or
frame-pacing evidence. CSS cases extract the AppKit source region, so they do not
prove CLI @platform/web-only preprocessing or packed stylesheet inclusion.
The target progress fixture now includes Spinner and manual reduced-motion copy;
its runner still records mounting only. Guide, skill, renderer README and busy
recipe AC3/AC4 and unreleased busy-feedback note supersede earlier static-source
claims while preserving native gates.

Only source/semantic review, TS/TSRX/CSS syntax parsing and whitespace checks ran.
Exact deferred commands:

```sh
pnpm exec turbo run test --filter=@octane-xplat/css-engine --filter=@octane-xplat/macos-renderer
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/progress-bar.macos.mobile.test.tsrx src/activity-indicator.macos.mobile.test.tsrx
pnpm exec turbo run typecheck --filter=...@octane-xplat/css-engine --filter=...@octane-xplat/macos-renderer --filter=...@octane-xplat/ui
pnpm probe doctor
pnpm probe run examples/probes/progress-bar.macos.tsrx --target macos --watch
pnpm exec turbo run build --filter=@xplat/macos
pnpm exec turbo run test:packed --filter=@octane-xplat/ui --filter=@octane-xplat/macos-renderer
pnpm check:recipes
```

All remain deferred pending explicit human authorization for this task. No test,
typecheck/build/install, probe, native/OS/browser automation, packaging or visual
analysis ran. Actual native animation/overlay cleanup, clipping/rotation/pixels,
reduced-motion preference/notification delivery, responsiveness/power/frame pacing,
compiler/bundle and packed consumers remain unqualified. Audit snapshots and
issue evidence gates remain unchanged; persistent goal active.

## AppKit readable text composition and purpose entry

The maintained RichTextDemo uses RichTextSpan.text for all its visible runs;
the AppKit leaf previously ignored that prop, making those runs empty. Plain
nested Text also produced another native label under its text parent, rather
than a logical run. The RichText purpose entry lacked a macOS leaf and selected
the generic native adapter with NativeScript-specific escape props/onLinkTap.
These are common content-flow source gaps, not observed native failures.

A private AppKit text-owner context now lets root Text/RichText/Heading provide
one owner while nested Text/RichText emit logical spans. Provider components
add no native view. Typography/styles inherit through the existing formatted
renderer; root contexts do not leak into sibling Text. RichTextSpan now forwards
its text prop and suppresses children when that prop is set, including an empty
string. Unset/null text retains children, including nested styled runs. The new
RichText.macos purpose leaf re-exports the same root implementations, avoiding
foreign adapter selection. No manifest/dependency/public API or renderer change.

Top-level Text and RichText now apply existing layoutChildProps rather than
dropping parent grid/flex/absolute metadata. Capped Text supplies flexShrink:1
under authored overrides so it can truncate in a row; outer hosts own maxLines
and layout. Logical inner runs have no separate layout box/line cap. RichText's
normalization class is retained. This does not implement per-span onPress or
native glyph hit testing: the maintained demo's tappable flow remains incomplete,
even when its readable content now has a source path. No link/OS-input proof is
inferred from formatting or one text-owner context.

Four object-driver cases are authored, all unrun: root/purpose identity and
explicit/empty/fallback text; nested logical owner/run updates; Heading scope
without sibling leakage; root layout/removal and outer Text caps/shrink. The
target style fixture now includes nested Text, explicit rich text and fallback
content; its runner still records mounting only. Guide/skill/appkit-text-styles
AC4 and the unreleased feature note describe the readable subset and press gap.

Only source/semantic review, six-file TSRX syntax parsing and whitespace checks
ran. Static call graphs were incomplete; actual demand demo, purpose/root leaves,
layout helper and renderer formatted-run/nesting paths were inspected. Exact
deferred commands:

```sh
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/text-composition.macos.mobile.test.tsrx src/text-style.macos.mobile.test.tsrx
pnpm exec turbo run test --filter=@octane-xplat/macos-renderer
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
pnpm probe doctor
pnpm probe run examples/probes/text-styles.macos.tsrx --target macos --watch
pnpm exec turbo run build --filter=@xplat/macos
pnpm exec turbo run test:packed --filter=@octane-xplat/ui
pnpm check:recipes
```

All remain deferred pending explicit human authorization for this task. No tests,
typechecks/builds/installs, probes, native/OS/browser automation, packaging or
visual analysis ran. Actual context/compiler/driver ownership, run shaping and
measurement, parent layout/truncation/AX, rich-span input and root/purpose packed
resolution remain unqualified. Audit snapshots and evidence gates are unchanged;
persistent goal active.

## AppKit readable text accessibility descriptions

Ordinary count/status text commonly needs a meaningful description and an
explicit accessible owner. Source review found Text dropping its declared testID,
accessible, accessibilityHint and accessibilityValue props; native label/htmlview
accessibility handling only applied the name. This was a source finding, not an
observed VoiceOver failure. Prior composition changes did not establish metadata
support merely by retaining one outer text host.

Outer Text now forwards those declared fields. The renderer applies accessible
through setAccessibilityElement, hint through accessibilityHelp, and portable
value through accessibilityValueDescription. Apple's [help contract](https://developer.apple.com/documentation/appkit/nsaccessibility-c.protocol/accessibilityhelp)
and [value-description contract](https://developer.apple.com/documentation/appkit/nsaccessibility-c.protocol/accessibilityvaluedescription)
support these properties; the latter supplies a human-readable description of
an existing value. This mapping deliberately keeps static text's native value
connected to visible contents rather than changing stringValue. Empty strings
remain explicit; unset/null clears descriptions to nil. Removing accessible
restores participation, consistent with the existing editable-text handling.
No new public API, dependency, manifest or host class was introduced.

This is the readable-label/htmlview subset. Arbitrary Text state/live-region
announcements and heading-role/level mapping are still gaps; no new inner-run
native owner or per-span action exists. Two cases are authored, all unrun: one
UI identity/description/visibility forwarding/removal case and one real renderer
function slice applying/resetting label/htmlview properties while visible text
stays unchanged. The fixture adds description/AX-visibility toggles, but its
runner still records mounting only. Guide/skill/renderer README and recipe AC5
cover this subset. These repair an unreleased omission; no release note added.

Only source/semantic review, TS/TSRX syntax parsing and whitespace checks ran.
Exact deferred commands:

```sh
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/text-composition.macos.mobile.test.tsrx src/text-style.macos.mobile.test.tsrx
pnpm exec turbo run test --filter=@octane-xplat/macos-renderer
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui --filter=...@octane-xplat/macos-renderer
pnpm probe doctor
pnpm probe run examples/probes/text-styles.macos.tsrx --target macos --watch
pnpm exec turbo run build --filter=@xplat/macos
pnpm exec turbo run test:packed --filter=@octane-xplat/ui --filter=@octane-xplat/macos-renderer
pnpm check:recipes
```

All remain deferred pending explicit human authorization for this task. No tests,
typechecks/builds/installs, probes, native/OS/browser automation, packaging or
visual analysis ran. Actual native property/BOOL bridge behavior, static-text
value-description interpretation, VoiceOver/hierarchy/navigation, metadata
update/removal, testID/native identity and packed consumers remain unqualified.
Audit snapshots and evidence gates remain unchanged; persistent goal active.

## AppKit AVPlayerLayer video source path

Demand assumption: ordinary embedded clips and the maintained VideoDemo's
play/pause, mute, poster, time and seek controls have broader application demand
than advanced media integrations. The audit-era AppKit Video leaf was still a
placeholder. This source change replaces it with a package-owned NSView and
AVPlayerLayer plus the existing shared transport; Lightbox video is separate.
It adds no external dependency and changes no CLI or other target renderer.

The package includes platforms/macos/src/XplatVideoView.swift, Swift AppKit
header configuration and AppKit/AVFoundation/CoreMedia/QuartzCore frameworks,
using the existing package-native collector. A native rebuild is required;
missing XplatVideoView fails explicitly before mounting. Source accepts empty
idle input, HTTP(S), absolute paths/file URLs and ~/ bundle-resource paths.
Each attempt owns a fresh AVPlayer, item, layer association and notifications.
Source replacement/disposal removes notifications, cancels pending seeks and
releases player items. Detaching a previously attached view pauses playback.
Native notifications use the main queue; seek completions additionally guard
source/item identity, seek revision and current playback command before resume.

AVPlayerLayer [videoGravity](https://developer.apple.com/documentation/avfoundation/avplayerlayer/videogravity)
maps contain/cover/fill to resizeAspect/resizeAspectFill/resize. AVPlayerItem
[end](https://developer.apple.com/documentation/avfoundation/avplayeritem/didplaytoendtimenotification)
and [failure](https://developer.apple.com/documentation/avfoundation/avplayeritem/failedtoplaytoendtimenotification)
notifications inform the native snapshot. These API references support source
choices, not native execution evidence. No source URL or NSError detail crosses
the public error callback; it receives a generic failure message.

The pure TypeScript owner guards source generations, current native identity,
timers, queued terminal events and current handlers. It separates consumer
callback exceptions from playback errors. Unchanged renders do not schedule
polling or retry failed sources; explicit play retries. A stable handle becomes
inert on disposal, reads time/duration in milliseconds, and keeps the last finite
pre-ready seek. Metadata readiness fires once per attempt; playing callbacks
report requested transport intent rather than decoded frames or buffering.
Polling runs at 250 ms while loading/playing/seeking and at 1000 ms for paused
ready surfaces only with an error callback installed. Other paused surfaces stop
polling. Loop suppresses the terminal callback. Shared chrome/poster, bounded
surface layout, fit, mute/loop/playing prop changes and the native handle are
wired in source; actual behavior remains unqualified.

Nine owner cases are authored but UNRUN: flags-before-load/readiness/idempotent
sync, polling/transport, callback source replacement, latest handlers and consumer
exceptions, one failure plus explicit retry, pre-ready seek/mute/prop changes,
retired timers/disposal, replay/cleanup reentry, and opt-in paused error polling.
The manual fixture starts idle and requires an entered source before loading;
its runner records mounting only. Packed-consumer assertions now require the
Swift source and framework/header configuration in the archive. Packing itself
has not run, and those assertions do not compile or discover the native class.

Package README, primitive guide/limits, Octane skill reference, recipe AC1–AC4
and a feature note describe this experimental subset and its qualification
boundary. The new typecheck script covers the pure AppKit owner/public types;
it does not check TSRX or Swift. Syntax-only TS/TSRX/JS/JSON parsing and whitespace
checks passed; no source, test, fixture or native code was executed by those
checks. Source/semantic review also ran, including structural Swift entity
inspection; no Swift compiler check ran.

Exact deferred commands:

```sh
pnpm exec turbo run test --filter=@octane-xplat/video
pnpm exec turbo run typecheck --filter=...@octane-xplat/video
pnpm probe doctor
pnpm probe run examples/probes/video.macos.tsrx --target macos --watch
pnpm exec turbo run build --filter=@xplat/macos
pnpm exec turbo run test:packed --filter=@octane-xplat/video
pnpm check:recipes
```

All remain deferred pending explicit human authorization for this task. No tests,
typechecks/builds/installs, probes, native/OS/browser automation, packaging or
visual analysis ran. Native collector/class discovery, Swift compilation/bridge
selectors, decoding/actual frame and audio output, sandbox/network policy,
notification/thread behavior, seek/loop/detach, poster/fit/resize/hit testing,
keyboard/AX, memory/power and clean packaged consumers remain unqualified.
DRM, subtitles, background playback and full streaming support are not established.
Audit snapshots and all evidence gates remain unchanged; persistent goal active.


### Explicit private Swift transport state

Follow-up source review found the private muted/looping stored-property setter
names overlapping the intentionally exposed setMuted:/setLooping: bridge methods
under @objcMembers. Both stored properties now explicitly use @nonobjc, keeping
only the command methods eligible for Objective-C export. This avoids relying
on inference for these state slots. Swift's [attribute reference](https://docs.swift.org/swift-book/ReferenceManual/Attributes.html)
documents @objcMembers inference and @nonobjc exclusion. This is a source-level
interop precaution, not a reproduced compiler failure or compiler pass. Only
source/semantic and whitespace review ran. The exact Video deferred commands
above and every native/packaged qualification limitation remain unchanged.

## AppKit Heading role level and current title

Demand assumption: section titles in ContentDisplayDemo, Outline, Markdown and
ordinary content/settings screens need useful heading metadata before niche
visual work. Current source review found Heading emitting accessibilityRole but
the readable renderer ignoring it, and the declared level never reaching native
metadata. This is source evidence, not an observed VoiceOver failure.

Heading now emits accessibilityHeadingLevel separately from its display type.
The macos-only JSX label declares levels 1–6; shared/native/GTK declarations and
public HeadingProps remain unchanged. A small renderer helper owns captured
native role/title/value metadata in a WeakMap. The heading role maps to AXHeading,
its numeric level to accessibilityValue, and current visible contents to
accessibilityTitle. Missing/invalid raw host levels default to 2. The helper
never writes stringValue or attributedStringValue. Plain, decorated and composed
rich-text writers refresh the title on the existing owner. Removing the role
restores captured role/title; an originally text-following value follows the
current text on restoration, while custom original values remain intact.

Apple documents the [heading role](https://developer.apple.com/documentation/appkit/nsaccessibility-swift.struct/role/headingrole).
The [Core AAM 1.2 candidate draft's heading mapping](https://www.w3.org/TR/2026/CRD-core-aam-1.2-20261021/#role-map-heading)
and [heading-level mapping](https://www.w3.org/TR/2026/CRD-core-aam-1.2-20261021/#ariaLevelHeading)
specify AXHeading and AXValue respectively. These inform the native field
mapping; they are not proof of this framework's native setters or VoiceOver.
No native subclass, external dependency or framework/build configuration was
added. A separate native owner for each inline run and arbitrary Text role/state
or live announcements remain outside this change.

Four renderer cases are authored but UNRUN: levels/default/visible-content
preservation, metadata restoration/current text/custom values, real dispatcher
role/level/removal, and real plain/decorated/rich writer title refresh. The UI
Heading root/purpose case now checks level forwarding/update on the same host.
Packed JSX macos positive/range assertions are authored but UNRUN; they do not
establish packed runtime behavior. The idle manual fixture cycles heading levels
and changes nested text; its runner records mounting only. Guide, skill,
renderer/JSX READMEs, recipe AC6 and feature note describe the implementation and
qualification boundary. Recipe coverage and execution verification stay separate.

Source/semantic review, eight-file TS/TSRX/JS syntax parsing and whitespace
checks passed. No tests, typechecks, builds, native/OS/browser automation,
probes, packing, dependency installs or visual analysis ran. Exact deferred
commands:

```sh
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/text-style.macos.mobile.test.tsrx src/text-composition.macos.mobile.test.tsrx
pnpm exec turbo run test --filter=@octane-xplat/macos-renderer
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui --filter=...@octane-xplat/macos-renderer --filter=...@octane-xplat/jsx
pnpm probe doctor
pnpm probe run examples/probes/text-styles.macos.tsrx --target macos --watch
pnpm exec turbo run build --filter=@xplat/macos
pnpm exec turbo run test:packed --filter=@octane-xplat/ui --filter=@octane-xplat/macos-renderer --filter=@octane-xplat/jsx
pnpm check:recipes
```

All remain deferred pending explicit human authorization for this task. Actual
native role/title/value setters and NSNumber bridging, title/level change and
removal behavior, heading navigation/announcements/hierarchy, rich text shaping,
layout/truncation and clean root/purpose/conditioned packed consumers remain
unqualified. Audit snapshots and evidence-gated checkboxes are unchanged;
persistent goal active.

## AppKit scroll viewport metadata

Demand assumption: the bounded list/form/content viewports in Todo,
ScrollBoxDemo, Markdown and ordinary settings screens need names, descriptions
and test identity before advanced scroll effects. Current source showed the
AppKit ScrollableArea leaf forwarding its name but dropping declared testID,
accessible, hint and value. The native scrollview branch applied the name only.
This was a source mismatch, not an observed VoiceOver or OS-scrolling failure.

ScrollableArea now forwards those existing fields, retaining accessibilityLabel
precedence over label. The renderer routes scrollview accessible/accessibility
props to its existing native description mapping: hint becomes accessibilityHelp,
portable value becomes accessibilityValueDescription and accessible controls
element participation. Explicit empty strings remain; unset/null clears help
and value descriptions, and removing accessible restores participation. This
leaves the native scroll role/value, document and clip position intact. TestID
uses the existing common native accessibilityIdentifier path. The native name
setter already existed and is retained. No public types, dependency, manifest,
native class or other target leaf changed. Arbitrary scroll roles/state/live
announcements and pull-to-refresh remain separate gaps.

Two cases are authored but UNRUN: UI current-host forwarding/name fallback and
removal, and the actual renderer scroll prop branch plus actual accessibility
function applying/resetting metadata while native role/value/content/geometry
stay unchanged. The new manual fixture toggles descriptions/visibility and
renames a bounded viewport; its runner records mounting only. Guide, skill,
renderer README and logical-scroll recipe AC4 describe this subset separately
from native qualification. This repairs an unreleased AppKit omission; no
release note is added.

Source/semantic review, five-file TS/TSRX syntax parsing and whitespace checks
passed. Exact deferred commands:

```sh
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/scrollable-area-appkit.mobile.test.tsrx src/appkit-scroll-geometry.mobile.test.ts
pnpm exec turbo run test --filter=@octane-xplat/macos-renderer
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui --filter=...@octane-xplat/macos-renderer
pnpm probe doctor
pnpm probe run examples/probes/scroll-metadata.macos.tsrx --target macos --watch
pnpm exec turbo run build --filter=@xplat/macos
pnpm exec turbo run test:packed --filter=@octane-xplat/ui --filter=@octane-xplat/macos-renderer
pnpm check:recipes
```

All remain deferred pending explicit human authorization for this task. No tests,
typechecks/builds/installs, probes, native/OS/browser automation, packaging or
visual analysis ran. Actual native property/BOOL behavior, VoiceOver viewport
and descendant hierarchy/navigation, metadata update/removal, native test
identity, sustained scrolling/elasticity and clean packed consumers remain
unqualified. Audit snapshots and all evidence gates are unchanged; goal active.


### Scroll mapping edit correction

The post-commit semantic diff exposed a misplaced first-match condition edit in
resetStyle instead of applyAccessibility. A follow-up restores the original
style-reset condition and includes scrollview in the actual native description
branch. The scroll prop dispatch now reaches that branch as intended. This was
caught by source/diff review; the authored source case has not run and no test
pass is claimed. Final targeted TS syntax and whitespace checks passed; every
deferred command and native qualification limit above still applies.

## AppKit renderer-backed Outline snapshots

Demand assumption: automatic tables of contents for document/content screens
are more useful than niche native integrations. ContentDisplayDemo already
uses portable Markdown-derived items; native-view discovery was explicitly
unsupported. The new Heading role/level source path makes a renderer-owned
snapshot feasible. Portable document data and explicit items remain supported;
this change does not implement Outline scrolling or scroll spy.

The renderer now publishes a private readOutlineHeadings bridge. It traverses
native subviews in order, including NSArray count/objectAtIndex collections,
and recognizes only renderer-owned label headings whose current native view
matches the node. It reads the actual current stringValue for plain/composed
rich text plus authored ID and semantic level. Blank headings, foreign native
roles and replaced views are ignored; a visited set prevents repeated/cyclic
visits, and each heading remains one owner. Reading neither scrolls nor focuses.
No native subclass, dependency, CLI or other target implementation changes.

ui/macos reports snapshot capability only when that bridge method is installed;
older/missing hosts retain unsupported mode. The hook accepts native roots,
ref-style objects and portable ScrollableArea handles. It snapshots once per
actual root/reader and only publishes a changed array, avoiding a render loop.
A render exposing a new root/reader recollects; a null root clears. Same-root
heading mutations are intentionally not observed. Unnamed headings get unique
slugs avoiding authored IDs; duplicate authored IDs keep the first item.
Generated IDs are snapshot data and are not written onto native views. Failed
reads do not overwrite the previous successful snapshot cache.

Six cases are authored but UNRUN: two renderer cases cover native collections,
current rich/plain strings, metadata/default level, foreign/replaced/blank views
and repeat/cycle handling; three UI cases cover capability presence, input
unwrapping and stable snapshots/root/reader/ID collisions; one mounted hook case
covers same-root rerenders, root replacement and null clearing. The manual
fixture displays snapshot items from a bounded Heading subtree and explicitly
disables click scrolling; its runner records mounting only. Guide/limits,
public comment, skill, renderer README, display-content recipe AC3/AC5 and
feature note reconcile the new conditional snapshot subset. ContentDisplayDemo
remains the portable document-derived composition; it does not prove discovery.

Source/semantic review, ten-file TS/TSRX syntax parsing and whitespace checks
passed. Exact deferred commands:

```sh
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/outline-view.macos.test.ts src/outline-view.macos.mobile.test.tsrx
pnpm exec turbo run test --filter=@octane-xplat/macos-renderer
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui --filter=...@octane-xplat/macos-renderer
pnpm probe doctor
pnpm probe run examples/probes/outline-snapshot.macos.tsrx --target macos --watch
pnpm exec turbo run build --filter=@xplat/macos
pnpm exec turbo run test:packed --filter=@octane-xplat/ui --filter=@octane-xplat/macos-renderer
pnpm check:recipes
```

All remain deferred pending explicit human authorization for this task. No tests,
typechecks/builds/installs, probes, native/OS/browser automation, packaging or
visual analysis ran. Actual native collection/wrapper identity and tree ordering,
ref/effect attachment timing, rich contents/levels, renderer bridge/subpath
availability and clean packaged consumers remain unqualified. Method presence
is not a native discovery pass. Outline click-to-heading scrolling, scroll spy,
OS input and VoiceOver remain separate gates/gaps. Source audit snapshots and
all checkboxes are unchanged; persistent goal active.

## AppKit Outline heading navigation and scroll spy

The prior turn made native heading snapshots possible but left ordinary outline
activation inert. Demand assumption: navigating a document's current headings
and tracking the reader's scroll position completes a more common content flow
than adding niche integrations. Current source confirmed Outline only changing
selection and immediately firing callbacks, despite available native scrolling.

Private heading records now additionally carry the current native view target.
Public snapshot items still contain only id/label/level. Discovery and navigation
share one ID allocator, so generated IDs avoid authored IDs consistently without
writing IDs onto views. Navigation queries current records rather than retaining
old heading views. Explicit IDs remain preferable when text changes after a
snapshot. Missing target records on older hosts do not invent a target.

The AppKit Outline leaf now owns a controller reading current props, root and
active selection. Explicit scrollContainerRef uses its current native viewport;
otherwise navigation finds the nearest native scroll ancestor. Current clip/
document geometry computes heading tops in either document orientation. Native
seeks use the existing clamped AppKit offset helper, subtract the header offset,
and request immediate movement under reduced motion. Hidden, detached,
foreign-window, invalid or nested-scroll targets are rejected. Controlled
activeId disables scroll spy; hasScrollOnClick=false retains selection and
balanced callbacks without scrolling. Active rows forward selected metadata.

Bounds/frame/window notifications maintain binding and uncontrolled spy. Window
updates from unrelated windows are ignored. The spy picks the last current item
above the scroll position plus header offset and the existing 8-point edge.
Navigation attempts suppress spy until completion. Current handlers receive one
start/end pair, including reentrant replacement, removed items, live-scroll
interruption and disposal. Bounds changes reset a 150 ms quiet timer; that timer
also serves as a fallback without native notification delivery. This does not
prove actual AppKit animation completion. Stale timers/observer callbacks lose
ownership, cleanup removes all owned observers, and consumer callback failures
are reported separately. Shared notification-posting flags are enabled without
turning off another reader's posting. No dependency, manifest, CLI or other
target leaf changed.

Seven cases are authored but UNRUN: six controller cases cover both coordinate
orientations/generated targets/header offset, live spy/controlled mode/explicit
handle resolution, reduced motion/opt-out/invalid targets, interruption/current
callbacks/retired timers and observer detachment, reentrant navigation, and
start-time disposal with inert late work. One mounted Outline case covers
current handlers, native seek wiring, selected metadata and teardown. Existing
renderer cases now assert the private native targets. The expanded manual
fixture adds scroll room, selection/seek/header controls and a bounded event log;
its runner still records mounting only. Guide/skill/recipe AC6/renderer README
and feature notes reconcile source navigation with pending native qualification.

Source/semantic review, nine-file TS/TSRX syntax parsing and whitespace checks
passed. Exact deferred commands:

```sh
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/outline-scroll.macos.test.ts src/outline-navigation.macos.mobile.test.tsrx src/outline-view.macos.test.ts src/outline-view.macos.mobile.test.tsrx
pnpm exec turbo run test --filter=@octane-xplat/macos-renderer
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui --filter=...@octane-xplat/macos-renderer
pnpm probe doctor
pnpm probe run examples/probes/outline-snapshot.macos.tsrx --target macos --watch
pnpm exec turbo run build --filter=@xplat/macos
pnpm exec turbo run test:packed --filter=@octane-xplat/ui --filter=@octane-xplat/macos-renderer
pnpm check:recipes
```

All remain deferred pending explicit human authorization for this task. No tests,
typechecks/builds/installs, probes, native/OS/browser automation, packaging or
visual analysis ran. Actual native target identity/ordering, coordinate conversion,
ref/window attachment, seek/clamp/reduced-motion/animation behavior, notification
and quiet timing, user interruption, scroll spy, cleanup, OS keyboard/hit testing,
VoiceOver state/navigation and clean packaged consumers remain unqualified.
Source implementations do not close these gates. Audit snapshots and checkboxes
remain unchanged; persistent goal active.

## AppKit Lightbox image zoom and swipe ownership

An embedded video source path now exists, but core Lightbox still
has no optional player handoff. Core UI importing the video leaf would introduce
a dependency cycle (the player composes UI). No engine cost or registry API is
added here; video/hasAutoPlay remain unsupported in native Lightbox. Demand
assumption: inspecting images and moving through a media gallery are common
flows that can use the existing native host before a new video integration seam.

Source review found existing AppKit pinch configuration (1×–4×) and pointer
swipe classification, but no Lightbox double-click or swipe handlers. The media
stage now has double-click and pointer-swipe handlers. A target-only controller
reads current panel props/refs: image double-click toggles 1×/2× at the current
clip center, media index/source/viewport/zoom-policy changes reset to 1×, and
hasZoom=false disables magnification. Programmatic zoom is immediate, avoiding
queued zoom animation crossing a media replacement. The stage is separate from
the toolbar and caption. Neither video fallback nor invalid/hidden/detached or
foreign-window viewports magnify. Swipe navigation clamps at gallery edges and
does not change selection while zoomed; actual native panning is unqualified.

A panel-owned optional local monitor handles recognized NSEvent Swipe events
only, with current native window and actual hit-test ownership inside the media
stage. It uses the content view's superview coordinates for hitTest, matching
the existing renderer primary-click algorithm. Horizontal discrete or ended
recognized gestures request current Previous/Next; vertical, cancelled,
incomplete, invalid, outside and foreign-window events pass through. Ordinary
scroll-wheel events are never monitored. A single item does not install a swipe
monitor. Source versions retire old callbacks after stage replacement/disposal,
and registration-time disposal removes the returned token. Consumer selection
faults are reported separately instead of escaping the native monitor. Current
props and bindings are read for every action; no new dependency, public type,
CLI, native class or shared gesture-engine behavior changed.

Apple's [trackpad event guide](https://developer.apple.com/library/archive/documentation/Cocoa/Conceptual/EventOverview/HandlingTouchEvents/HandlingTouchEvents.html)
distinguishes recognized Swipe events from scroll-wheel gestures and defines
positive deltaX as swipe-left. The installed SDK declares Swipe type 31/mask
2147483648 and [setMagnification:centeredAtPoint:](https://developer.apple.com/documentation/appkit/nsscrollview/setmagnification(_:centeredat:)?language=objc).
Its NSScrollView.h comment identifies content-view coordinates, supporting the
clip bounds origin plus half-size center calculation. These API/SDK reads are
source evidence, not native gesture/magnification proof.

Seven cases are authored but UNRUN: six policy cases cover center/toggle/reset,
pointer directions/bounds/zoom/visibility, recognized-event direction/phase and
window/hit filtering, monitor replacement/disposal, single/video/invalid geometry,
and consumer callback faults. One mounted panel case covers live zoom/swipe
wiring, media replacement, current callbacks and inert late handlers; it mocks
presentation, layer and buttons, so it does not qualify those host boundaries.
The manual fixture stays closed until sources are entered and explicitly opened;
its runner records controls mounting only. Guide/limits/skill/recipe AC13 and
feature note distinguish source paths from native qualification.

Source/semantic review, five-file TS/TSRX syntax parsing and whitespace checks
passed. Exact deferred commands:

```sh
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/lightbox-gestures.macos.test.ts src/lightbox-gestures.macos.mobile.test.tsrx
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
pnpm probe doctor
pnpm probe run examples/probes/lightbox-gestures.macos.tsrx --target macos --watch
pnpm exec turbo run build --filter=@xplat/macos
pnpm exec turbo run test:packed --filter=@octane-xplat/ui
pnpm check:recipes
```

All remain deferred pending explicit human authorization for this task. No tests,
typechecks/builds/installs, probes, native/OS/browser automation, packaging or
visual analysis ran. Actual native click/pinch/recognized-trackpad input,
recognizer/scroll arbitration, hit-test routing/occlusion, magnification and reset
coordinates, zoomed panning, controlled updates, monitor cleanup, focus/VoiceOver,
native presentation and clean packaged consumers remain unqualified. This does
not claim fluid two-finger scroll-wheel paging or system-gesture interception.
Lightbox video remains a source gap; audit snapshots and evidence checkboxes are
unchanged. Persistent goal active.


### Disabled Lightbox gesture bindings

Final source review additionally removes the double-click binding for disabled
zoom or video fallback and the pointer-swipe binding for a single-item gallery.
This lets the existing renderer disable those recognizers instead of relying
solely on handler guards. The mounted source case asserts binding removal and
an inert retained zoom handler. Targeted two-file TSRX syntax/whitespace review
passed; the case and all prior deferred checks remain unrun, with no new native
input or cleanup proof.

## AppKit owned in-app browser source path

Demand assumption: opening ordinary help/account/document links inside the app
is more useful than niche integrations after the core control/content work.
The repository exposes the optional browser service and an external URL-link
flow, but no existing browser demo was found. Current AppKit source only opened
another application and deliberately reported supported=false. This change
adds an owned browsing window; it does not replace the AppKit app backend with
a WebView shell or implement callback-based authentication.

The package now ships XplatInAppBrowser.swift plus AppKit/WebKit framework and
header configuration through the existing native-package collector. The public
JS leaf has no platform/NativeScript/Node runtime import. A create/accepts bridge
is required; supported checks its presence and missing/invalid/failed opens
cancel. Foundation validates HTTP(S)/host, removing the initial JS URL-global
prerequisite for packaged JavaScriptCore. This validation itself is unrun in
native code. JS tests use a simulated validator and do not prove Foundation's
URL handling. The prior macOS external-browser delegation is removed as an
explicit breaking cutover; platform.openUrl remains the external-launch API.

A pure JS owner serializes replacement/dismissal through revisions and retires
native candidates before cleanup can reenter. Only true/1 confirm native BOOL
success. Opened means presentation, not network load. Native Swift owns an
NSWindow/WKWebView with Back/Forward, Reload/Stop, address and Close controls.
It follows HTTP(S) navigation/redirects, keeps HTTP(S) new-window requests inside
the current window, permits about/data child documents, and cancels non-web app
schemes. Current view/navigation identity guards generic failure feedback;
NSError/source details do not enter logs/results. KVO chrome updates return to
the main queue and ignore replaced views. Close/user close release observations,
delegates, loading and content. Main-thread native open is required; close
marshals to the main queue before changing owned state. WebKit uses the app's
default data store, with no app-shell service script injection.

Mobile browser options and Android warmup hints remain platform specific. Web
dialog/download/upload/auth/permission UI is not implemented by this AppKit
service, and Safari-profile/session or OAuth interception is not promised.
Network, ATS and sandbox policy remain app-owned; no entitlements/ATS exceptions
were changed. [WKWebView](https://developer.apple.com/documentation/webkit/wkwebview)
is the rendering engine; AppKit header reads confirmed the control APIs used.
These source/SDK reads do not establish native behavior or OS-version support.

The AppKit harness now directly declares this package so native discovery can
include the Swift class. Only its workspace lock importer link was manually
updated; no dependency resolution/install ran. A scoped Turbo package task
orders existing app/CLI build prerequisites before the native packaging script,
with caching disabled; no root task/CLI or other target manifest changed.
[Package-level task configuration](https://turborepo.dev/docs/reference/package-configurations)
supports this arrangement, but the actual graph/task is unrun. The manual source
fixture lives under the declaring AppKit harness and stays idle until a URL is
entered and Open is pressed. Its runner records controls mounting only.

Five ownership cases are authored but UNRUN: capability/invalid URLs/no-op hints,
presentation/replacement/idempotent dismissal, accepted BOOL forms/failure cleanup,
reentrant old close and dismissal during open/recovery. Package README, navigation
guide, public comments, Octane service reference, a dedicated recipe and breaking
feature note reconcile the new source subset. Static TS/TSRX/JSON syntax and
lockfile YAML parsing plus source/semantic/whitespace review are the only checks.
Eight TS/TSRX/JSON files parsed. No Swift compiler or native code ran.

Exact deferred commands:

```sh
pnpm install --frozen-lockfile
pnpm exec turbo run test --filter=@octane-xplat/web-browser
pnpm exec turbo run typecheck --filter=...@octane-xplat/web-browser --filter=...@xplat/macos
pnpm probe doctor
pnpm probe run apps/macos/test/fixtures/browser-service.macos.tsrx --target macos --watch
pnpm exec turbo run pack:check --filter=@octane-xplat/web-browser
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"AppKit in-app browser package"}' -- pnpm exec turbo run package --filter=@xplat/macos
pnpm check:recipes
```

All remain deferred pending explicit human authorization for this task. No
install, tests, typechecks/builds, probes, native/OS/browser automation, packaging
or visual analysis ran. pack:check is not a clean installed native-consumer
qualification, and no new relocated leaf-consumer automation is supplied here.
Actual frozen installation/task graph, Swift compilation/class/header discovery,
Foundation parsing/BOOL bridge/thread behavior, native window/page/history/error/
redirect/popup/cookie behavior, network/TLS/ATS/sandbox, close/KVO/resource lifetime,
OS input/focus/VoiceOver, packaged consumers/signing and supported macOS versions
remain unqualified. Audit snapshots and evidence checkboxes are unchanged;
persistent goal active.

## AppKit browser JavaScript dialog source path

Ordinary document/help pages may use alert, confirm and prompt; these were a
consequential hole in the initial owned-browser subset. WKUIDelegate now builds
website-labeled NSAlert sheets. Confirm maps OK/Cancel to true/false; prompt
preserves accepted empty text and maps cancellation to nil. The prompt field
has an accessibility label and initial-first-responder source path. These are
implementation claims, not keyboard/IME/VoiceOver or native behavior evidence.

A private lease claims completion before ending the sheet and dispatches the
answer after Cocoa's current callback. Native close/replacement retires owner
references before cleanup, navigation and web-process termination cancel an
outstanding dialog, and stale/overlapping requests complete cancellation rather
than leaving JavaScript waiting. The sheet callback checks browser/window/lease
identity. No web script/app-shell bridge, external opener, permission grant,
download/upload or HTTP-auth integration is added. Completed user responses are
not undone; the one-shot guard prevents teardown from answering them twice.

`apps/macos/test/fixtures/browser-dialogs.html` is an idle manual page for
alerts, confirms, default/empty prompts and sequential dialogs. It uses textContent
and never requests a dialog on load. No server, page or browser was executed.
Local WebKit/AppKit SDK header review confirms delegate selectors and sheet APIs;
Swift compilation, actor checking and actual callback timing remain unqualified.
Source/semantic review, HTML script syntax parsing and whitespace checks are the
only intended checks for this increment. Existing five JS ownership cases do not
exercise native dialog completion. No new automated native dialog test is claimed.

Exact deferred commands (all require this human's verification go-ahead):

```sh
pnpm exec turbo run test --filter=@octane-xplat/web-browser
pnpm exec turbo run typecheck --filter=...@octane-xplat/web-browser --filter=...@xplat/macos
pnpm probe doctor
pnpm probe run apps/macos/test/fixtures/browser-service.macos.tsrx --target macos --watch
python3 -m http.server 8765 --bind 127.0.0.1 --directory apps/macos/test/fixtures
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"AppKit browser dialogs package"}' -- pnpm exec turbo run package --filter=@xplat/macos
pnpm exec turbo run pack:check --filter=@octane-xplat/web-browser
pnpm check:recipes
```

Use the manual page URL `http://127.0.0.1:8765/browser-dialogs.html` only after
starting the deferred server. Check OK/Cancel/Escape/Return, default and empty
input, sequential sheets, close/replacement during a sheet, stale requests,
navigation/process termination, IME/focus, VoiceOver and repeated teardown. Host
network/ATS policy is unchanged. Frozen install and task-graph checks from the
previous section also remain deferred, as do native supported-version and clean
packaged-consumer qualification. Evidence checkboxes remain open; goal active.

## AppKit browser file control source path

Demand assumption: selecting page attachments belongs with common document/help
and form flows, ahead of niche integrations. The repository FileInputDemo's
multiple image/PDF attachment flow is supporting source evidence of file demand;
it is not evidence that WebKit file controls already work. Without a WKUIDelegate
open-panel handler the SDK documents macOS file controls as cancelled.

Added an NSOpenPanel source path labeled with the initiating frame's security
origin host. WebKit's public multiple/directory parameters configure selection;
directory requests choose directories, ordinary requests choose files. Cancel,
stale owner and overlapping native sheet requests return nil. No selected URLs
or native errors are logged. A private one-shot lease captures URLs on OK before
sheet teardown and delivers the WebKit completion after the current Cocoa turn.
Browser close/replacement retires state first; navigation/process termination
cancel pending dialog/file panels. Browser/window/selection identity guards late
callbacks. This does not add a file copy, persistent bookmark, file grant bridge
or app-shell script injection.

Upstream API limit: local SDK WKOpenPanelParameters exposes only
allowsMultipleSelection and allowsDirectories, with no public accepted types.
The local implementation supplies no MIME/extension filter and does not promise
native HTML accept filtering. Pages must validate attachments. This is a source
API observation, not a native failed-filter experiment. No private API used.
Directory recursion, security-scoped WebKit handoff, actual file byte delivery,
network upload, symlink/package selection, focus/keyboard/VoiceOver and cleanup
remain unqualified. Downloads, HTTP-auth, permissions and OAuth interception
remain outside this browser subset.

The idle browser-file-selection.html fixture has single/multiple/image-hint/
directory controls, metadata-only textContent output and reset. It does not read
file contents or transmit selections. Its inline script syntax and whitespace,
SDK headers and semantic ownership review are the only checks. No compiler,
tests, typechecks, server, page, OS automation or packaging ran. Existing five JS
owner cases do not exercise native panels; no native completion test is claimed.

Exact deferred commands, still awaiting this human's verification go-ahead:

```sh
pnpm exec turbo run test --filter=@octane-xplat/web-browser
pnpm exec turbo run typecheck --filter=...@octane-xplat/web-browser --filter=...@xplat/macos
pnpm probe doctor
pnpm probe run apps/macos/test/fixtures/browser-service.macos.tsrx --target macos --watch
python3 -m http.server 8765 --bind 127.0.0.1 --directory apps/macos/test/fixtures
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"AppKit browser file-control package"}' -- pnpm exec turbo run package --filter=@xplat/macos
pnpm exec turbo run pack:check --filter=@octane-xplat/web-browser
pnpm check:recipes
```

After authorization use http://127.0.0.1:8765/browser-file-selection.html with test
files only. Local HTTP remains subject to host ATS/network policy. This fixture
does not prove upload transport; that requires an authorized test endpoint and
actual byte comparison separately. Frozen install/task graph, Swift actor/API
compilation, native supported-version and clean installed-consumer checks remain
deferred. Audit snapshots and evidence-gated checkboxes unchanged; goal active.

## AppKit animated image source path

Current source review found Pager already has an NSScrollView leaf, ownership
state, live-scroll events and manual fixture; the immutable audit placeholder
is stale for paging. No new Pager implementation was added. AnimatedImage still
rendered only an unsupported label. Demand assumption: the shared gallery's
AnimatedImageDemo is a concrete basic-image flow ahead of niche integrations.
Its text incorrectly claimed every target animated; that claim was removed.

Added package-owned XplatAnimatedImageView Swift source and AppKit/QuartzCore
manifest/framework/header wiring. The collector visits transitive dependencies;
AppKit harness -> @xplat/demos -> GIF is an existing source dependency path, so
no app manifest/lock/CLI changes were needed. Actual installed graph/class
collection remains unrun. Explicitly adding the GIF package is required for apps
using it; Vite JS imports alone do not compile Swift.

NSImage decodes source data and NSImageView.animates owns GIF frame timing.
HTTP(S) loads use an ephemeral session without cache/cookie/credential storage;
absolute file/file URL, data and ~/bundle paths have background read paths.
Remote requests cancel on source change/dispose; generation guards drop stale
results. Started file/data reads are not interruptible but cannot install after
source retirement. Failed/invalid loads leave an empty surface; shared props do
not expose error callbacks. No format support beyond the native decoder is
claimed, especially animated WebP. No JS frame loop, dependency or shared image
cache was introduced. GIF prefetch remains false and its stale no-pipeline
comment/docs were reconciled.

Centered aspectFit/aspectFill/fill/none geometry, clipped fill, intrinsic size,
explicit prop dimensions, alt-label/decorative accessibility and native
reduced-motion settings observer have source paths. Hidden/ancestor hide or
window detach disables progression; reattachment uses current policy. A
particular paused frame and offscreen/minimized scheduling are not promised.
Unmount disposes request/image/session/settings observation. Layout, actual
frame/loop timing, hidden/window lifecycle and accessibility remain unqualified.

The TS owner skips unchanged setters, applies current props on replacement,
retires old surfaces before dispose and guards setter/disposal reentry. Six
cases are authored (unchanged/source changes, replacement/disposal/recovery,
reentrant old disposal, changed/same-prop setter reentry, retry after failure),
all UNRUN. The idle manual fixture loads nothing until Apply and exposes source,
clear/mount, fit and unrelated-render controls. It records mounting only.
Package README, primitive skill guidance, recipe and feature note reconcile the
experimental subset. The shared public API shape remains unchanged.

Seven TS/TSRX/JSON files syntax parsed. Source/SDK/semantic and whitespace
review are the only other checks for this increment; no tests, typegen/typechecks/builds, Swift compile,
probes, OS/browser automation, packaging or visual analysis ran. Exact deferred
commands, pending this human's verification go-ahead:

```sh
pnpm exec turbo run test --filter=@octane-xplat/gif
pnpm exec turbo run typegen --filter=@octane-xplat/gif
pnpm exec turbo run typecheck --filter=...@octane-xplat/gif
pnpm probe doctor
pnpm probe run examples/probes/animated-image.macos.tsrx --target macos --watch
pnpm exec turbo run test:packed --filter=@octane-xplat/gif
pnpm exec turbo run pack:check --filter=@octane-xplat/gif
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"AppKit animated-image package"}' -- pnpm exec turbo run package --filter=@xplat/macos
pnpm check:recipes
```

The GIF package currently has no dedicated typecheck script; that filter checks
available dependent tasks, not a claimed full AppKit-leaf typecheck. Typegen and
packed declaration checks do not prove Swift/native compatibility. Native class/
header/actor compilation, GIF frame progression/disposal/looping, fit/clipping,
source/path/data/network/TLS/ATS/sandbox, settings/hidden/window/VoiceOver behavior,
CPU/memory lifetime and supported macOS/clean installed native consumers remain
unqualified. Existing frozen install/task graph deferrals remain. Audit snapshots
and evidence gates unchanged; persistent goal active.

## AppKit container reveal source path

Demand evidence: Astryx sandbox useContainerRevealHookUsage presents file rows
with Edit/Delete actions and instructs users to hover or Tab into the row. The
AppKit export explicitly selected the always-visible native fallback despite
existing renderer CSS hover/focus-within support. The native audit's reveal gap
therefore remains actionable independent of its obsolete media placeholders.
Sticky columns and landmark cycling were inspected as backlog leads, not fixed
or qualified by this change.

Added an AppKit-specific hook leaf/export with embedded native CSS markers.
Container-local inherited opacity resets at nested boundaries; hover and
focus-within reveal actions. Disabled reveal/missing tracking return empty
props, leaving controls visible. Actions stay mounted without hiding from the
accessibility tree, altering Tab stops or pointer-event flags. Native actions
keep their layout slot and change opacity immediately, an explicit subset
compared with web's position/transition rules. No public type/API expansion,
new dependency, per-hook native observer or shared stylesheet change.

The renderer capability getter requires its hover target and successfully
registered CSS focus observer. The existing focus installer set installed=true
before registration, even if the native call returned nil/threw. It now claims
installation only after a non-null token and catches registration failures so
they remain retryable. The getter uses this actual CSS observer instead of
assuming an unrelated focus hook's support means CSS focus observation works.
Existing first-responder/field-editor mapping, ancestor chain diff, top-down
subtree restyle/custom-property inheritance and tracking-area disposal are
reused. Opacity maps to alphaValue; native key-view eligibility source checks
hidden state, not alpha. These are source observations, not proof of native Tab
reachability or VoiceOver behavior at zero alpha.

Two cases are authored and UNRUN in the existing renderer machinery suite:
actual leaf CSS against real cascade/subtree restyle with hover/focus/nested
reset/disabled-marker removal, and focus-observer nil/throw/retry/single-token/
window scope. They simulate states and notifications, not actual OS input.
The idle manual fixture includes separate and nested file rows, notes, actions
and an isEnabled toggle; its runner records mounting only. Public app guide,
primitive skill, recipe and feature note reconcile the source subset. No React
Aria parity row exists for this Astryx-only hook, and no RA export was added.

Seven TS/TSRX/declaration files syntax parsed; source/semantic and whitespace
review are the only other checks. Exact deferred commands, still pending this
human's verification go-ahead:

```sh
pnpm exec turbo run test --filter=@octane-xplat/macos-renderer
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui --filter=...@octane-xplat/macos-renderer
pnpm probe doctor
pnpm probe run examples/probes/container-reveal.macos.tsrx --target macos --watch
pnpm exec turbo run test:packed --filter=@octane-xplat/macos-renderer
pnpm exec turbo run pack:check --filter=@octane-xplat/ui
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"AppKit row-action reveal package"}' -- pnpm exec turbo run package --filter=@xplat/macos
pnpm check:recipes
```

No tests/typechecks/builds, probe/native/OS automation, packing or visual analysis
ran. Actual CSS registration/tracking-area lifecycle, nested hover, field-editor
and descendant focus, Tab/Shift-Tab, opacity/hit-testing/VoiceOver behavior,
hidden/reparented/removed rows and supported macOS/clean installed native
consumers remain unqualified. Evidence gates/audit snapshots unchanged; goal
active. F6 landmark cycling and native sticky-column behavior remain gaps.

## AppKit data Table horizontal viewport source path

Demand evidence: Astryx sandbox StickyColumnsHookUsage constrains its table to
560 points and assumes an internal horizontal scroll container. Source review
found AppKit data mode instead rendered a plain Mason outer container and
ignored plan.tableMinWidth. Thus native scroll range is a prerequisite before
implementing sticky columns; this increment does not implement pinning.

Data mode now uses a horizontal native scrollview with one column-flow document
for before/table/after slots. It measures clip width through the renderer's
owned geometry notifications and sizes content to max(viewport, shared plan
minimum). This avoids relying on unresolved percentage widths during the
renderer's max-content scroll-axis solve. Unchanged width snapshots do not
write state again. The viewport is width/maxWidth constrained to its parent;
content can exceed it. Pixel cells get fixed basis/minimum and zero shrink;
proportional cells get zero basis, weighted growth and shared default/declared
minimums. Header/body share that source sizing, and header plugin style now
forwards like body style. Public ref binds inner table content; wrapper plugin
refs bind NSScrollView, with styles/classes/before/after slots preserved. DOM
handlers/attributes remain outside the native safe subset. Table style remains
on inner content, with render-plan minimum width enforced as on web.

Child-composed Table mode retains its existing flow; it does not acquire the
data viewport automatically. Sticky plugin remains a pass-through on AppKit,
and its stale no-horizontal-wrapper comment/guidance was reconciled. Native
Mason/scroll source reads establish document/clip ownership and geometry
notification paths, not actual automatic/bounded height, proportional geometry,
scroll range, input/RTL, header/body alignment, reparent/ref teardown or AX.

The manual fixture exposes narrow/wide viewports, mixed pixel/proportional
columns, empty/refill, auto/bounded height, plugin slots/native ref and explicit
metrics read. Its runner records mounted controls only. No new automated
layout test is claimed: existing shared pipeline/width tests cannot establish
this native behavior, and native verification remains deferred. Docs, skill,
recipe and feature note record both source coverage and qualification gaps.
No shared Table runtime, CLI or other native-target implementation changed.

Exact deferred commands, still awaiting this human's verification go-ahead:

```sh
pnpm exec turbo run test --filter=@octane-xplat/ui
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
pnpm probe doctor
pnpm probe run examples/probes/table-scroll.macos.tsrx --target macos --watch
pnpm exec turbo run pack:check --filter=@octane-xplat/ui
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"AppKit wide data-table package"}' -- pnpm exec turbo run package --filter=@xplat/macos
pnpm check:recipes
```

Three TSRX files syntax parsed; source/semantic and whitespace checks only.
No tests/typechecks/builds,
probe/native/OS automation, packaging or visual analysis ran. Verify native
clip/document sizing across auto/bounded height and resize, actual wheel/
trackpad/momentum/RTL/nested scrolling, header/body and plugin sizing, empty/
refill, ref cleanup, accessibility and clean installed supported-macOS consumers
before qualification. Frozen-install/task-graph deferrals remain. Evidence gates
and source audit snapshots unchanged; persistent goal active.

## AppKit controlled Table column-width plan

While tracing native sticky placement, source review found the next sizing
prerequisite: the native columnResize fallback wrote controlled widths only to
header htmlProps.style. AppKit flex body cells and plan.tableMinWidth still used
unmodified column definitions, so a controlled width could misalign the header,
body and scroll range. Shared web HTML table sizing can propagate header widths;
that is not an AppKit flex-row sizing mechanism. Astryx ColumnResizeHookUsage
and TableResizableTable provide concrete demand evidence for current controlled
widths. Sticky placement has not been added by this increment.

An AppKit hook/export now creates a stable plugin whose transformColumns reads
current config before width/header/body planning. It copies only changed
columns into pixel widths, preserving original definitions and metadata.
Removing overrides restores the source pixel/proportional widths. Explicit
programmatic values apply even to resizable=false columns, matching the web
controlled-value distinction from gesture locking. There are no programmatic
callback echoes. Unknown or inherited keys are ignored; visible values must be
finite nonnegative numbers, including zero. Invalid values throw before any
caller mutation; existing Table plugin isolation logs and skips the transform,
rather than applying a partial set. min/max gesture limits, native separators,
drag/keyboard resize interactions and onColumnResizeEnd dispatch remain gaps.
No shared hook behavior/public type/API/dependency changed.

Five plan integration cases are authored, UNRUN: header/body/scroll minimum
alignment; current config/zero/removal/frozen caller preservation/no callback;
reordered/synthetic columns plus shared sticky offset resolution; inherited and
absent map keys; invalid values with pipeline isolation. Two universal compiler
cases (HMR off/on) now include the AppKit hook, also UNRUN. Existing manual
Table fixture adds controlled-width toggle/removal and a locked column; native
metrics are read only after a human action. Public table guide, primitive skill,
existing feature note and recipe AC5 reconcile this source subset.

The native sticky design must account for the renderer's Auto Layout placement
pins and native sibling ordering: direct frame writes are overwritten and a
visual-only layer offset would not establish hit-testing. Source graph reads
located those constraints, but no new placement/stacking mechanism or sticky
support is claimed. Actual native geometry/focus/interaction remains deferred.

Exact deferred commands, requiring this human's verification go-ahead:

```sh
pnpm exec turbo run test --filter=@octane-xplat/ui
pnpm exec turbo run test:macos --filter=@octane-xplat/ui
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
pnpm probe doctor
pnpm probe run examples/probes/table-scroll.macos.tsrx --target macos --watch
pnpm exec turbo run pack:check --filter=@octane-xplat/ui
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"AppKit controlled table-width package"}' -- pnpm exec turbo run package --filter=@xplat/macos
pnpm check:recipes
```

Six TS/TSRX/MJS files syntax parsed; source/semantic and whitespace checks only.
No compiler transform execution, tests, typechecks/builds, probe/native/OS/AX, packaging or
visual analysis ran. Native header/body/scroll-range resize geometry, plugin
ordering/re-render/ref lifetimes, input/RTL/focus/AX and clean installed macOS
consumers remain unqualified. Source snapshots and evidence checkboxes unchanged;
persistent goal active. Column pinning and native interactive resizing remain gaps.

## AppKit sticky-column placement source path

After the native viewport and controlled-width plan prerequisites, AppKit
useTableStickyColumns now has a dedicated source implementation. Shared helper
logic selects contiguous runs and resolves dual-edge membership to start. The
plugin composes wrapper refs and Table now forwards header/body cell refs.
Empty config or a missing placement bridge leaves ordinary scrolling. Use one
hook instance per data Table; child-composed tables remain outside this subset.
No mobile/GTK hook behavior, dependency or shared stylesheet changed.

The renderer owns a native placement lease per cell. It retains the original
Mason rect, adds an owned offset to the leading constraint whenever layout pins
are applied, and can read unshifted geometry relative to the current document.
Offsets therefore do not accumulate from already-shifted frames or get erased
by the next layout pass. Release restores the latest base layout; new leases
supersede old ones, reparent/pin release clears stale bases, and dead native
nodes cannot update placement. Sibling order follows template order within
priority groups: normal, shifted end, shifted start. Releasing restores current
template order. Existing native views move; no clones, layer-only transform or
imperative frame-write substitute is used. This is an unrun source mechanism,
not proof of Auto Layout timing, leading-anchor RTL behavior or native hit tests.

The UI controller uses actual row/cell widths, including expanded proportional
columns and current controlled plan values. It calculates start/end physical
edges with direction, clamps to the row and deterministically prioritizes start
when pinned regions overlap. Clip/document/viewport frame or bounds and window
updates drive coalesced microtasks; no JS frame timer. Initial windowless
attachment is observed. Hidden/detached cells, replaced viewport and hook
teardown release leases/observers; late owners are ignored. Cleanup errors do
not prevent releasing remaining owners. Native cell backgrounds are opaque,
with a gradient source path for the existing row-overlay variable; web
pseudo-element shadows/transitions remain unimplemented. Background/row-state
compositing and every real native input claim remain unqualified.

Three simulated renderer pin/order cases, six geometry/observer cases and two
universal compiler cases (HMR off/on) are authored, all UNRUN. Existing layout
slice fixtures receive no-op placement dependencies; source slice boundaries
remain intact. The manual Table fixture now has start/end toggles, multiple
runs, RTL provider, a pinned action button and editable note field, alongside
controlled widths and native metrics. Its runner still records mounting only.
Guide, skill, fallback comments, feature note and dedicated recipe reconcile
current source capabilities and limitations. Earlier target-note sections are
historical source states, not current claims that this new path is qualified.

Exact deferred commands, requiring this human's verification go-ahead:

```sh
pnpm exec turbo run test --filter=@octane-xplat/macos-renderer --filter=@octane-xplat/ui
pnpm exec turbo run test:macos --filter=@octane-xplat/ui
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui --filter=...@octane-xplat/macos-renderer
pnpm probe doctor
pnpm probe run examples/probes/table-scroll.macos.tsrx --target macos --watch
pnpm exec turbo run pack:check --filter=@octane-xplat/ui
pnpm exec turbo run test:packed --filter=@octane-xplat/macos-renderer
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"AppKit sticky data-table package"}' -- pnpm exec turbo run package --filter=@xplat/macos
pnpm check:recipes
```

Fourteen TS/TSRX/MJS/declaration files syntax parsed; source/semantic and
whitespace review only. No test/compiler transform,
typecheck/build, probe/native/OS/AX, packaging or visual analysis ran. Native
constraint/frame timing, leading-anchor RTL and clipping, projected/margined
cells, row/template restoration, pinned button/field hit-testing, IME, key-view
order/Tab/VoiceOver, backgrounds, scroll/resize/hidden/window/resource lifetime,
CPU/memory and supported-macOS/clean installed consumers remain unqualified.
Audit snapshots and evidence gates unchanged; persistent goal active. Native
interactive column-resize handles remain a separate gap.

## AppKit Table resize-handle source path

Demand evidence: Astryx ColumnResizeHookUsage and TableResizableTable use the
resize plugin for ordinary data tables. AppKit previously supported controlled
plan values only; native header overlay content was dropped and no native
handle existed. Table now renders overlay content alongside before/after/below
slots. The AppKit plugin appends an in-cell eight-point handle for unlocked
columns while preserving existing overlay content. No shared web/mobile plugin
behavior, dependency or public config shape changed.

Native handles reuse the existing cumulative AppKit pan adapter, portable key
attachment, native focus host and col-resize cursor mapping. Parent-frame and window
observation coalesces measured width/scope refresh; ref/effect cleanup cancels owned gestures
and removes its observation. Handles provide Left/Right ten-point steps,
Home/finite End, Escape cancellation and AX increment/decrement source paths.
RTL physical deltas/keys are mirrored. Limits normalize finite values to a
nonnegative minimum and max at least minimum; default minimum is 50 and max
unbounded. Programmatic values remain outside gesture limits. Fractional points
are preserved and no-op drags do not freeze proportional widths into pixels.

An owned state machine shares preview/committed widths with the column-plan
transform. Without columnWidths it keeps commits internally. With a map present,
it previews during dragging then retires the preview and emits the full map;
the parent must save that map to accept. Current matching feedback can
acknowledge a preview; unrelated active-width changes, limits/control-mode
changes, hidden/detached/window/direction/key owners and cancellation retire it.
Commit ownership is claimed before callbacks, so callback errors/reentry cannot
restore a stale drag or cancel a newly started owner. Programmatic changes do
not echo resize completion. Native control scope/timing remain unqualified.

Source-level parity boundary: web's current implementation merges local gesture
widths over controlled props indefinitely and uses fixed physical deltas/keys.
AppKit's controlled acknowledgement and RTL behavior are explicitly different;
this is not cross-target parity proof. Docs/skill explain the difference and
parent acceptance. Reconciling the web branch is outside this AppKit-only edit.

The native accessibility mapper now reports separator as AXSplitter, numeric
value/range and vertical orientation. The local AppKit SDK defines vertical as
1; other roles defer to the native orientation baseline. Existing native
increment/decrement delivery is reused. These source selectors do not establish
VoiceOver behavior, key-view order or OS focus/hit-testing. Six state cases,
one simulated splitter case and two new handle universal compiler cases are
authored, all UNRUN. Existing hook compiler cases now include the new overlay
source. The manual table fixture exposes commit acceptance, uncontrolled mode,
column locking, counters, bounds, RTL and sticky composition. It still records
mounting only; it performs no scripted native gestures.

Guide/skill/recipe/feature note reconcile current source behavior and the
controlled-width recipe removes its obsolete statement that no handle exists.
Nine TS/TSRX/MJS files syntax parsed; source/SDK/semantic and whitespace
review only. Exact deferred commands, pending this human's verification go-ahead:

```sh
pnpm exec turbo run test --filter=@octane-xplat/ui --filter=@octane-xplat/macos-renderer
pnpm exec turbo run test:macos --filter=@octane-xplat/ui
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui --filter=...@octane-xplat/macos-renderer
pnpm probe doctor
pnpm probe run examples/probes/table-scroll.macos.tsrx --target macos --watch
pnpm exec turbo run pack:check --filter=@octane-xplat/ui
pnpm exec turbo run test:packed --filter=@octane-xplat/macos-renderer
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"AppKit table resize-handle package"}' -- pnpm exec turbo run package --filter=@xplat/macos
pnpm check:recipes
```

No tests/compiler transforms/typechecks/builds, probe/native/OS/AX, packaging or
visual analysis ran. Actual pan translation/cancellation/hit area and sort
interaction, controlled preview acknowledgement, same-view replacement, RTL,
keyboard/Tab/key repeat, AX splitter/value/focus, overlay/geometry lifecycle,
sticky scrolling/performance, supported macOS and clean installed consumers
remain unqualified. Audit snapshots and evidence gates unchanged; goal active.

## AppKit landmark region-navigation source path

The native audit names missing F6 landmark cycling. No direct useLandmark
callers were found in repository apps/demos, so expected demand is explicitly
inferred from the retained public hook and common multi-region navigation, not
claimed as a currently failing app flow. Basic controls/text/layout/file flows
were prioritized first. Existing native fallback forwarded role/label only and
its comment/parity note incorrectly ruled out a native analogue categorically.

Added a dedicated AppKit hook/export preserving public types. Owned native refs
register roots with programmatic focus-target leases and one local key monitor.
F6/Shift+F6 uses key-code 97 from the existing AppKit key map, resolves field
editors and cycles eligible roots in current native view order. The innermost
registered ancestor identifies the current region. A region chooses its own
eligible controls, skipping nested registered regions; otherwise its retained
root receives focus without a Tab stop. Native reveal is requested only while
registration/window/boundary/actual focus ownership still matches. No window
activation or synthesized key input is introduced.

The FocusScope manager exposes an internal current-boundary query to its AppKit
module; it is not a new root public export. Cycling stays inside that active
containing root and event window. Modified F6, marked text, handler cancellation
and propagation stops preserve native/application ownership. Focus rejection can
try remaining valid targets; focus callback reentry is guarded. Duplicate refs
hold independent claims but share one monitor; failed attachment rolls back,
last-root removal and HMR disposal retire ownership, and stale callbacks after
removal do not dispatch keys. Missing monitor/dispatch/focus bridge keeps
semantic forwarding. Native roles still follow existing mapping; no proof of
AX landmark subroles or announcements is claimed.

Six model, one containment-query and two universal compiler cases are authored,
all UNRUN. They cover ordering/direction, editor/nesting/empty fallback,
containment/hidden/disabled/windows, modifiers/IME/cancellation, duplicate/failure/
cleanup and native rejection/reentry. The manual fixture contains standalone,
nested, empty, hidden/unmounted and contained regions; its runner records mount
only. Public guide, skill, recipe and feature note reconcile the experimental
subset. Web source uses mount order and differs in nested/current selection;
AppKit native-order behavior is explicit, not cross-target parity proof. HMR
cleanup source is present; actual rebind/lifetime is unqualified.

Exact deferred commands, pending this human's verification go-ahead:

```sh
pnpm exec turbo run test --filter=@octane-xplat/ui
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
pnpm probe doctor
pnpm probe run examples/probes/landmark.macos.tsrx --target macos --watch
pnpm exec turbo run pack:check --filter=@octane-xplat/ui
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"AppKit landmark-navigation package"}' -- pnpm exec turbo run package --filter=@xplat/macos
pnpm check:recipes
```

Nine TS/TSRX files syntax parsed; source/semantic/whitespace review only.
No tests/compiler transforms,
typechecks/builds, probes/native/OS/AX, packaging or visual analysis ran. Hardware
function-key delivery, app/system shortcut ownership, responder/editor/IME,
containment/native focus rejection/reveal, hidden/reparent/window and HMR cleanup,
Tab/VoiceOver/AX semantics and supported-macOS/clean installed consumers remain
unqualified. Audit snapshots and evidence gates unchanged; persistent goal active.


## AppKit observational notification permissions

Demand is grounded in the app's existing notifications dependency, explicit QA
notify action and maintained reminder example. Everyday permission/status/send
flows take priority over niche integrations. Source inspection found both native
permission methods routed to ensure, contradicting the read-never-prompts contract;
no actual OS prompt was observed. The unchanged audit's native-service finding
and AppKit TSV remain qualification gates, not runtime evidence.

The AppKit facade now requires separate getStatus/ensure/notifyBody selectors and
an available bundled host. Missing/stale/incomplete/throwing capability metadata
reports unsupported without an authorization fallback; invocation failures reject.
Read calls settings only. Explicit requests read back authoritative OS settings;
an error alone no longer fabricates denial. Undetermined can ask again; denied
cannot. Authorized/provisional map to granted, nil/unknown to unsupported. Native
completion paths dispatch to the main queue, unavailable operations avoid the
center, and sends preserve the delegate and existing current-permission check.
This native selector addition requires rebuilding the host.

Services and an idle manual fixture expose separate read/request/send controls.
No such operation occurs on mount. Generation/teardown guards retire stale
results and prevent an old granted read from triggering a send; an already
requested system prompt is not cancellable. The app already declares the leaf,
and the AppKit harness depends on that app, so no manifest or lockfile edit is
needed. “Send requested” is not delivery evidence. Web/hosted ensure-only bridge
behavior remains a separate documented gap outside this native-target change.

Eight JS facade cases, expanded intercepted-center cases and a native-to-JS
unbundled status callback assertion are authored, all UNRUN. The intercepted
fixture tests status/permission-error mapping, main-thread completions, unavailable
center guards and nonprompting reads; it never calls the real OS center. The
metadata fixture's unbundled callback also avoids the center. Public guide,
README, skill, recipe and fix note reconcile this experimental behavior.

Exact deferred commands, pending this human's verification go-ahead:

```sh
pnpm exec turbo run test --filter=@octane-xplat/notifications
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"AppKit notification permission fixture"}' -- pnpm exec turbo run test:macos --filter=@octane-xplat/notifications
pnpm exec turbo run typecheck --filter=...@octane-xplat/notifications --filter=...@xplat/app
pnpm probe doctor
pnpm probe run examples/probes/notification-permissions.macos.tsrx --target macos --watch
pnpm exec turbo run test:packed --filter=@octane-xplat/notifications
pnpm exec turbo run pack:check --filter=@octane-xplat/notifications
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"AppKit notification permission package"}' -- pnpm exec turbo run package --filter=@xplat/macos
pnpm check:recipes
```

The notifications package has no typecheck task; filtered dependents do not
independently prove this facade or Objective-C. Five TS/TSRX/MJS files and one generated JS snippet syntax parsed;
source/semantic and whitespace review only. No tests, compiler transforms,
typechecks/builds, probes, native/OS/AX automation, packaging or visual analysis
ran. Actual compilation, callback marshalling/main-thread behavior, first-launch
prompt-free reads, explicit prompts, relaunch/revocation, foreground/background
presentation, bundle/signing and installed-consumer behavior remain unqualified.
No shared audit regeneration or evidence-gated checkbox changes; goal active.

## AppKit owned sharing completion

Demand is grounded in the app's declared share dependency, explicit share QA
trigger and maintained text/link/file guide. Source inspection found native
share required a private harness seam; that host passed file:// to a raw-path
existence check and returned shared immediately on picker launch. These are
source findings, not observed OS failures. Native-service audit/TSV qualification
remains open; shared snapshots were not regenerated.

Added package-owned Objective-C header/source with Foundation/AppKit discovery
metadata, replacing the native facade's harness-global dependency. The native
call requires a visible key/main window without an attached sheet; missing/stale
metadata, missing presenter and overlap are unavailable. No activation is added.
Absolute/local file URLs decode once; empty/localhost authorities are accepted,
remote/malformed/query/fragment/NUL inputs rejected, and native existence/readable/
non-directory checks precede presentation. Text subject/URL title becomes the
service subject; URL items are not duplicated with title body text. Android-only
file options are unchanged. Native invocation/metadata access errors reject.
The macOS declaration now exports the existing ShareFileOptions type.

A strong process-owned operation retains the picker and selected service through
weak AppKit delegates. Selection/launch remains pending. didShareItems settles
shared; picker dismissal/Cocoa cancellation settles cancelled and other service
errors unavailable. Window close/app termination retires observers and owned
delegates, closes the picker where available, and settles once. Retain self through
cleanup after releasing the active claim; retired callbacks cannot settle twice.
Already-running external service actions cannot be retracted. No synthetic
success timer is used; a service that never calls its delegate remains pending
until presenter/app teardown. Screen teardown alone cannot cancel native UI.

Services adds explicit text/link actions with retired-result guards. An idle
manual fixture separates file preparation from sharing, preserves a prepared
file while a promise is pending (including screen teardown), and releases it
on replacement or after completion when disposed. The app already declares the
leaf; no dependency/lockfile change is needed. The separate hosted macOS webview
bridge remains launch-as-shared and is not changed or qualified here.

Eight facade cases, an intercepted native picker and metadata/no-presenter
callback checks plus macOS Bundler/NodeNext packed-consumer/header/source checks
are authored, all UNRUN. The native fixture replaces NSApp and picker creation,
never presents real share UI or sends content. It covers pending selection,
subject, overlap, duplicate terminals, cancellation/failure, teardown, file/URL/
presenter guards and an off-main invocation returning to main. Source follows
the installed NSSharingService SDK and Apple's service-selection/service docs.
README, services skill, recipe, fix note and public service guide reconcile
this experimental subset. The original share implementation shipped in v0.18.0.

Exact deferred commands, pending this human's verification go-ahead:

```sh
pnpm exec turbo run test --filter=@octane-xplat/share
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"AppKit sharing intercepted fixture"}' -- pnpm exec turbo run test:macos --filter=@octane-xplat/share
pnpm exec turbo run typecheck --filter=...@octane-xplat/share --filter=...@xplat/app
pnpm probe doctor
pnpm probe run examples/probes/share.macos.tsrx --target macos --watch
pnpm exec turbo run test:packed --filter=@octane-xplat/share
pnpm exec turbo run pack:check --filter=@octane-xplat/share
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"AppKit sharing package"}' -- pnpm exec turbo run package --filter=@xplat/macos
pnpm check:recipes
```

The share package has no typecheck task; dependent checks do not independently
prove its facade or Objective-C. Nine TS/TSRX/MJS/declaration files, one manifest
and one generated JS snippet syntax parsed. Source/semantic/whitespace review
only. No tests/compiler transforms/typechecks/builds, probes, native/OS/AX
operation, packaging or visual analysis ran. Actual compilation/linkage/metadata,
native callback marshalling/main-thread/lifetime, picker input-event context
(AppKit specifies mouse-down; existing press/keyboard/AX paths are unqualified),
service availability/subject support/real cancellation, file transfer/lifetime,
window/termination/HMR, VoiceOver and signed/installed consumers remain open.
Evidence-gated checkboxes unchanged; persistent goal active.

## AppKit auth-session presenter ownership

Demand is grounded in createHostedAuth, the AppKit Google hosted adapter and the
retained sign-in guide/demo. Common sign-in lifecycle takes priority over niche
integrations. Source inspection found the AppKit anchor repeatedly queried the
current key/main/first window, no initiating-window close cleanup, and callback
validation read the caller's mutable options. These are source findings; no OS
browser/sign-in failure or credential issue was observed. The original leaf
shipped in v0.18.0; audit/TSV native-service qualification remains unchanged.

The leaf captures callback scheme and ephemeral preference before native reentry
and retains an eligible visible key/main window without an attached sheet. It
never borrows the first arbitrary app window. The provider returns the pinned
window only for the owned native session (strict or native isEqual identity),
returns nil for hidden/stale/foreign requests, and does not activate a window.
The backend still owns destination/state/PKCE/nonce/token validation; scheme
checking is not that proof and the manual fixture never logs callback values.

Main-queue close/termination observers must attach before construction. Terminal
paths retire the JS claim, remove acquired observers and clear the owned provider
before native cancellation; late callbacks cannot decode stale values or release
a replacement. Window/app teardown resolves cancel even if cancel throws.
Setup/start failure also cancels acquired sessions. Partial/synchronous observer
registration, constructor completion/teardown, ephemeral/provider setter reentry,
synchronous start completion and duplicate/stale callbacks have source guards.
If observer removal throws its callbacks remain inert, but a native observer may
be retained. Native cancellation failure can also leave OS UI alive despite the
retired JS result; this does not prove OS dismissal. No timer fabricates a result.

Eleven model cases (three existing expanded, eight added) are authored, all
UNRUN. The tests compile a VM copy with fake framework objects when eventually
executed; their authored source is not compiler or native evidence. The idle
manual fixture uses example.com for cancellation/presenter qualification and
cannot complete real authentication. It opens nothing on mount; separate backend
success/state/PKCE/nonce/credential/security qualification remains necessary.
Leaving a screen or hiding a window alone is not presenter close. No new public
API, dependency, shared renderer or CLI change is introduced. The guide, skill,
recipe and fix note reconcile these limits; supported still means framework
availability, not a qualified presentation context or provider registration.

Exact deferred commands, pending this human's verification go-ahead:

```sh
pnpm exec turbo run test --filter=@octane-xplat/platform
pnpm exec turbo run test --filter=@octane-xplat/auth
pnpm exec turbo run typecheck --filter=...@octane-xplat/platform
pnpm probe doctor
pnpm probe run examples/probes/auth-session.macos.tsrx --target macos --watch
pnpm exec turbo run test:packed --filter=@octane-xplat/platform
pnpm exec turbo run pack:check --filter=@octane-xplat/platform
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"AppKit auth-session presenter package"}' -- pnpm exec turbo run package --filter=@xplat/macos
pnpm check:recipes
```

Platform has no typecheck task; filtered dependents do not independently prove
this leaf. Three TS/TSRX/MJS files syntax parsed; source/semantic/SDK/whitespace
review only. No tests/compiler transforms/typechecks/builds, probes, native/OS/AX
or visual analysis, packaging, real auth callback or credential exchange ran.
Actual observer metadata, native wrapper identity/provider callbacks/main-thread
execution, consent/browser presentation/cancellation/window/termination/HMR
lifetime, HTTPS provider/backend registration, credential security, VoiceOver and
clean signed/installed consumers remain unqualified. Shared audit snapshots and
all evidence-gated checkboxes unchanged; persistent goal active.

## AppKit Apple authorization presenter ownership

Demand is grounded in AuthDemo's official Apple sign-in button and the retained
provider guide. Apple authorization is a separate native controller from the
previous authSession fix. Source inspection found a dynamically changing anchor,
no initiating-window close cleanup and a partial class-registration cache that
blocked retry if only the delegate registered. No OS consent/sign-in or credential
failure was observed. Audit/TSV native-service qualification remains unchanged.

The leaf now captures scopes/nonce before native provider work and retains its
initiating visible key/main window without an attached sheet. No arbitrary first
window or window activation is used. Anchor and result methods check owned native
controller plus provider/delegate identity, allowing equivalent native wrappers.
Stale/foreign callbacks return before credential decoding. If conversion already
started and reenters teardown, its result cannot settle the retired attempt.
Delegate and anchor classes cache independently, so an anchor registration failure
can retry without discarding the successful delegate class.

Main-queue close/termination observers must attach before controller setup.
Terminal paths retire JS ownership, remove acquired observers and clear owned
native delegate/provider references before optional controller cancel. Window/app
teardown resolves cancelled; setup/perform failures cancel acquired state.
Partial/synchronous observation, class/delegate/provider/request/scope/nonce/
anchor/allocation/controller/delegate-setter reentry cannot perform retired work.
Late callbacks cannot release or cancel a replacement. SDK ASAuthorizationController
cancel is macOS 13+; older hosts or throwing cancel can leave OS UI active after
JS retirement. Observer removal errors can retain inert native observers. No
synthetic timeout is added; absent callbacks remain pending until presenter/app
teardown. Screen unmount/hiding is not window close.

Eleven Apple model cases (eight new; Google cases retained) and an idle official-
button fixture are authored, all UNRUN. The model suite compiles VM copies only
when eventually executed; none ran here. The fixture displays status only, opens
no sign-in on mount and does not display/log tokens, credentials, user identity
or native error text. A signed Apple App ID, Sign in with Apple entitlement and
matching provisioning profile remain necessary. Backend identity-token/audience/
per-attempt nonce verification and app-session creation remain outside facade
acquisition. Credential-state behavior is unchanged and unqualified. README,
public guide, services skill, recipe and fix note reconcile the experimental
subset. The existing Apple leaf shipped in v0.18.0.

Exact deferred commands, pending this human's verification go-ahead:

```sh
pnpm exec turbo run test --filter=@octane-xplat/auth
pnpm exec turbo run typecheck --filter=...@octane-xplat/auth
pnpm probe doctor
pnpm probe run examples/probes/apple-auth.macos.tsrx --target macos --watch
pnpm exec turbo run test:packed --filter=@octane-xplat/auth
pnpm exec turbo run pack:check --filter=@octane-xplat/auth
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"AppKit Apple authorization package"}' -- pnpm exec turbo run package --filter=@xplat/macos
pnpm check:recipes
```

Three TS/TSRX/MJS files syntax parsed; source/semantic/SDK and whitespace
review only. No tests/compiler transforms/typechecks/builds, probes, native/OS/AX or visual
analysis, packaging, real account callback or credential exchange ran. Actual
native registration/wrapper identity/callback/thread/consent, observer/window/
termination/HMR lifetime, real credential-state/nonce/security, entitlement/profile/
signing, VoiceOver and clean installed consumers remain unqualified. No shared
audit regeneration or evidence-gated checkbox changes; persistent goal active.

## AppKit provider-button action ownership

Demand is grounded in AuthDemo's Apple/Google buttons and the retained provider
button guide. Source inspection found results could reach unmounted owners,
repeat activation could deliver overlap errors while the original attempt was
still pending, and Google used a gesture container instead of native button
actions. The existing NSButton branch also ignored shared JSX isEnabled (it
accepted enabled only). These are source findings; no actual native input or
sign-in failure was observed. v0.18.0 source contains both old button paths.

A target-specific action owner now claims one pending attempt per mounted button.
It reads current props, ignores disabled/pending/reentrant presses, invokes the
notification onPress hook and rechecks observed owner/disabled state before calling
the provider. Return values do not gate sign-in. Queued screen/disabled state may
commit after provider work starts. Results use the latest mounted callback even
if props become disabled during work; unmount/replacement retires the old claim.
Old settlement cannot clear a new lease, and result callbacks can initiate a fresh
attempt. Unexpected provider throws/rejections become one generic owned error;
consumer onPress errors propagate while releasing the claim, and onResult errors
are not reclassified as provider failures. No busy indicator or provider cancel
API is introduced; other instances/imperative calls retain provider overlap guards.

Google selects the renderer's native NSButton via text/isEnabled/onPress, with no
new dependency. Its existing theme/variant props remain unimplemented; this is
not Google-official styling or shared pixel parity. The renderer maps isEnabled
to native state, preserves an independent enabled=false alias and guards disabled
or retired-root action dispatch. Apple keeps its official button. Old style/type
attachments retire their own callback/handle rather than consulting a possibly
replaced handle; a theme change does not retire the mounted component's pending
result. Native provider work already started is not cancelled by screen unmount.

Six action-model and three renderer branch cases plus an idle lifecycle fixture
are authored, all UNRUN. The renderer fixture uses the actual source prop/action
branch with fake native objects; that is not OS keyboard/AX evidence. The manual
fixture supports disabled, theme and unmount/remount controls, shows status only
and does not configure or start authentication on mount. Google needs an app-owned
hostedFlow and Apple needs its signed entitlement/profile setup. README, skill,
recipe and fix note reconcile limits. No public API or dependency changes and no
React Aria presence-level coverage change are involved.

Exact deferred commands, pending this human's verification go-ahead:

```sh
pnpm exec turbo run test --filter=@octane-xplat/auth
pnpm exec turbo run test --filter=@octane-xplat/macos-renderer
pnpm exec turbo run typecheck --filter=...@octane-xplat/auth --filter=...@octane-xplat/macos-renderer
pnpm probe doctor
pnpm probe run examples/probes/auth-buttons.macos.tsrx --target macos --watch
pnpm exec turbo run test:packed --filter=@octane-xplat/auth --filter=@octane-xplat/macos-renderer
pnpm exec turbo run pack:check --filter=@octane-xplat/auth
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"AppKit provider-button package"}' -- pnpm exec turbo run package --filter=@xplat/macos
pnpm check:recipes
```

Seven TS/TSRX/MJS files syntax parsed; source/semantic/JSX-contract/whitespace
review only. No tests/compiler transforms/typechecks/builds, probes, native/OS/AX
or visual analysis, packaging, provider callbacks or credential exchange ran.
Actual hook/effect/queued-state timing, native NSButton pointer/Tab/keyboard/AX,
Apple target/attachment replacement/failure/HMR, disabled/layout/focus behavior,
controller/browser lifetime and clean signed/installed consumers remain unqualified.
Shared audit snapshots and evidence-gated checkboxes unchanged; goal active.

## AppKit native context-menu ownership and restoration

Common record/file actions are grounded in the existing serialized AppKit menu
contract and the retained NativeContextMenuDemo placeholder. The package/renderer
already supplied NSMenu; source review found one-time descendant-menu overwrite,
lost prior slots and unguarded stale/disabled/partial-construction actions. First
repaired exact control/text/menu selector metadata in `6b1b405c9`; that source
prerequisite remains runtime-unqualified. Current callback forwarding already
existed and is preserved without native-menu churn on callback-only renders.

Added current view/item/record-scope ownership. Primitive snapshots detect in-place
item changes, while equal-content arrays keep the mounted menu. Record id, item
content/order or view replacement and teardown retire old callbacks before
cleanup. Reject disabled/removed/unknown/reentrant/stale selections; unique string
IDs and string titles are required. Empty content removes this wrapper's custom
menu; invalid/missing/failing attachment reports a generic unavailable message
with the trigger still inline. No native exception details enter that message.
Record-specific id or remount is required when a row represents another record.

The renderer attaches only at the wrapper and preserves descendant editing/
nested menus. Apple documents unhandled right-click propagation up the responder
chain since macOS 10.7:
[NSView](https://developer.apple.com/documentation/appkit/nsview?changes=_5_2).
Inference: native descendants that forward unhandled events can use the wrapper's
menu without overwriting a snapshot of existing children. Custom native responders,
dynamic children and actual input routing remain qualification work. This source
design follows the platform contract; no new tree observer or global input monitor
is installed. Native-enabled/window/current-slot guards reject retired actions.
Cleanup requests [cancelTracking](https://developer.apple.com/documentation/appkit/nsmenu/canceltracking%28%29),
retires action entries/targets, restores prior active menu ownership, skips retired
predecessors and preserves foreign replacement slots. Constructor/item/slot failures
clean their owned registrations; cleanup is idempotent. Ambient bridge typing now
reflects the nullable detach return instead of void. Flat menu, normal destructive
rows and existing public props remain; no dependency/React Aria presence change.

The maintained demo now offers scope/callback/item/disabled/order/empty/invalid/
remount changes, an independently added child, native text editing, nested menus
and a user-started delayed scope change for tracking-time qualification. Its timer
is cancelled on teardown and nothing starts it on mount. An idle probe imports
that demo and only waits for its status. Eight owner-model and seven actual-
renderer-branch cases are authored, all UNRUN. Mocks cover ownership/slots/actions,
not real native responder propagation or tracking. Added the package's model-test
task without running it. README/public/skill/feature/recipe guidance reconciles
record ownership, native child menus and remaining limits.

Exact deferred commands, pending this human's verification go-ahead:

```sh
pnpm exec turbo run test --filter=@octane-xplat/context-menu --filter=@octane-xplat/macos-renderer
pnpm exec turbo run typecheck --filter=...@octane-xplat/context-menu --filter=...@octane-xplat/macos-renderer --filter=...@xplat/demos
pnpm probe doctor
pnpm probe run examples/probes/native-context-menu.macos.tsrx --target macos --watch
pnpm exec turbo run test:packed --filter=@octane-xplat/context-menu --filter=@octane-xplat/macos-renderer
pnpm exec turbo run pack:check --filter=@octane-xplat/context-menu
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"AppKit native context-menu consumer"}' -- pnpm exec turbo run package --filter=@xplat/macos
pnpm check:recipes
pnpm check:docs
pnpm check:doc-examples
```

Demos has no standalone typecheck task; consumer/probe compilation must cover
the changed demo. Documentation check scripts remain absent from this isolated
snapshot; shared in-flight tooling was preserved. Nine TS/TSRX/MJS source/test
files, manifest JSON and 11 scoped documentation fences syntax parsed, plus
semantic/source/whitespace review only. No tests/compiler transforms/typechecks/
builds/probes, native/OS/AX/visual analysis or packaging ran. Native pointer/
Control-click, keyboard/AX menu actions, custom responder routing, editable/late/
nested children, menu tracking/cancellation and timer progress, native BOOL,
hook/ref/effect/reentry/teardown timing, memory and clean installed consumers remain
unqualified. Shared audit snapshots and evidence-gated checkboxes unchanged;
persistent goal active.

## AppKit native date-picker selection and bridge lifecycle

The retained NativeDatePickerDemo.macos claimed native dates were unsupported,
but the package already exported AppKitDatePicker and the AppKit renderer already
registered attachDatePicker. Reused that workspace engine; no app-only installer
or replacement native dependency is needed. The demo is now an actual source
consumer. Date/time entry is a common form/scheduling flow; the stale demo is
source adoption evidence, not an observed native failure or a runtime pass.

Added a pure attachment owner with current props/callbacks. Default/current-time
seed is retained across mode/style/backing-view changes, later defaults are
ignored and controlled values restore when rejected. Clamp uncontrolled selection
to new inclusive bounds without emitting, clear removed bounds and native labels,
and reject invalid Date/range or out-of-bounds controlled props with a generic
message until repaired. Missing/failing attachment reports generic unavailability.
Retire sessions before native cleanup; drop disabled/stale/unmounted/duplicate/
programmatic changes and suppress attach/update echoes. Consumer throw still
restores the current controlled source. Dates use Date instants and native
calendar settings; no timezone override or broader parsing API is added.

Renderer attachment now owns/deactivates four pinning constraints and its action
registration, cleans partial construction/update failure and makes detach inert
after its first call. Guard actual native enabled state, attached view/window and
write depth. Validate raw option dates/ranges, clear old bounds before disjoint
replacement, skip unchanged date/range writes, forward/clear the native AX label
and normalize NSDate callback precision to milliseconds. Consumer errors log a
generic message without exception details. The ambient bridge return signature
now reflects its update/detach handle; native modes/styles and public props stay
the same. Apple documents the native date/elements/style/range APIs used here:
[NSDatePicker](https://developer.apple.com/documentation/appkit/nsdatepicker).
That SDK reference establishes API shape, not runtime behavior through this bridge.

The maintained AppKit demo now offers date/time/combined components, text/calendar
style, controlled/uncontrolled, disabled, bounds, invalid controlled values, reset,
current callback and remount controls. The clock/calendar gets default minimum
room; native layout is unqualified. An idle probe imports this same demo and only
waits for its status node. Seven owner-model and six additional actual-renderer-
branch cases are authored, all UNRUN. The renderer file now has nine cases (three
prior plus six new); fake native objects do not qualify OS input or constraints.
Added the package's small model-test task without running it or adding a dependency.
README, public guide, Octane primitive reference, feature note and recipe reconcile
the source subset. No React Aria presence-level equivalent changes are involved.

Exact deferred commands, pending this human's verification go-ahead:

```sh
pnpm exec turbo run test --filter=@octane-xplat/date-picker --filter=@octane-xplat/macos-renderer
pnpm exec turbo run typecheck --filter=...@octane-xplat/date-picker --filter=...@octane-xplat/macos-renderer --filter=...@xplat/demos
pnpm probe doctor
pnpm probe run examples/probes/native-date-picker.macos.tsrx --target macos --watch
pnpm exec turbo run test:packed --filter=@octane-xplat/date-picker --filter=@octane-xplat/macos-renderer
pnpm exec turbo run pack:check --filter=@octane-xplat/date-picker
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"AppKit native date-picker consumer"}' -- pnpm exec turbo run package --filter=@xplat/macos
pnpm check:recipes
pnpm check:docs
pnpm check:doc-examples
```

The demos package has no standalone typecheck task at this revision; AppKit
consumer/probe compilation must cover that edited demo. Documentation checker
scripts remain absent from this isolated snapshot; no shared in-flight tooling
was copied. Nine TS/TSRX/MJS source/test files, manifest JSON and 29 scoped
existing/new documentation fences syntax parsed, plus source/semantic/whitespace
review only. No tests/compiler transforms/typechecks/builds/probes, native/OS/AX/
visual analysis, packaging or actual native date operations ran. Actual native
text/calendar/clock editing, IME, Tab/VoiceOver, focus/layout/sizing, native BOOL/
date/constraint bridge behavior, hook/ref/effect/callback timing, teardown and clean
installed consumers remain unqualified. Shared audit snapshots and evidence-gated
checkboxes unchanged; persistent goal active.

## AppKit control text and menu selector prerequisite

Continuing common native menu support exposed a renderer prerequisite affecting
buttons, selection/date controls, text input/focus and menu callbacks. The target
action strings include colons, but metadata declared legacy keys such as
controlChanged and menuItemSelected without them. The old action-site check
invented missing colons from parameter counts, so it could not detect the mismatch.
This is a source finding, not an observed native dispatch failure.

NativeScript/runtimes ClassBuilder at
`5b697b393152f973dd392851fd72dacf03a7a0c9` constructs SEL directly from each
ObjCExposedMethods key (ClassBuilder.mm lines 665–736), and records supported
JS-spelled lookup aliases separately. Its objc-node-api package is 1.0.0-alpha.7,
matching the installed declaration package; the exact installed framework binary
has not been identified or run. Source:
[ClassBuilder](https://github.com/NativeScript/runtimes/blob/5b697b393152f973dd392851fd72dacf03a7a0c9/NativeScript/ffi/napi/ClassBuilder.mm#L665).
The declared package repository URL returned 404; the existing local source cache
had no matching runtime, so only bounded upstream directory/file reads were used.
No source clone, dependency install or native runtime execution occurred.

Corrected exact metadata selectors for buttonPressed:, controlChanged:,
textFieldSubmitted:, text change and begin/end editing delegates, and
menuItemSelected:. Keep the supported JS-spelled method bodies; no compatibility
aliases or upstream patches were added. MenuActionTarget now uses the renderer's
existing registration helper to expose owned prototype methods in the JSC host.
Strengthened the existing action-site case to compare exact keys; two additional
metadata/delegate cases are authored, all UNRUN. Semantic impact identified 17
related source cases and incomplete callback aliases; none were run. Updated
driver skill guidance. No public API, dependency or React Aria presence change;
this internal declaration repair does not change an app-building recipe.

Exact deferred commands, pending this human's verification go-ahead:

```sh
pnpm exec turbo run test --filter=@octane-xplat/macos-renderer
pnpm exec turbo run typecheck --filter=...@octane-xplat/macos-renderer
pnpm probe doctor
pnpm probe run examples/probes/native-date-picker.macos.tsrx --target macos --watch
pnpm probe run examples/probes/auth-buttons.macos.tsrx --target macos --watch
pnpm exec turbo run test:packed --filter=@octane-xplat/macos-renderer
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"AppKit action and text selectors"}' -- pnpm exec turbo run package --filter=@xplat/macos
pnpm check:docs
pnpm check:doc-examples
```

Staged renderer/test syntax and the new skill fence parsed; semantic/source/
whitespace review only. No tests/compiler transforms/typechecks/builds/probes,
native/OS/AX/visual analysis or packaging ran. Exact installed-framework selector
registration, JS method resolution, ABI, actual button/date/menu activation,
per-edit text/Return/IME/focus delegate delivery and installed consumers remain
unqualified. The retained probes only mount controls until manual operations are
performed; they do not qualify those inputs by themselves. Shared audit snapshots
and evidence-gated checkboxes unchanged; persistent goal active.

## AppKit PowerSearch absolute-date validation

The config builder exposes date-before/after operators, so single-date editing is
a common record-filtering follow-on to range/numeric work. The retained demo
shows titles/years; date demand is an explicit assumption beyond those fields.
Source review found the absolute form sliced stored timestamps to a date and
reparsed midnight with unchecked Date.parse, losing no-op time/precision and
allowing invalid/NaN/calendar-rollover saves. No OS failure was observed.

The absolute AppKit editor now reuses the range form's strict UTC parser, exported
only from its internal leaf module; the range parser's behavior is unchanged.
Source graph identified partValue as its prior caller. Preserve unchanged stored
timestamp precision/time/expanded years; typed four-digit-year date/time text
accepts optional seconds/milliseconds and rejects calendar rollover, partial,
ambiguous or offset text. Plain dates and date-times without Z are explicitly UTC.
Invalid stored dates stay editable errors rather than render exceptions or NaN.
isDateOnly intentionally drops the time to midnight UTC and rejects typed time;
unchanged stored expanded-year days are retained. Millisecond formatting floors
pre-epoch fractional timestamps so date-only uses the correct previous UTC day.

Date-only mode participates in draft ownership; existing scalar readonly,
replacement, composition, Cancel, unmount and submit/retry guards apply. Labels
and placeholders explicitly say UTC. timezoneID-specific display, calendar widgets,
broader language parsing, full target parity and native qualification remain gaps.
No new dependency/public prop or React Aria presence-level equivalent change.

Six date-model and two additional mocked-control scalar cases are authored, all
UNRUN; the shared scalar case file now has seven cases (five prior plus two date
cases). Expanded idle scalar fixture offers timestamp/date-only controls and
applies no filter automatically. Public/skill/feature/recipe guidance reconciles
stored precision, deliberate midnight conversion and remaining limits.

Exact deferred commands, pending this human's verification go-ahead:

```sh
pnpm exec turbo run test --filter=@octane-xplat/ui
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
pnpm probe doctor
pnpm probe run examples/probes/power-search-scalars.macos.tsrx --target macos --watch
pnpm exec turbo run pack:check --filter=@octane-xplat/ui
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"AppKit absolute-date filter package"}' -- pnpm exec turbo run package --filter=@xplat/macos
pnpm check:recipes
pnpm check:docs
pnpm check:doc-examples
```

Six changed TS/TSRX and four new documentation fences syntax parsed; source,
semantic and whitespace review only. Documentation checker scripts remain absent
from this isolated revision, and the prior whole-primitives fence issue remains
recorded above. No tests/compiler transforms/typechecks/builds/probes, native/OS/
AX/visual analysis, packaging or actual filter operations ran. Native text/IME/Tab/
focus/VoiceOver, hook/effect/attachment timing, UTC/calendar semantics in an
installed app, popover layout and clean consumers remain unqualified. Shared
audit snapshots and evidence-gated checkboxes unchanged; persistent goal active.

## AppKit PowerSearch date-range form

Demand is grounded in the config builder's date/between operator and common
record filtering. The retained demo covers strings/numbers; date ranges are an
explicit demand assumption beyond that example, not an observed runtime failure.
Current Pager source was checked first: the stale audit calls it a placeholder,
but an NSScrollView implementation and unrun cases already exist. That source
was preserved. The reviewed PowerSearch gap is concrete: date_range was explicitly
disabled in the AppKit built-in editor. Shared audit snapshots remain unchanged.

Added an AppKit range form using existing native text, segmented and button
controls, with no dependency/public-type change. Start/End support Now, absolute
UTC date/time and signed/fractional/scientific relative amounts across declared
units. Date-only input means midnight UTC; date-times retain seconds/milliseconds
and reject invalid calendar rollover. Unchanged stored absolute values retain
original precision/expanded years; typed replacements use four-digit years.
No-op metadata and interval presets preserve semantic parts rather than freezing
Now/relative into timestamps. Relative resolution reuses the shared fixed-duration
matcher (month 30 days/year 365); named anchorKey is preserved but not resolved.

Apply validates finite values/order against one current instant and never emits
invalid/reversed/overflowing values. It stays available for revalidation as Now
moves; previews refresh on render and no clock timer is introduced. Interval
presets replace drafts without auto-save. Expression-string relativeDatePresets
and timezoneID-specific display explicitly require a custom editor. Web/mobile
ranges, native entity/nested/custom editor completeness and cross-target parity
remain open; date-range presence is not full editor-support qualification.

A component-local draft record preserves rapid edits before render. Current
filter/field/operator revisions and unmount retire stale callbacks; readonly
filter/editor state blocks edits and save. The AppKit PowerSearch view now forwards
disabled/loading as editor read-only too. Attached marked-text inputs block save,
using the existing composition helper. Cancel remains available and does not save.
One draft claims submit before consumer reentry; a consumer error releases that
claim for retry. Native control event translation and effect timing are unproven.

Seven value-model and three mocked-control compiler cases plus an idle manual
fixture are authored, all UNRUN. Compiler cases cover actual editor ownership with
mock text/segmented/button children, not real control integration or OS input.
The fixture offers readonly/replacement/unmount controls and applies no range on
mount. Public guide, skill, recipe and feature note reconcile the experimental
subset. No React Aria presence-level equivalent changes are involved. Source
context tools could not resolve the AppKit editor symbol; direct target-source
imports and semantic staged diff were reviewed instead of claiming complete edges.

Exact deferred commands, pending this human's verification go-ahead:

```sh
pnpm exec turbo run test --filter=@octane-xplat/ui
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
pnpm probe doctor
pnpm probe run examples/probes/power-search-range.macos.tsrx --target macos --watch
pnpm exec turbo run pack:check --filter=@octane-xplat/ui
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"AppKit PowerSearch range package"}' -- pnpm exec turbo run package --filter=@xplat/macos
pnpm check:recipes
```

Seven TS/TSRX files syntax parsed; source/semantic/whitespace review only. No
tests/compiler transforms/typechecks/builds, probes, native/OS/AX or visual
analysis, packaging or real filter operations ran. Actual text/segmented/keyboard/
IME/focus/AX, readonly/attachment/reentry timing, popover sizing/scrolling, date/
clock semantics and clean installed consumers remain unqualified. Evidence-gated
checkboxes unchanged; persistent goal active.

## AppKit PowerSearch entity form

The retained PowerSearch demo exercises strings/numbers; assignee/customer
selection is an explicit common-application demand assumption beyond that demo.
The source gap was concrete: the AppKit default editor rejected entity_list
despite its shared searchSource/tokenization contract. Reused existing AppKit
Tokenizer for source lookup, custom rows, selected tokens, optional arbitrary
strings and removal/clear. No new dependency, public type or shared renderer
change. Saved filters contain only stable id/label/optional top-level string photo;
source auxiliary data/renderable nodes remain draft-only. applyFilters still
passes entity values through; app/backend matching is required.

Configured tokenization uses a separate paste field and explicit Add entries
because Tokenizer has no public paste splitter/query-clear API. This timing is
an explicit subset, not automatic tokenization parity. Trim/deduplicate entries,
optionally sort by JS string order, default to comma/newline; regex captures and
zero-width matches never become entries. Reuse selected exact IDs, otherwise
resolve serially with a fresh request signal. Exact IDs win over unique
case-sensitive labels; fuzzy/ambiguous results require a search-row pick. Arbitrary
creation applies only to missing matches when enabled. Invalid separators,
unmatched/ambiguous entries and source failure preserve the entire prior draft;
error text does not expose source exception details.

Immediate component-local records preserve rapid edits. Current filter/field/
operator/source/tokenization revisions, read-only, Cancel and unmount retire
pending bulk work and ignore late results, including ignored-signal sources.
Block repeats, selection edits and Apply while pending. Apply requires adding or
clearing unprocessed text; attached marked text in the bulk field blocks Add and
Apply. One draft submits once, consumer throw permits retry. Cancel closes its
editor session without saving; replace/remount to reopen it. Source errors retain
text for correction/retry; lookup makes no automatic fuzzy choice or partial save.

Seven model and five mocked-control compiler cases and an idle manual fixture
are authored, all UNRUN. The old range-editor case now mocks the newly imported
Tokenizer so unrelated native children do not weaken editor isolation. Public
guide, Octane primitive reference, feature note and recipe reconcile limits. No
React Aria presence-level equivalent changes are involved. Source graph tools
could not resolve the target editor; target imports and semantic diff were
reviewed instead of claiming complete graph edges. Shared audit snapshots stay
unchanged. Web/mobile entity built-ins and full nested/custom parity remain open.

Exact deferred commands, pending this human's verification go-ahead:

```sh
pnpm exec turbo run test --filter=@octane-xplat/ui
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
pnpm probe doctor
pnpm probe run examples/probes/power-search-entities.macos.tsrx --target macos --watch
pnpm exec turbo run pack:check --filter=@octane-xplat/ui
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"AppKit PowerSearch entity package"}' -- pnpm exec turbo run package --filter=@xplat/macos
pnpm check:recipes
pnpm check:docs
pnpm check:doc-examples
```

The new documentation-quality guide was read from the shared checkout because
it is absent from this isolated revision. check:docs/check:doc-examples are also
absent from this revision's package scripts; no shared in-flight tooling was
copied across. The public reader path, actual exported types, configuration,
draft/cancel behavior and source-vs-runtime claims were manually reviewed.
Seven target TS/TSRX and five new documentation fences syntax parsed. An initial
whole-reference fence parse stopped at the pre-existing primitives.md fence
starting on line 35 (adjacent JSX, "JSX expressions must have one parent element");
only the new entity fences were then parsed successfully. This is not a pass
for the entire reference or either deferred documentation checker. Semantic/
whitespace review completes the permitted checks. No tests/compiler transforms/
typechecks/builds/probes, native/OS/AX/visual analysis or packaging ran. Actual
Tokenizer/paste/keyboard/IME/focus/VoiceOver, read-only/attachment/effect timing,
source cancellation timing, popover sizing/scrolling and clean installed consumers
remain unqualified. Evidence-gated checkboxes stay open; persistent goal active.

## AppKit PowerSearch scalar drafts and numeric validation

The retained PowerSearchDemo filters book titles and publication years, so basic
text/numeric editing takes priority over custom/nested expansion. Source review
found unchecked Number(text) could save NaN, blank zero, fractional integers and
values outside configured bounds. useState(initialText) also retained the prior
filter's text after replacement; direct held save callbacks did not check current
read-only/lifecycle ownership. These are source findings, not observed OS failures.

AppKit numeric Apply now accepts explicit finite decimal/scientific text, enforces
safe whole integers and inclusive minValue/maxValue, and rejects invalid/nonfinite/
reversed bounds. Never clamp or coerce blank/hex/trailing/grouped input. Display
units/bounds and preserve the draft with an actionable error. Dot decimal notation
is the documented subset; locale-specific numeric parsing remains unsupported.

The scalar editor keeps a current draft record for rapid edits, resets on
filter/field/operator replacement, and guards readonly filter/editor, stale
callbacks, marked-text input and unmount. Claims one submission before consumer
reentry and releases on throw. Cancel retires the session without saving. Missing
operator uses the configured default, then first; explicit unknown field/operator
keys disable Apply rather than saving a different filter. Matching value type
owns draft seeding/conversion. Invalid stored absolute dates no longer throw in
render, but scalar calendar validation/time precision remain separate source gaps.
String completions, richer list/time/relative/custom/enum/date behavior, web/mobile
parity and full native qualification are not claimed by this numeric repair.

Five numeric model and five mocked-control scalar cases plus an idle fixture are
authored, all UNRUN. They cover invalid/coerced/bounded/exact-integer text, rapid
drafts/reentry, replacement, readonly/composition/unmount, default/missing keys,
Cancel and consumer-error retry. Mock TextInput/Button do not prove actual native
event translation, editing, focus or accessibility. Public guide/skill/feature/
recipe reconcile the same subset; no new dependency/public type/React Aria
presence-level equivalent changes. Semantic impact resolved the target editor
but reported incomplete callback edges and lexical web-test references; exact
AppKit imports/cases were reviewed without claiming a complete test graph.

Exact deferred commands, pending this human's verification go-ahead:

```sh
pnpm exec turbo run test --filter=@octane-xplat/ui
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
pnpm probe doctor
pnpm probe run examples/probes/power-search-scalars.macos.tsrx --target macos --watch
pnpm exec turbo run pack:check --filter=@octane-xplat/ui
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"AppKit PowerSearch scalar package"}' -- pnpm exec turbo run package --filter=@xplat/macos
pnpm check:recipes
pnpm check:docs
pnpm check:doc-examples
```

Five changed TS/TSRX and five new documentation fences syntax parsed; source,
semantic and whitespace review only. check:docs/check:doc-examples scripts remain
absent from this isolated revision; no shared in-flight tooling was copied. The
entity entry records the pre-existing whole-primitives fence syntax limitation;
new fences alone were parsed here. No tests/compiler transforms/typechecks/builds,
probes, native/OS/AX/visual analysis, packaging or real filter operations ran.
Actual keyboard/IME/Tab/focus/VoiceOver, hook/effect/attachment/consumer timing,
popover sizing/scrolling and installed-consumer behavior remain unqualified.
Shared audit snapshots and evidence-gated checkboxes unchanged; goal active.

## AppKit incoming route-link root ownership

The maintained AppKit host imports the shared route catalog before creating its
window. Its native route-link leaf previously subscribed during that import,
set its once flag before successful setup and discarded cleanup/navigation
promises. The router's outlet mounts in a layout effect; navigation handed to an
unmounted host can resolve blocked. These are source findings, not observed
native launch failures. Cold/warm launch and ordinary screen navigation take
priority over niche integrations. The earlier host-events follow-up considered
module lifetime intentional; inspecting this actual startup path established a
primary-root owner for the maintained harness instead.

The AppKit route-import leaf now retains its shared wireRouteLinks signature
without acquiring a producer. The primary App.tsx root forwards existing props
and acquires the private binding in its effect, outside retained route layouts.
The binding claims ownership before replacing/acquiring resources, buffers
synchronous startup delivery until its cleanup is acquired and defers the first
flush until the effect can return that cleanup. A cold initial string precedes
staged live strings. Subsequent URLs go directly to the existing router without
serializing promises, deduplicating events or retrying blocked/guarded requests.
Synchronous throws, rejections and refusals use fixed diagnostics without URL or
error payloads. No public router readiness API or dependency was added.

Replacement, unmount and module HMR disposal retire callbacks and pending strings
before cleanup; late acquired handles are released after reentrant replacement.
Old cleanup cannot affect the newer owner. Setup failure retires the attempt and
permits remount/rebind; no automatic retry timer or durable queue is provided.
Disposal suppresses late diagnostics but does not cancel navigation already
handed to the router globally. Per-secondary-window links, exactly-once delivery
and recovery of URLs consumed by a failed setup are not claimed. Real Octane
layout/effect/HMR ordering remains unqualified; fake hooks cannot establish it.

Nine helper/root-entry source models are authored, all UNRUN. They cover startup
buffer/initial ordering, early cleanup, setup retry, throw/rejection/refusal
privacy, overlapping admission, replacement/cleanup failure, fake HMR, reentrant
late-handle cleanup and actual entry prop/effect wiring. They use a fake producer,
router, HMR and hooks rather than the Octane compiler or native SDK. Public guide,
private host README, Octane navigation reference and appkit-route-links recipe
reconcile the same ownership/qualification boundary. No generated catalog,
other-target startup, shared CLI/Vite/UI manifest or audit snapshot was changed.
This repairs private proving-host/bootstrap behavior without a public API change;
no release note or React Aria presence-level coverage update is needed.

Exact deferred commands, pending this human's verification go-ahead:

```sh
pnpm exec turbo run test --filter=@octane-xplat/platform
pnpm exec turbo run typecheck --filter=...@xplat/app --filter=...@octane-xplat/platform --filter=@xplat/macos
pnpm exec turbo run build --filter=@xplat/macos
pnpm exec turbo run smoke --filter=@xplat/macos
pnpm exec turbo run verify-hmr --filter=@xplat/macos
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"AppKit incoming route links package"}' -- pnpm exec turbo run package --filter=@xplat/macos
pnpm check:recipes
pnpm check:docs
pnpm check:doc-examples
```

The smoke script launches native automation and checks 30 existing action-dispatch
assertions; verify-hmr touches App.tsx and checks a retained mounted root. Neither
alone proves cold/warm OS URL delivery, link ordering or root disposal. These
runners contain no direct image capture, but any downstream visual phase remains
unauthorized. No runner was started. check:docs/check:doc-examples remain absent
from this isolated revision's scripts; shared in-flight tooling was not copied.
Four source files and three scoped new documentation fences syntax parsed;
local documentation paths and staged semantic/whitespace review are lightweight
source checks only. No tests, compiler transforms, typechecks, builds, probes,
native/OS/AX/visual analysis or packaging ran. Actual cold/warm launch, effect/
attachment/focus/VoiceOver/memory behavior, scheme registration/signing, installed
consumers and native HMR remain unqualified. Evidence-gated checkboxes stay open;
persistent goal remains active.

## Shared clipboard feedback lifetime

The maintained CopyTextDemo uses useClipboard for ordinary copy-and-confirm
controls. That same hook also serves app/sandbox exports, making feedback
ownership a higher-demand gap than optional integrations. Earlier AppKit work
normalized native writer capability and platform failures; it did not protect
the hook after owner teardown. Source inspection found an outstanding write
could set state, announce success and create a new timer after cleanup. A held
trigger could start another write after unmount, and a throwing announcement
could reject a completed write before timer/callback setup. No real clipboard
operation or native failure was observed.

The fix belongs in the shared hook because this lifetime logic is identical on
all targets; no platform leaf or public type fork is introduced. The native
writer remains behind its existing AppKit leaf. Cleanup retires the hook's
lifetime generation before clearing its timer. Each attempt checks ownership
before producing text, after producer reentry and after the platform result;
held triggers resolve false without new work. Already submitted writes are not
cancelled: their promises retain actual outcomes while retired feedback is
suppressed. Reset versions guard even a cleared-but-held callback from shortening
a newer success. Timer ownership precedes announcement reentry, and an unavailable
announcement cannot change the write result. Notification callback errors retain
the existing caller-visible rejection behavior. Independent overlapping writes,
failed-attempt feedback, default/reset duration and activation-event isolation
remain unchanged. Retained route panes are still mounted owners; no visibility
or global cancellation gate is added.

Seven universal and three DOM lifecycle/concurrency cases are authored, all
UNRUN. The new AppKit test entry imports the existing universal suite under
macOS resolution with mocked clipboard/announcement producers and an object
driver. No native SDK, pasteboard, OS key/pointer input or speech runs in that
model. Existing mobile/web tests remain in their own configurations. The public
copy guide, Octane services reference, keyboard-clipboard AC2 and fix note
reconcile the same behavior. Semantic history traced the hook to 7a33c40c5;
local git tag containment includes v0.15.0 through v0.18.0, so the released bug
gets a fix note. No dependency, package manifest, generated catalog, other-target
leaf, renderer or shared audit snapshot changed. No React Aria presence-level
API change is involved. Semantic impact lists CopyTextDemo and sandbox callers
but reports incomplete resolver edges; it is not a complete caller graph.

Exact deferred commands, pending this human's verification go-ahead:

```sh
pnpm exec turbo run test --filter=@octane-xplat/ui -- src/use-clipboard.web.test.tsrx
pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/use-clipboard.mobile.test.tsrx
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/use-clipboard.macos.mobile.test.tsrx
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
pnpm exec turbo run pack:check --filter=@octane-xplat/ui
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"AppKit clipboard feedback package"}' -- pnpm exec turbo run package --filter=@xplat/macos
pnpm check:recipes
pnpm check:docs
pnpm check:doc-examples
```

The native test task also runs its existing Node prelude before filtered Vitest;
all commands above remain deferred. check:docs/check:doc-examples are absent in
this isolated revision; shared in-flight tooling is not copied. Source/TSRX and
scoped documentation syntax, local paths/anchors and staged semantic/whitespace
review are the permitted checks. No tests, compiler transforms, typechecks,
builds, probes, native/OS/AX/visual analysis, clipboard reads/writes, speech or
packaging ran. Actual hook/effect/timer ownership, keyboard/pointer activation,
VoiceOver, bridge rejection timing, navigation retention and installed consumers
remain unqualified on AppKit; shared mobile/web runtime is also unverified for
this change. Qualification checkboxes stay open; persistent goal stays active.

## AppKit locale and device purpose imports

Demand assumption: ordinary localized forms/settings need correct language and
region metadata before optional integrations. The localization guide uses system
locale detection and explicit matching; the maintained HumanQA flow consumes
device information. Source review found canonical/explicit .ts locale/device
subpaths still mapped to generic files importing NativeScript Device, which the
AppKit shim does not export. The AppKit root had separate metadata and split the
second locale subtag as a region, so zh-Hant-TW produced region Hant. Its top-level
Intl read could also throw during import. These are source/import risks, not a
newly executed native or production-bundle failure.

Dedicated locale/device AppKit leaves now share one module-load snapshot with
the root. Intl.DateTimeFormat provides the formatting locale; Intl.Locale parses
and canonicalizes the full tag, preserving script/extension subtags while
separating language and region (including numeric regions). Underscores normalize
to hyphens. Unavailable, throwing or invalid Intl read/parsing falls back to
tag/language en and an empty region. No fallback parser, dependency, OS preference
subscription or preferred-language enumeration is added. Device retains the
existing macos/Mac/Apple identity and unknown OS version; hardware/model/version
discovery is outside this repair. Lingui's own detector and other-target leaves
remain unchanged. App catalog selection stays an explicit separate step.

Four explicit metadata export keys pair macos runtime/generated declaration
paths for canonical and existing .ts spellings; non-macOS defaults retain the
old wildcard paths. The platform root re-exports the same leaf objects. The
existing state fixture includes these dependencies. Four new source models cover
canonical script/numeric/extension/language-only tags, unavailable/invalid Intl,
root/purpose identity/snapshot lifetime and export conditions. Packed source
checks add an isolated metadata lane (so root imports cannot mask a broken
purpose path), and existing Bundler/NodeNext/declaration-only AppKit consumers
include the canonical/explicit paths. All models/packed checks are authored UNRUN.
No renderer/compiler/native execution is implied by a fake Intl/module graph.

Guide, localization cross-link, package README, Octane services reference and
appkit-locale-metadata recipe document snapshot/fallback and qualification limits.
Semantic impact reports incomplete, heavily name-colliding edges; target imports
and the existing localization/HumanQA entry points were reviewed directly. The
entity history command returned no root-locale changes; exact v0.18.0 source
still contains the root split and wildcard map, establishing released behavior
for the fix note without inventing entity history. No shared CLI/Vite/UI manifest,
public type shape, generated declarations or shared audit snapshot changed.
No React Aria presence-level equivalent changes are involved.

Exact deferred commands, pending this human's verification go-ahead:

```sh
pnpm exec turbo run test --filter=@octane-xplat/platform
pnpm exec turbo run typecheck --filter=...@octane-xplat/platform
pnpm exec turbo run typegen --filter=@octane-xplat/platform
pnpm exec turbo run test:packed --filter=@octane-xplat/platform
pnpm exec turbo run pack:check --filter=@octane-xplat/platform
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"AppKit locale metadata package"}' -- pnpm exec turbo run package --filter=@xplat/macos
pnpm check:recipes
pnpm check:docs
pnpm check:doc-examples
```

check:docs/check:doc-examples remain absent in this isolated revision; shared
in-flight tooling was not copied. Seven source files and six scoped documentation fences syntax parsed. One
manifest parsed; four AppKit runtime export paths and 18 local documentation
paths/anchors exist. Staged semantic/whitespace review completes the permitted
source checks only. No tests, compiler transforms, typechecks,
typegen, builds, probes, native/OS/AX/visual analysis, preference reads/changes or
packaging ran. Actual JavaScriptCore Intl/locale data, generated declarations,
installed consumer resolution, cold/relaunch behavior, OS preference changes,
RTL/component output and supported macOS versions remain unqualified. The
snapshot does not promise live OS changes. Evidence-gated checkboxes stay open;
persistent goal remains active.

## AppKit system-bar import and method shape

The maintained shared Services demo exposes ordinary system-bar tint/reset
calls, though its AppKit-specific screen does not exercise phone bars. After
locale/device imports, the remaining direct system-bars prerequisite still
selected the phone file requiring Color, absent from the AppKit shim. The root
had an explicit unsupported setColor stub but omitted the shared setStatusBarStyle
method. These are source import/shape gaps, not newly observed native failures.
Fix the common setup/import boundary without inventing a native chrome feature.

A dedicated AppKit leaf now supplies both shared void methods with matching
argument types. Root and direct canonical/existing .ts paths share that object;
two explicit export keys pair native runtime/generated declaration paths and
retain other-target defaults. Each method emits only the existing fixed
unsupported warning, never its argument, and a diagnostic failure is contained.
No native status/navigation/window/title/toolbar/menu bar API is invoked. No
new dependency, shared type shape or mobile/web behavior is added. This source
repair is deliberately not an accepted not-applicable decision or closure of
issue #62's phone-system-bar/desktop-contract gate.

Three source models are authored, all UNRUN: fake-root/leaf identity and both
method shapes/fixed diagnostics, diagnostic failure containment and export maps.
The existing isolated packed purpose lane and Bundler/NodeNext/AppKit generated
consumers add canonical/explicit system-bars imports, valid method shapes and
invalid-argument type assertions. They remain UNRUN. Fake module/console models
cannot qualify real root dependencies, generated types or installed resolution.
The service guide, package README, known limits, Octane reference, target recipe
and fix note preserve the unsupported boundary; no acceptance checkbox changes.
The stable v0.18.0 root/generic source and wildcard map retain this released gap.
Source graph impact has incomplete name/member edges, so exact imports and
Services calls were inspected. No shared CLI/Vite/UI manifest, shim, generated
audit/declaration output or React Aria presence-level entry changed.

Exact deferred commands, pending this human's verification go-ahead:

```sh
pnpm exec turbo run test --filter=@octane-xplat/platform
pnpm exec turbo run typecheck --filter=...@octane-xplat/platform
pnpm exec turbo run typegen --filter=@octane-xplat/platform
pnpm exec turbo run test:packed --filter=@octane-xplat/platform
pnpm exec turbo run pack:check --filter=@octane-xplat/platform
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"AppKit system-bars import package"}' -- pnpm exec turbo run package --filter=@xplat/macos
pnpm check:recipes
pnpm check:docs
pnpm check:doc-examples
```

check:docs/check:doc-examples remain absent in this isolated revision; shared
in-flight tooling was not copied. Five source files and five scoped documentation fences syntax parsed. One
manifest parsed; two AppKit runtime export paths and 14 local documentation
paths/anchors exist. Staged semantic/whitespace review completes the permitted
source checks only. No tests, compiler transforms, typechecks, typegen, builds, probes,
native/OS/AX/visual analysis, native chrome changes or packaging ran. Real root
startup, generated/installed runtime/declaration resolution and the separate
accepted desktop system-bar contract remain unqualified/open. Evidence-gated
checkboxes stay open; persistent goal remains active.

## AppKit scroll geometry subscription ownership

The next demand area was ordinary bounded scrolling/content resize, before niche
integrations. ScrollableArea and windowed lists use the renderer's arranged
viewport onLayoutChanged path. Pull-to-refresh remains missing, but Apple documents
NSScrollView contentInsets as a tiling inset for scroll-view subviews, not the
UIScrollView contentInset mechanism used by the existing iOS refresh controller.
The baseline supports macOS 13.5+; the current NSScrollView docs label a refresh
controller Beta, so baseline availability cannot be assumed. Live-scroll gesture
phase, bounce distance at release and docking still require a native probe;
resource authorization has not been granted. No substitute Refresh button or
unsupported facade is counted as implementing that pull gesture. Sources:
[contentInsets](https://developer.apple.com/documentation/appkit/nsscrollview/contentinsets),
[live-scroll end](https://developer.apple.com/documentation/appkit/nsscrollview/didendlivescrollnotification)
and [current API](https://developer.apple.com/documentation/appkit/nsscrollview).

Independent source review found the existing geometry prerequisite acquired
observers through array.map without unwinding partial failure, stopped cleanup
at the first removal failure and cleared shared node markers after native
side effects. A thrown layout call left its scheduled bit set. Work could also
continue clamping/notifying after native layout reentered teardown, and initial
readiness was consumed before native scroll success. No native failure was
executed or observed; these are source findings.

The geometry helper now claims the node's schedule/cleanup markers before old
cleanup or new registration. It captures the notification center and methods,
unwinds partial setup preserving the setup error, releases late acquired handles
from retired attempts and invalidates callbacks before attempting every owned
removal once. Cleanup diagnostics contain no native/error/geometry payloads.
Notification-enable flags remain enabled because other renderer readers share
those views. The renderer clears old cleanup fields before calling native
teardown, so a new binding acquired by cleanup reentry survives.

Queued passes check current scroll/clip/document ownership before and after
native layout/positioning. View replacement retires the old subscription;
rebinding remains the renderer caller's job, without a hidden polling/retry loop.
Finite nonnegative dimensions and finite origins gate native writes. Failures
leave later frame attempts available, and initial readiness commits only after
successful scrolling/reflection. Each queued task keeps its own lease, so a
consumer-triggered next pass is not cleared by the previous task's completion.
Existing physical/flipped coordinate, axis and public layout-event shapes remain.
No dependency, manifest, public API/type, other-target renderer or shared audit
snapshot changed. No React Aria presence-level entry changes are involved.

Nine additional source/caller cases are authored, all UNRUN. They cover partial
setup/retry, reentrant late handles, all cleanup attempts, layout teardown/view
replacement, layout/notification failure recovery, invalid geometry/failed initial
positioning, consumer-queued work, captured center/method ownership and the actual
renderer unbind caller slice. Existing geometry/dispatch cases remain unrun too.
Public scrolling guidance, renderer README, Octane primitive reference and
appkit-logical-scroll AC5 reconcile the scope; the released fix note is justified
by exact v0.18.0 helper source with the same map/scheduled/readiness behavior.
Semantic impact resolves the helper and tests, while setLayoutAction member edges
are incomplete; focused caller and cleanup spans were reviewed directly.

Exact deferred commands, pending this human's verification go-ahead:

```sh
pnpm exec turbo run test --filter=@octane-xplat/macos-renderer
pnpm exec turbo run typecheck --filter=...@octane-xplat/macos-renderer
pnpm exec turbo run test:packed --filter=@octane-xplat/macos-renderer
pnpm probe doctor
pnpm probe run examples/probes/scroll-metadata.macos.tsrx --target macos --watch
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"AppKit scroll geometry package"}' -- pnpm exec turbo run package --filter=@xplat/macos
pnpm check:recipes
pnpm check:docs
pnpm check:doc-examples
```

The existing metadata fixture is not a pull-refresh phase/docking probe and does
not cover forced native registration/layout/removal failures. That separate native
feasibility probe remains deferred, not passed. check:docs/check:doc-examples are
absent from this isolated revision; shared in-flight tooling was not copied.
Three source files and four scoped documentation fences syntax parsed; seven
local paths/anchors exist. Staged semantic/whitespace review completes the
permitted source checks only. No tests, compiler transforms, typechecks,
builds, probes, native/OS/AX/visual analysis or packaging ran. Real native layout/
notification/attachment/reentry/scroll/elasticity, memory and installed consumers
remain unqualified. Pull-to-refresh and all evidence-gated checkboxes stay open;
persistent goal remains active.

## AppKit idle pull-refresh phase and docking diagnostic

The scroll geometry repair did not resolve the missing pull gesture. A dedicated
idle fixture now makes the next native experiment concrete: numeric viewport,
clip/document, logical top offset, current-event phase/momentum and notification
snapshots, paired with microtask samples. It records at most 256 rows without
rerendering on every event. Current-event association can be absent or unrelated;
no release semantics are inferred from a notification name or a mounted control.

Manual controls switch artificial short/long content, reserve a 64-point header,
try a local top inset with auto-adjustment disabled, toggle allowed elasticity,
record/clear snapshots and unmount/remount the reader. These affect only the
fixture's own scroll view after user activation. Setup owns native observation,
cleanup retires queued samples before releasing handles and restoring copied
local insets/auto-adjustment/elasticity. Logs contain fixed diagnostic messages
and numeric test geometry, never native objects, user text or screenshots.

The fixture is maintained as the diagnostic for the outstanding AppKit scroll
phase/docking contract. It is not a refresh controller or product implementation,
and has no automatic OS input, Refresh-button substitute or qualification
assertions. Its run hook records mounting only. No feature, API, recipe criterion
or release promise is added by this internal fixture; no release note is needed.
Silo experiment b9171383-2e4d-46b9-90bf-0aa3a6b18295 is queued with NULL outcome, not running/passed.
It does not grant resource or visual authorization.

Exact deferred commands, pending this human's task-specific go-ahead:

```sh
pnpm probe doctor
pnpm probe run examples/probes/pull-refresh-geometry.macos.tsrx --target macos --watch
pnpm exec turbo run typecheck --filter=...@octane-xplat/macos-renderer
```

After authorization, record actual macOS/JSC/input-device versions, pull/retreat/
release traces, short-content elasticity, inset-vs-reserved-header geometry and
unmount/remount effects. If phases cannot be associated with notifications, a
renderer event seam still needs investigation. Raw/bounded/RTL/nested scrollers,
cancellation, asynchronous refresh ownership and presentation remain separate
implementation/qualification work. Source/TSRX syntax and semantic/whitespace
review only; no compiler, tests, typechecks, probe doctor/runner, native build,
OS/AX/visual analysis, local native-property changes or packaging ran. The fixture
and the full pull-to-refresh feature are UNRUN/unqualified. Goal remains active.

## AppKit patterned border source path

Demand is grounded in the maintained native FileInput leaf's vx-fileinput--dropzone
class and the shared chrome.css dropzone/browse rules, which request dashed
borders. The renderer previously consumed border-style without painting its
pattern. Ordinary attachment affordances take priority over decorative charts or
new service integrations. This is source demand/evidence, not a captured visual
failure or native presentation result.

A target-only pure resolver now handles border-style side shorthand, per-side
longhands and border edge shorthand ordering without coercing unrelated style
objects or inherited dictionary keys. The renderer paints dashed/dotted with
native CAShapeLayer strokes and explicit NSNumber dash arrays. A uniform
pattern uses one closed rounded path; mixed sides retain independent widths,
colors and styles with the existing side/outer-round clipping paths. Paths and
masks resize with the frame. None/hidden sides paint nothing and pass zero border
width to Mason. Removing the style preserves the existing width-only native solid
default. Obsolete pattern/mask/cache state releases back to the solid fast path.
Existing radius/width/color normalization and implicit-width/shorthand limits
outside this style repair are not a claim of full CSS box-model equivalence.

The resize prerequisite now owns the box-frame observer record before acquisition
or former cleanup. It captures the center/removal method, suppresses incomplete,
retired/replaced callbacks, releases late handles and retains retry after setup
or callback failure. Teardown retires before removal and contains cleanup errors
with fixed diagnostics. Shared frame-enable flags stay on for other readers.
Native view/style replacement revalidates before installing observation; no new
polling loop is added. This also serves existing rounded borders, shadows and
percent transforms; their separate semantic/presentation limits are unchanged.

Twelve new source cases are authored, all UNRUN: three resolver/pattern models,
four real CSS/paint state cases (including the maintained FileInput rule), four
actual-helper observer ownership cases and one Mason edge-sizing case. The old
mixed dashed-edge model now checks a clipped stroke rather than solid fill.
AppKit test helpers supply the pure resolver to existing source slices and box
pattern models fake NSNumber boxing; no actual native array/number bridge is
exercised. The idle border-styles fixture and CSS sibling provide width/radius/
style/mixed-side/resize controls, with mounting-only run metadata. No fixture,
compiler or native behavior has run.

Public styling guide, renderer README, Octane styling reference, target recipe
and feature note document the same subset. Double/groove/ridge/inset/outset still
warn once per node/style and approximate solid. Non-solid outlines retain their
existing solid approximation and are not implemented by this border change.
Corner joins, fractional widths, per-side dash distribution, scale/antialiasing,
shadow/clipping and full CSS parity remain native qualification work. No public
API/type export, dependency, package manifest, shared theme, other-target renderer
or shared audit snapshot changed; no React Aria presence-level row changes.

Primary native API references: [CAShapeLayer dash pattern](https://developer.apple.com/documentation/quartzcore/cashapelayer/linedashpattern),
[line caps](https://developer.apple.com/documentation/quartzcore/cashapelayer/linecap)
and [Quartz path stroking](https://developer.apple.com/library/archive/documentation/GraphicsImaging/Conceptual/drawingwithquartz2d/dq_paths/dq_paths.html).
Apple's markdown dash-property reference was read as text after the web reader
rejected its markdown content type; its embedded image link was not fetched or
analyzed. API documentation and the local macOS SDK declarations are source
feasibility evidence, not a native bridge/drawing pass.

Exact deferred commands, pending this human's verification go-ahead:

```sh
pnpm exec turbo run test --filter=@octane-xplat/macos-renderer
pnpm exec turbo run typecheck --filter=...@octane-xplat/macos-renderer
pnpm exec turbo run test:packed --filter=@octane-xplat/macos-renderer
pnpm probe doctor
pnpm probe run examples/probes/border-styles.macos.tsrx --target macos --watch
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"AppKit patterned border package"}' -- pnpm exec turbo run package --filter=@xplat/macos
pnpm check:recipes
pnpm check:docs
pnpm check:doc-examples
```

check:docs/check:doc-examples remain absent in this isolated revision; no shared
in-flight tooling is copied. Nine source/TSRX files, one CSS source and five
scoped CSS examples syntax parsed; 17 local paths/anchors exist. Semantic and
whitespace review complete the permitted source checks only. No tests, compiler
transforms, typechecks, builds, probe doctor/runner, native/OS/AX/visual analysis
or packaging ran. Native NSNumber/CAShapeLayer/path/notification behavior, real
resizing/input/AX, corner/side geometry, memory, installed consumers and pixels
remain unqualified. Native-resource authorization does not grant visual analysis;
that boundary stays explicit without requesting it. The general non-solid
border/outline checkbox and all evidence gates remain open; goal stays active.

## AppKit label overflow CSS source path

Demand is grounded in the maintained TextWrap sandbox's nowrap style and
ScrollableAreaStickyPassthrough's nowrap rows, plus the shared table CSS. The
AppKit Text leaf forwards styles to label, but syncLabelOverflow read only
direct props and applyStyle treated these CSS keys as unsupported. This is
source evidence, not an observed OS text/layout failure. Ordinary readable
titles and rows take priority over niche integrations.

The label helper now reads normal/nowrap and clip/ellipsis from effective CSS
when the corresponding explicit host prop is absent. maxLines and direct-prop
validation remain unchanged; a one-line limit still forces one line. Style
application and removal refresh cell modes after all declarations settle,
recompose text paragraphs and reconcile the existing implicit one-line height.
Explicit height/line-height stays in control. Unsupported CSS values use the
existing once-per-property fixed diagnostic and default mode; no supplied style
value or text appears in that warning.

Attributed plain strings now always carry the current paragraph mode/alignment
when decoration or letter spacing requires attribution, even without line-height.
Apple documents that attributed text ignores the control's paragraph settings:
[line-break strategy](https://developer.apple.com/documentation/appkit/nstextfield/linebreakstrategy).
The existing native line count/truncation mapping is retained; see
[maximum lines](https://developer.apple.com/documentation/appkit/nstextfield/maximumnumberoflines)
and [last-line truncation](https://developer.apple.com/documentation/appkit/nscell/truncateslastvisibleline).
These primary references explain the source repair, not native proof.

Seven new cases are authored, all UNRUN: five mode/prop/paragraph/sizing models
and two real-cascade models using the maintained table truncation CSS. The latter
distinguish a rule on the label from a rule on its ancestor. White-space inherits;
text-overflow does not, so this is only a Table whitespace prerequisite and is
not a claim of complete table ellipsis. An existing heading source model gains
paragraph/cell fakes for the changed attributed writer. The idle text-overflow-css
fixture exercises plain/formatted titles, CSS modes, width/content and explicit
line limits manually; its run hook records mounting only. Static fixture styles
stay in the CSS sibling. No fixture or compiler transform has run.

Public styling guide, renderer README, Octane reference, feature note and target
recipe describe the same subset. No shared types/exports, theme, other-target
renderer, dependencies or audit snapshots changed. CSS whitespace preservation/
collapse, text-wrap balance/pretty, per-span whitespace and line-clamp remain
outside claims. Full text is never shortened by this source path; actual native
measurement, truncation, resizing, copying/selection, VoiceOver, lifetime/memory,
installed consumers and pixels remain unqualified.

Exact deferred commands, requiring this task's explicit human authorization:

```sh
pnpm exec turbo run test --filter=@octane-xplat/macos-renderer
pnpm exec turbo run typecheck --filter=...@octane-xplat/macos-renderer
pnpm exec turbo run test:packed --filter=@octane-xplat/macos-renderer
pnpm probe doctor
pnpm probe run examples/probes/text-overflow-css.macos.tsrx --target macos --watch
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"AppKit CSS text overflow package"}' -- pnpm exec turbo run package --filter=@xplat/macos
pnpm check:recipes
pnpm check:docs
pnpm check:doc-examples
```

check:docs/check:doc-examples remain absent in this isolated snapshot; no shared
in-flight tooling is copied. Five source/TSRX files, one CSS source, four scoped
CSS and four TSX documentation fences syntax parsed; twelve local paths/anchors
exist. Focused semantic/source and whitespace review are the other permitted
checks. No tests, typechecks, compiler
transforms, probes, native builds, OS/AX automation, packaging or visual analysis
ran. Native-resource authorization would not authorize visual analysis. All
evidence-gated checkboxes remain open and the persistent goal stays active.

## AppKit data Table body text overflow

Demand is grounded in the maintained Astryx table-page template, which requests
textOverflow="truncate" for an invoice table, and the existing bounded native
table fixture. TableTextOverflow is documented for default-rendered body text.
The AppKit leaf previously passed the setting to context/plan, but created bare
body labels without any native mode props. The shared plan does not assign
overflow behavior and CSS text-overflow does not inherit from a container. The
renderer CSS repair alone therefore did not fulfill this Table contract. This
is source evidence, not a captured native failure.

A private component now renders each scalar body value through a named props
boundary (rather than a JSX helper called with a bare scalar). Only the shared
plan's isDefaultRenderer entries receive table-owned normal/clip/unlimited or
nowrap/ellipsis/one-line modes. Mode removal returns to the wrap default. Full
strings remain in the native label. A target-only CSS sibling gives those
labels minimum width zero, maximum width 100 percent and flex grow/shrink so
the bounded cell can constrain the text. The source file is already covered by
the UI package's published src glob; no manifest/dependency change was needed.

Custom renderer strings/numbers keep the existing primitive label path without
table-owned modes or sizing class; descriptors/other renderables still pass
through TableSlot. Headers and child-composed cells are outside this default
body-text setting. No opaque child inspection or descendant property copying
was introduced. Column alignment, custom rich-text clipping, global Table
accessibility/keyboard and large-list performance are separate open contracts.

Four object-driver source cases are authored, all UNRUN: wrap/truncate/removal
with full text and retained label, header/custom-primitive separation, custom
slot state/owner retention during peer mode changes, and default/custom numeric
text transitions clearing/restoring owned props. Two AppKit universal compiler
cases with HMR off/on are also authored and UNRUN. The manual table-scroll
fixture now toggles default body wrap/truncate and artificial long/short team
text alongside its existing viewport/column/width/sticky/RTL controls. Its run
hook remains mounting-only. No compiler/test/fixture/native behavior has run.

The public table guide, UI README link, Octane primitive reference, feature note
and table-scroll recipe AC6 reconcile this subset. Existing ACs/qualification
rows are not rewritten as passes; no React Aria presence-level export changed.
Native Mason column/row measurement, long unbroken words, ellipsis/painting,
resize/sticky composition, input/copy/selection/AX, memory and clean installed
supported-macOS consumers/pixels remain unqualified. The source audit snapshots
and evidence-gated issue checkboxes stay unchanged.

Exact deferred commands, requiring this task's explicit human authorization:

```sh
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/table-text-overflow.macos.mobile.test.tsrx
pnpm exec turbo run test:macos --filter=@octane-xplat/ui
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
pnpm exec turbo run pack:check --filter=@octane-xplat/ui
pnpm probe doctor
pnpm probe run examples/probes/table-scroll.macos.tsrx --target macos --watch
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"AppKit table body text package"}' -- pnpm exec turbo run package --filter=@xplat/macos
pnpm check:recipes
pnpm check:docs
pnpm check:doc-examples
```

check:docs/check:doc-examples remain absent in this isolated snapshot; no shared
in-flight tooling is copied. Four source/test/fixture files, one CSS source and
four scoped TSX documentation fences syntax parsed; six AC6 local paths/anchors
exist. Focused semantic/source and whitespace review completes the permitted
checks. No tests, typechecks, compiler
transforms, probes, native/OS/AX automation, builds, installs, packaging or visual
analysis ran. Native-resource authorization would not authorize visual analysis.
The persistent goal remains active; this is one common table-flow repair, not
fully qualified Table or desktop support.

## AppKit label alignment source path

Demand comes from the maintained invoice table-page template's end-aligned
quantity/rate/amount columns. The shared table plan supplies textAlign: end in
cell styles and CSS inherits it to text labels. Source review found the AppKit
label branch mapped everything except left/right to center, including start,
end, justify and unsupported values. Correct label alignment is a renderer
prerequisite for those ordinary table rows; this was not a captured OS failure.

The target-only helper now maps left/right/center/justify explicitly and resolves
start/end from effective CSS direction (ltr fallback). The final pair settles
after all style declarations and removals, independent of key order. CSS
inheritance and local overrides use the existing cascade. Unknown values warn
by property and default without coercing supplied style values. Removal returns
to the remaining cascade/start edge, retaining the existing sheet-grabber center
baseline. Unchanged native alignment is not rewritten. Cell alignment updates
precede the existing syncText paragraph recomposition, including attributed
plain/spacing/decorated and formatted text paths. No text is shortened.

Apple's [NSTextAlignment](https://developer.apple.com/documentation/appkit/nstextalignment)
and [paragraph alignment](https://developer.apple.com/documentation/appkit/nsparagraphstyle/alignment)
references distinguish explicit alignment from native Natural's script/localization
semantics; CSS start/end uses the [CSS Text alignment contract](https://drafts.csswg.org/css-text/#text-align-property).
The helper therefore maps to physical native edges using the CSS direction input.
[NSControl alignment](https://developer.apple.com/documentation/appkit/nscontrol/alignment)
also documents that setting alignment can affect an active edit, motivating the
unchanged-value guard. These are API/source reasons, not native behavior proof.

Five cases are authored, all UNRUN: three actual-helper models for physical/
logical/justify/defaults, unsupported non-coercion/fixed property diagnostics,
and unchanged native writes/grabber/view absence; two real CSS/inline cascade
models for inheritance/overrides/removal, direction-only changes and declaration
order. An existing letter-spacing assertion now checks copied paragraph
alignment. The idle text-overflow-css fixture adds start/end/physical/justify/
removed modes and inherited CSS direction controls for plain/formatted labels;
its mounting-only run hook is unchanged. Nothing has run natively.

The guide, renderer README, Octane styling reference, feature note and recipe
AC4 state the same source subset. CSS direction here selects label alignment;
it does not implement CSS bidi overrides, vertical writing, per-span paragraph
alignment or a UI-provider-to-CSS direction bridge. Global Table alignment,
editable controls, script shaping, native justification/line metrics, selection,
VoiceOver, resize, memory, supported-version installed consumers and pixels need
separate qualification. No other-target renderer, shared types/exports,
dependencies, manifests or audit snapshots changed. Existing recipe assessments
and React Aria presence rows are not rewritten as passes.

Exact deferred commands, requiring this task's explicit human authorization:

```sh
pnpm exec turbo run test --filter=@octane-xplat/macos-renderer
pnpm exec turbo run typecheck --filter=...@octane-xplat/macos-renderer
pnpm exec turbo run test:packed --filter=@octane-xplat/macos-renderer
pnpm probe doctor
pnpm probe run examples/probes/text-overflow-css.macos.tsrx --target macos --watch
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"AppKit logical text alignment package"}' -- pnpm exec turbo run package --filter=@xplat/macos
pnpm check:recipes
pnpm check:docs
pnpm check:doc-examples
```

check:docs/check:doc-examples remain absent in this isolated snapshot; no shared
in-flight tooling is copied. Five source/test/fixture files, the fixture CSS,
four scoped CSS and three TSX documentation fences syntax parsed; eight AC4
local paths/anchors exist. Focused semantic/source and whitespace review
completes the permitted checks. No tests, typechecks, compiler
transforms, probes, native builds/OS/AX automation, packaging or visual analysis
ran. Native-resource authorization would not authorize visual analysis. All
evidence gates remain open and the persistent goal stays active.

## AppKit controlled composition value ownership

Demand remains ordinary Home name fields and the maintained name/message/search
examples. An editable-text source review found a prerequisite before extending
alignment: the marked-value writer assigned observation and schedule handles
after acquisition, cleaned up before retiring both records, and could let an old
flush overwrite a reentrant replacement. Registry factory/teardown effects could
also overwrite/delete a newer writer. Deferred failure diagnostics included the
native error payload. These are source findings, not observed OS/IME failures.

The target-only writer now owns latest-value intent identity/revision before
effects, rechecks after native reads/marked-state access, claims observations
and work before acquisition, suppresses incomplete/retired/held callbacks, and
attempts release of late returned handles once. Successful/equal writes clear
the intent and retire both old cleanup records before either effect; newer
values admitted during cleanup win. Dispose retires both before attempting
both releases, containing cleanup/diagnostic failures without exposing payloads.
Nested writes retain the suppression depth until their outer write finishes.

The view registry claims initialization before the adapter factory, coalesces
reentrant latest/unset values, and removes/marks an owner before disposal. Old
factory completion/failure/cleanup cannot overwrite/delete a replacement.
Immediate read/setter failures still propagate and a published writer survives
for retry. Deferred schedule/read/marked/write failures retain the latest intent
for a later explicit prop update or commit notification, log fixed diagnostics
only, and retire observation to avoid repeated window-update retries. There is
no new polling loop or native input reconstruction.

The native adapter captures the notification center/removal method/receiver,
guards setup readiness and current view/window identity, and tombstones before
idempotent removal. Missing/unattached scope returns no false cleanup handle;
the private adapter type permits undefined for this case. Replaced scope during
registration attempts token release and returns no acquired subscription.
Observer migration to a new window and registration throwing after installing
an unreturned handle remain unqualified; no source model can prove native
resource release when the OS removal itself fails.

Fourteen new cases are authored, all UNRUN: twelve actual writer/registry models
for reentrant acquisition/update/factory/getter/cleanup, stale work/late handles,
captured cancellation, setup/schedule/native-write failures, explicit retry,
nested owner replacement and fixed diagnostics; two actual native-adapter source
models for captured cleanup/readiness/view/window/missing-scope retirement.
The existing adapter case now checks guarded callback delivery and idempotent
release instead of callback identity. They are source/VM models, not SDK proof.

The maintained ownership fixture adds controlled message/search peers, unset
and whole-controlled-group removal, plus a user-armed 2.5s external replacement.
That timer retires by revision/active state before cancellation and ignores held
callbacks after replacement/unmount. A pointer action can commit composition
before changing props, so the delayed control permits a future manual marked
trial; it does not automate input or establish candidate timing. Existing
uncontrolled peers and the mounting-only run hook remain. Nothing has run.

The public text-entry guide and canonical primitive link, renderer README, Octane primitive reference and
recipe AC4 reconcile the source contract. No public UI prop/type export,
dependency, manifest, other-target renderer or audit snapshot changed. No new
release note is added for this unreleased branch repair: sem history places the
writer's introduction at 2ca7ae5, and local remote/tag containment lists only
origin/feat/appkit-native-support and no release tag. This is local Git evidence,
not a registry publication audit. Existing assessments are not rewritten as
passes and no React Aria presence-level API changed.

Exact deferred commands, requiring this task's explicit human authorization:

```sh
pnpm exec turbo run test --filter=@octane-xplat/macos-renderer
pnpm exec turbo run typecheck --filter=...@octane-xplat/macos-renderer
pnpm exec turbo run test:packed --filter=@octane-xplat/macos-renderer
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/text-entry-ownership.macos.mobile.test.tsrx
pnpm probe doctor
pnpm probe run examples/probes/text-entry-ownership.macos.tsrx --target macos --watch
pnpm probe run examples/probes/controlled-text.macos.tsrx --target macos --watch
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"AppKit composition value ownership package"}' -- pnpm exec turbo run package --filter=@xplat/macos
pnpm check:recipes
pnpm check:docs
pnpm check:doc-examples
```

check:docs/check:doc-examples remain absent in this isolated snapshot; no shared
in-flight tooling is copied. Five source/test/fixture files and five scoped TSX
documentation fences syntax parsed; eight AC4 local paths/anchors exist. Focused
semantic/source and whitespace review completes the permitted checks. Tests/typechecks/compiler transforms,
probe doctor/runner, native/OS/AX automation, builds, packaging and visual analysis
remain unrun. Real IME/editor identity, candidate/commit/echo timing, reparenting,
selection/undo, editable alignment, physical cleanup/memory, supported-version
installed consumers and pixels remain unqualified. Native-resource authorization
would not authorize visual analysis. All evidence gates stay open and the
persistent goal remains active.

## AppKit native file type filters and MIME hints

Demand is ordinary attachment selection: the maintained shared FileInput demo
requests image/* plus PDF, and the sandbox FileInputBasic example requests PDF
and DOCX. Assume these file and image flows outrank new niche integrations.
Source review found that unknown MIME members disappeared from the finite picker
table, potentially producing an unrestricted panel; mixing */* with an extension
could instead narrow the request. A reused any-type panel did not explicitly
clear prior restrictions. This is source evidence, not an observed OS failure.
The historical Files/default-metadata entries and audit snapshot remain history;
this entry supersedes their finite-only filter/hint limitation.

The target-only filter helper resolves the whole comma-separated union before
filter mutation/presentation. Explicit extensions are normalized/deduplicated;
image/audio/video/text wildcards use native type-family identifiers rather than
the finite table. Video uses public.movie plus public.video to include movies
without broadening to audio-only audiovisual types. Concrete MIME uses every
registered native result, declining dynamic-only guesses, then known concrete
extension fallbacks. Unknown/malformed restrictions (including unsupported
wildcard families and bare *) reject with fixed UnsupportedFileTypeError;
unknown members are never silently dropped. Empty or */* requests allow any file,
including */* mixed with restrictions. Starting folders, multiplicity, reference
shape, null/empty cancellation and read/write/export code remain unchanged.

When every member has a native type and the property exists, set allowedContentTypes
with identifier-deduplicated types; otherwise keep the complete extension/UTI
union in allowedFileTypes. Any-type resets modern filters with [] or legacy
filters with null, never the legacy empty array that Apple documents as invalid.
Disable allowsOtherFileTypes explicitly. No partial modern array may silently
lose an unresolved extension. Native aliases/conformance can differ from literal
filename/MIME validation; enabled panel entries are not content verification.

Framework loading is a prerequisite, not proof. The repository's generated
platform SDK runtime at pre-change ca0e85d06 records that reading unloaded lazy
native symbols can crash the host. Its broad framework loader was not imported
or changed. The helper lazily loads only UniformTypeIdentifiers via the host's
existing objc.import pattern (also used by auth-session.macos) or dlopen, before
reading an accessor-backed UTType. Explicit data bindings are usable directly;
failed loads never dereference a lazy class and can retry; successful loads are
cached per host. These are project-source patterns, not a new upstream runtime
finding or proof that either loader works in this app. No dependency install,
manifest/SDK generation, shared CLI/UI/GTK changes or audit regeneration occurred.

The default FileInput metadata path shares that resolver. Preserve supplied MIME;
retain a recognized requested concrete table alias first. Otherwise use a same-
native-identifier concrete alias or the OS extension type's preferred MIME, then
finite fallback hints. A broad supertype match must not relabel a concrete file.
Unknown/failed hints remain absent and can fail current MIME accept validation.
This only classifies filenames; there is no byte inspection. Existing Foundation
size snapshots and balanced metadata security scopes are unchanged; custom
pickers keep their own metadata. No persistent sandbox bookmark is added.

Primary API references (read as documentation/source rationale only):
[UTType lookup](https://developer.apple.com/documentation/uniformtypeidentifiers/uttypereference),
[filename extension lookup](https://developer.apple.com/documentation/uniformtypeidentifiers/uttypereference/init(filenameextension:)),
[movie type](https://developer.apple.com/documentation/uniformtypeidentifiers/uttypemovie),
[modern filters](https://developer.apple.com/documentation/appkit/nssavepanel/allowedcontenttypes),
[legacy extension/UTI filters](https://developer.apple.com/documentation/appkit/nssavepanel/allowedfiletypes)
and [other file types](https://developer.apple.com/documentation/appkit/nssavepanel/allowsotherfiletypes).

Eighteen new cases are authored, all UNRUN: ten parser/union/native-lookup/loader/
setter models; four actual files service panel models for setup, cancellation,
reused any reset, registered MIME and failure before presentation; four metadata/
controller cases for newly registered filename types, same-type concrete aliases,
no supertype relabeling, preserved supplied metadata and failure fallbacks. The
metadata case file now has nine cases; the files bridge file has eleven. No model
case was executed and no compiler transform or typecheck was run.

The existing fileinput-drop fixture now offers human-operated filter cycles and
single/multiple service picks alongside FileInput validation. It retains disabled/
presentation/drop comparison and selection output, releases service refs after
reporting, and never opens a panel or synthesizes a drag from its run hook. The
hook only waits for mounting; even running it would not establish OS behavior.
The guide, files README, Octane reference, recipe date-picker AC10/AC18 and feature
note explain the breaking unresolved-filter error and current hint boundaries.

Lightweight verification: eight source/fixture files parsed (seven TypeScript
files plus the TSRX fixture); eight scoped TS/TSX documentation fences parsed;
thirteen distinct new/changed local link targets and anchors resolved; the files
manifest parsed as JSON; focused semantic/whitespace review passed. These checks
executed zero tests/compiler transforms and are not a runtime or type qualification. All native framework/type availability, SDK collection/
Boolean/property bridging, supported OS versions, registered custom types,
compound/dotfile/case/symlink behavior, actual enabled/selectable files,
FileInput validation/drop delivery, panel concurrency, security grants/ref
lifetime, cancellation/focus/VoiceOver, installed consumers and visual/pixel
behavior remain unqualified. Editable text alignment and pull-refresh native
phase proof remain separate outstanding gaps.

Exact deferred commands (DO NOT RUN until this task receives explicit human
verification authorization; native resource authorization does not authorize
visual analysis):

```sh
pnpm exec turbo run test --filter=@octane-xplat/files
pnpm exec turbo run typecheck --filter=...@octane-xplat/files
pnpm exec turbo run test:packed --filter=@octane-xplat/files
pnpm exec turbo run pack:check --filter=@octane-xplat/files
pnpm probe doctor
pnpm probe run examples/probes/fileinput-drop.macos.tsrx --target macos --watch
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"AppKit file type filter package"}' -- pnpm exec turbo run package --filter=@xplat/macos
pnpm check:recipes
pnpm check:docs
pnpm check:doc-examples
pnpm check:changelog
```

The files manifest has no typecheck script in this snapshot; the touched-package/
dependents filter is still recorded for the pre-merge gate. check:docs and
check:doc-examples are absent here; do not copy another task's in-flight tooling
or claim those checks passed. Issue #62 must remain open with evidence gates
unchanged; implementation coverage and verification are separate.

## AppKit secure-storage binding and read failure boundary

Continue everyday services after attachment filtering. The maintained Services
screen uses secureStorage for a private roundtrip; session restore must distinguish
an absent token from a failed read. Source review at d308bc456 found that the
facade checked the native global repeatedly (including typeof plus a second read),
reported any class-shaped binding as supported, allowed lookup errors outside
sanitization, and mapped a missing native get result to null. These are source
findings, not observed Keychain failures or evidence of exposed user secrets.

The AppKit-only facade now captures the global once and all three callable
methods with their receiver per operation. Missing/incomplete/throwing discovery
reports unavailable, with asynchronous UnavailabilityError from operations.
A complete snapshot survives later global/method replacement for that operation;
future operations discover the current bridge. Availability is a complete bridge
check, not an OS unlock/access probe or a promise that a future operation works.
No native method executes during supported/isAvailable checks.

Read captures the dictionary reader/receiver and status once. Only the explicit
item-not-found status returns null. Missing/malformed responses, invalid status/
value and exceptions become fixed Keychain read failed without native error text,
keys or values; do not read a value on a failing status. Empty strings remain
valid. Write/remove require a true native BOOL result; malformed truthy results
cannot report success. Native failures still return false. The Objective-C
Keychain implementation, queries, service/bundle/directory namespaces, no-prompt
policy, access control, update-race handling, data and native loader are unchanged.
A JavaScript guard cannot catch a native process abort: CLI leaf loading remains
a prerequisite. The existing generic native-service audit gate stays open.

Apple's [Keychain search guide](https://developer.apple.com/documentation/security/searching-for-keychain-items)
and [item-not-found status](https://developer.apple.com/documentation/security/errsecitemnotfound)
distinguish the search status from returned data. They support the source error
classification, not bridge/runtime evidence. Initial markdown endpoints failed
to render in the web tool; indexed official Apple text was consulted instead.

Six new source/VM cases are authored, all UNRUN (nine total): incomplete bridge
rejection without dispatch; throwing global/method lookup with sanitized async
errors; one binding/method capture and correct receiver for each operation;
missing/malformed read packets; one dictionary/status read with failed-value
suppression; and strict write/remove success. Existing model fixtures now supply
complete bridges when testing native access failure. The test module would
transpile and execute the real facade, but was only syntax-parsed here; no test
module was imported or compiler transform run.

The maintained macOS Services screen catches cleanup rejection and retains fixed
status-only output. Public restore examples keep missing/unavailable states
separate and contain write/delete failure after preflight; no plaintext fallback.
The README now uses Turbo verification commands and distinguishes complete-bridge
availability from Keychain access. Recipe secure-storage AC3/AC5 and the Octane
service reference reconcile the same boundary. The original native facade commit
f378c53 is contained by local stable tags v0.10.0 through v0.18.0, so a focused
.changelog/fixes note records this correction; this is local Git tag evidence,
not a registry publication audit or native pass.

Lightweight checks: three source/example files parsed (TypeScript, test-module
JavaScript and maintained TSRX); seven scoped TS documentation fences parsed;
nine distinct new/changed local targets/anchors resolved; two manifests parsed as
JSON; focused staged semantic and whitespace review passed. Zero test modules,
compiler transforms or native operations executed. All tests/typegen/typechecks,
packed/native builds, actual class/method/dictionary/BOOL bridging, Keychain
permissions/locked/signing/sandbox policy, persistence/identity isolation, host
replacement, runtime cleanup, installed consumers, UI/VoiceOver and visual checks
remain unqualified. No native storage operation or native fixture was run.

Exact deferred commands (DO NOT RUN until this task has explicit human verification
authorization; native resource authorization is not visual-analysis approval):

```sh
pnpm exec turbo run test:macos --filter=@octane-xplat/secure-storage
pnpm exec turbo run typecheck --filter=...@octane-xplat/secure-storage --filter=...@xplat/app
pnpm exec turbo run test:packed --filter=@octane-xplat/secure-storage
pnpm exec turbo run pack:check --filter=@octane-xplat/secure-storage
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"AppKit secure-storage bridge qualification"}' -- pnpm exec turbo run test:macos-runtime --filter=@octane-xplat/secure-storage
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"AppKit secure-storage app package"}' -- pnpm exec turbo run package --filter=@xplat/macos
pnpm check:recipes
pnpm check:docs
pnpm check:doc-examples
pnpm check:changelog
```

The secure-storage/app manifests have no own typecheck scripts in this snapshot;
the touched-package/dependents filter remains the pre-merge gate. check:docs and
check:doc-examples are absent here; do not copy shared in-flight tooling or claim
passes. No dependency/manifest change, native code edit, shared CLI/UI/GTK work,
audit regeneration, native input, image inspection, new task or subagent occurred.

## AppKit checkbox current activation ownership

Demand remains ordinary forms: maintained sandbox CheckboxInputBasic/Showcase and
indeterminate examples, plus CheckboxList preferences. Source review at 98d3817b9
found that Checkbox.macos captured its last-rendered value/blocking/callbacks,
had no callback claim and no attachment retirement. Rapid local requests before
render could repeat the same request; held callbacks could use old Field gates
or act after unmount. This is source evidence, not observed physical input.
The root CheckboxInput alias already reaches this target leaf via controls.macos;
no import or renderer prerequisite change was needed.

Checkbox now stores current effective props, separately retains accepted local
intent before state/application callbacks, and claims each synchronous callback
before consumer reentry. Held handlers recheck inherited disabled/read-only props
and attachment. Mixed requests true; later local requests advance from the last
accepted intent. Controlled requests use the parent's current value, including
repeated requests when rejected, without replacing the original uncontrolled
seed. Callback throw propagates and releases the claim without undoing local
intent, matching the previous write-before-callback behavior. Stable typed host
ref teardown retires attachment/claim; finally only releases its matching claim.
The native row and metadata/tooltip/style/accessibility shape are retained.

Six object-driver cases are newly authored, all UNRUN (nine in the leaf case
file): rapid mixed/local requests before render; callback reentry and independent
next request; throwing callback release with retained local state; held handlers
with current inherited gates/controlled callbacks; callback-driven detach and
retired handlers; controlled rejection and original seed on controlled release.
These models invoke the actual leaf but cannot prove native ref/event timing.
No test module/compiler transform was executed.

The existing checkbox-list fixture adds human-operated standalone local/controlled
choices, disabled/read-only/parent-acceptance gates, attachment/removal controls
and request history. The original run hook remains direct list-child selection
only; it does not operate the new controls or prove OS input. No probe was run.
Guide, Octane reference, recipe appkit-checkbox-metadata AC3 and the existing
unreleased metadata feature note reconcile the current subset. Local stable tags
do not contain the target leaf's introducing commit b3620ff, and only the current
origin branch contains it; no separate stable-fix note or registry audit is claimed.
The UI README has no checkbox-specific claim to reconcile.

The documented async changeAction/mixed rollback conflict is still open: no
shared callback type, rollback semantics, other platform leaf, provider context,
dependency, manifest or React Aria presence entry was changed. The full native
support goal and all evidence-gated issue checkboxes remain open; this does not
silently label async saves or broader checkbox parity complete.

Lightweight checks: three TSRX source/test/fixture files and five scoped TSX
documentation fences parsed; six distinct new/changed local targets/anchors
resolved; the UI manifest parsed as JSON; focused staged semantic and whitespace
review passed. Zero tests/compiler transforms were executed. Native tap/key/
hit testing, ref/teardown/reparent/HMR timing, nested tooltip/control arbitration,
focus/Tab/VoiceOver/mixed announcements, layout, OS versions, installed consumers
and visual/pixel behavior remain unqualified.

Exact deferred commands (DO NOT RUN until explicit human verification authorization
for this task; native resource authorization is not visual-analysis approval):

```sh
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/checkbox.macos.mobile.test.tsrx src/checkbox-list.macos.mobile.test.tsrx
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
pnpm exec turbo run test:packed --filter=@octane-xplat/ui
pnpm exec turbo run pack:check --filter=@octane-xplat/ui
pnpm probe doctor
pnpm probe run examples/probes/checkbox-list.macos.tsrx --target macos --watch
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"AppKit checkbox activation package"}' -- pnpm exec turbo run package --filter=@xplat/macos
pnpm check:recipes
pnpm check:docs
pnpm check:doc-examples
pnpm check:changelog
```

No tests/typegen/typechecks/builds/installs, native operations, OS automation,
packaging, images/visual analysis, audit regeneration or new task/agent ran.
check:docs and check:doc-examples remain absent in this worktree snapshot; do not
copy another task's in-flight tooling or claim those gates passed.

## AppKit switch latest local intent

After checkbox ownership, continued the same high-demand settings flow: the
maintained ComponentsDemo and switch fixture use local/default choices as well
as controlled saves. Source at 1cf15e4a4 read latest rendered checked state, so
separate no-save activations before a render could repeat the same request.
Current props/reentry/pending/detach ownership already existed. This is source
evidence, not observed native event delivery or a failing executed model.

The AppKit Switch leaf now retains accepted uncontrolled intent separately from
rendered state, updating it before the state setter and consumer callback. Each
activation reads current props and chooses the parent value or that local intent.
Sync/async failure restores the captured prior local intent before rollback state/
callback writes. A throwing forward callback retains its already-applied intent
while releasing ownership without starting the save. Controlled requests do not
rewrite the original local seed; repeated rejected requests remain parent-owned.
The existing save claim, current blocking, captured event action/rollback callback,
label/focus path and detached settlement policy remain unchanged. No new public
API, context, renderer/import prerequisite, other-target leaf, dependency,
manifest, React Aria presence entry or shared audit change was needed.

Five new object-driver cases are authored, all UNRUN (eighteen total): rapid local
no-save requests; synchronous failure restoring intent before rollback reentry/
next request; async failure followed by rapid no-save requests; controlled
rejection and original seed on controlled release; forward callback throw before
render. Existing cases still cover save order, pending blocking, reentry, label
lease, metadata and detach, but none were executed for this task.

The maintained switch fixture retains its original metadata run hook and adds
human-operated local, async save/failure and accepted/rejected controlled choices,
blocking controls and request history. Save failure settles in a microtask; there
is no timer or simulated slow-save qualification. The runner still checks only
initial metadata and direct layout-button dispatch, not the new flows or OS
input. Guide, Octane reference, appkit-switch-actions AC7 and the existing
unreleased feature note reconcile the subset. The UI README has no switch-specific
claim to update. Local stable tags do not contain the target leaf's introducing
commit 7680744; only this origin branch contains it, so the existing feature note
is updated without a separate stable-fix note or registry publication claim.

Lightweight checks: three TSRX source/test/fixture files and six scoped TSX
fences parsed; six distinct new/changed local targets/anchors resolved; the UI
manifest parsed as JSON; focused staged semantic and whitespace review passed.
Zero tests/compiler transforms/native operations were run. Native event/ref/field/layout timing,
physical track/label/key input, pending ownership and record/mode changes under
real interaction, focus/Tab/VoiceOver, actual busy paint, memory/OS versions,
installed consumers and visual/pixel behavior remain unqualified. No new record
identity/cancellation API or change to captured-event rollback policy is claimed.
The full support goal and all evidence checkboxes remain open.

Exact deferred commands (DO NOT RUN until this task receives explicit human
verification authorization; native resource authorization is not visual approval):

```sh
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/switch.macos.mobile.test.tsrx src/checkbox.macos.mobile.test.tsrx
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
pnpm exec turbo run test:packed --filter=@octane-xplat/ui
pnpm exec turbo run pack:check --filter=@octane-xplat/ui
pnpm probe doctor
pnpm probe run examples/probes/switch.macos.tsrx --target macos --watch
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"AppKit switch local intent package"}' -- pnpm exec turbo run package --filter=@xplat/macos
pnpm check:recipes
pnpm check:docs
pnpm check:doc-examples
pnpm check:changelog
```

No tests/typegen/typechecks/builds/installs, OS automation, packaging, images or
visual analysis, shared snapshot regeneration or new task/agent ran. The UI has
no own typecheck script in this snapshot; the touched-package/dependents filter
remains the pre-merge gate. check:docs/check:doc-examples are absent here; do not
copy other tasks' in-flight tooling or claim those commands passed.

## AppKit multiline layout observation ownership

Continue common input/layout demand: Home's bounded controlled/uncontrolled
composers request autoGrow/maxRows. Current source already implements TextKit
measurement, row caps and an internal NSScrollView; prop-loop continue branches
are not absence evidence. Review at e8445eaef found direct resize registration
assigned its token after acquisition, used a later global center for removal,
left its token live during teardown and did not guard callbacks or sizing against
retired/replaced native scope. These are source findings, not observed OS bugs.

A private renderer leaf now claims one current editor/viewport/clip/document lease
before old cleanup or native setup. It captures center/remover/receiver, ignores
incomplete setup callbacks, owns returned handles before scope getters can fail,
releases late handles after retirement and preserves a newer lease during old
cleanup. Delivery rechecks scope and stops an old lease on replacement. Cleanup
retires/tombstones before native removal and is idempotent; setup/delivery/removal
failures use fixed errors/diagnostics without native error/text payloads. Direct
fit errors retain their existing synchronous path. Shared frame-notification
flags stay enabled; resetting them could disrupt another reader.

Textview destroy retires this lease before focus dispatch, hooks and other native
cleanup, including partial construction. fitTextView skips retired nodes and
rechecks the editor/viewport/clip/document after native layout, paragraph/storage,
container and constraint effects before later editor/frame writes. Initial sizing
still follows final applyProps, so ignored setup notifications do not require a
new timer/poll. Existing geometry/rows/caps/scroll document, maxLength, composition,
selection and submit behavior are preserved. No public prop/type, dependency,
manifest, shared CLI/UI/GTK or audit snapshot changed.

Apple documents [block-observer tokens and nil-queue delivery](https://developer.apple.com/documentation/Foundation/NotificationCenter/addObserver%28forName%3Aobject%3Aqueue%3Ausing%3A%29)
and [frame notification enablement](https://developer.apple.com/documentation/appkit/nsview/postsframechangednotifications).
These support retaining/removing the returned token and guarding synchronous
notification effects; they do not prove our JS/ObjC bridge, resource release or
native layout. A native add that installs a callback then throws without returning
a handle cannot be recovered from JS. Failed native removal is reported and does
not prove release. Automatic migration after externally replacing clip/document,
prop/record changes during measurement, native process aborts and actual callback
thread/lifetime behavior remain unqualified.

Eleven new cases are authored, all UNRUN: seven actual helper/bridge models for
setup suppression, captured cleanup, late handles, replacement during old cleanup,
view/viewport/clip/document drift, setup/callback/removal faults and post-acquisition
scope getter failure; three actual sizing VM cases for retired reads, retirement/
scope replacement during native layout and retirement during constraint writes;
one actual destroy-path partial-node case proving early retirement before hooks.
The existing growth model now supplies its documentView identity. The partial-
creation harness imports the real retirement helper. None of these test modules,
compiler transforms or native operations was executed.

The maintained text-entry ownership fixture adds human-operated width/cap/growth
controls to controlled/uncontrolled multiline fields. Existing removal/remount
and composition/external-value controls remain. Its run hook only waits/records
mounting, and no probe ran. The public growth guide keeps the draft parent-owned
when hiding a field; renderer README, Octane reference and textarea-growth AC3
reconcile this source boundary. The existing native text-controls script lacked
a registered task in both root and macOS-local Turbo configurations. A target-
local uncached task now orders dependency typegen/build and @xplat/app generation;
root/other-target task files and package scripts are untouched. This follows
[Turborepo package configuration](https://turborepo.dev/docs/reference/package-configurations)
and existing local task patterns. Source/JSON registration does not prove the
Turbo graph or any native run. Precise line blame identified f12221c9f as the
original observer implementation; local stable tags v0.15.0 through v0.18.0
contain it, so a focused .changelog/fixes note records the correction. This is
local Git evidence, not a registry publication audit or native qualification.

Lightweight checks: six source/test/fixture files parsed (five TypeScript and
one TSRX); four scoped TSX fences parsed; twelve distinct new/changed local
targets/anchors resolved; two manifests and the local task config parsed as JSON,
with script/cache/prerequisite metadata inspected; focused staged semantic and
whitespace review passed. No Turbo graph, test case or compiler transform ran. Native TextKit
measurement, bounds/frame notification ordering, wrapping/resize/scroll, focus/
selection/IME/undo, actual release/memory, OS versions, VoiceOver, installed
consumers and visual/pixel behavior remain unqualified. The goal and all issue
checkboxes remain open.

Exact deferred commands (DO NOT RUN until this task has explicit human verification
authorization; native resource authorization is not visual-analysis approval):

```sh
pnpm exec turbo run test --filter=@octane-xplat/macos-renderer
pnpm exec turbo run typecheck --filter=...@octane-xplat/macos-renderer --filter=...@xplat/macos
pnpm exec turbo run test:packed --filter=@octane-xplat/macos-renderer
pnpm probe doctor
pnpm probe run examples/probes/text-entry-ownership.macos.tsrx --target macos --watch
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"AppKit text-controls fixture"}' -- pnpm exec turbo run test:text-controls --filter=@xplat/macos
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"AppKit multiline layout ownership package"}' -- pnpm exec turbo run package --filter=@xplat/macos
pnpm check:recipes
pnpm check:docs
pnpm check:doc-examples
pnpm check:changelog
```

The native fixture task is registered in apps/macos/turbo.json without changing
shared task configuration. Do not bypass Turbo with the former raw script command;
its graph/prerequisites and execution remain deferred. check:docs and
check:doc-examples and documentation-quality.md are absent from this worktree;
the latter was read from the original checkout without edits. No tests, typegen,
typechecks, builds, installs, native/OS automation, packaging, visual analysis,
shared audit regeneration or new task/agent ran.

## AppKit numeric current request ownership

Demand assumption: ComponentsDemo's bounded 0..9 NumberInput and the sandbox's
Team Size, clearable percentage and unit examples represent common quantity
forms. They rank ahead of niche integrations. At 2db67fe55 the AppKit leaf
calculated repeated steps from its last rendered value; edit, step and clear
had separate paths without a shared current owner. A held clear could call its
old onClear after setValue rejected a now-blocked request. These are source
findings, not an observed native failure or executed test result.

The target leaf now retains current inherited props, local numeric intent and
a stable typed root attachment, with one request claim across edits, steps and
clear. Local intent changes before state/callback work; controlled null remains
explicitly empty and controlled requests await parent feedback. Leaving controlled
mode retains the original local seed rather than a changed defaultValue. Held
actions recheck current bounds, step, callbacks, blocking and whether their
step/clear affordance still exists. Retired and nested actions are ignored.
A private existing TextInputHandle supplies the current editor; steps and clear
wait during marked text, while draft edits retain their existing notification
path. Native getter effects are followed by a final current-owner check. An
accepted clear captures onValueChange(null) then onClear across replacement or
detach. Consumer errors propagate after releasing the claim; a throwing first
callback skips onClear, and accepted local intent is retained.

The removed applyEscapeProps ref called the existing AppKit no-op. No platform
bag implementation, public type, dependency, manifest or other-target leaf
changed. Existing parseFloat/NaN/empty-string/clamping, display formatting,
null/default seed, descriptive loading and fractional-step arithmetic policies
are preserved. This adds no locale/inverse parser, finite-number policy,
rounding, keyboard spinner handler, focus reconstruction or async action API.

Eight new object-driver cases (thirteen numeric cases total), all UNRUN, cover
rapid edit/step/clear before render, controlled rejection/local seed, current
inherited blocking/bounds/callbacks, accepted clear/reentry/replacement/detach,
consumer exceptions, removed affordances/teardown, parser/loading preservation
and editor method/property marked state. The existing number-input fixture now
has human-operated controlled acceptance/hold/local modes, blocking, bounds/step,
removal/remount and request history. Its unchanged run hook checks initial
metadata and directly dispatches the stepper-visibility toggle only. It does not
prove OS input, hit testing, field-editor lifecycle or any numeric trial.

The components guide, Octane primitive reference, appkit-text-ownership AC5 and
existing unreleased number-field feature note reconcile this boundary. Entity
history identifies adc01d1 as the leaf introduction; no local stable v-tag
contains it, so the existing feature note was extended. This is local Git
evidence, not a registry audit. No shared audit snapshot was regenerated.

Lightweight verification: three TSRX source/test/fixture files and four scoped
TSX fences parsed; six added/changed local targets/anchors resolved; staged semantic
and whitespace review completed. These are syntax/source checks only. No test,
compiler transform or native operation ran. Native inner-handle timing, editor
composition/commit ordering, partial/formatted/pasted/locale input, decimal
precision, controlled rejection writeback, focus/selection/undo, pointer/key
activation, VoiceOver, installed consumers and pixels remain unqualified.

Exact deferred commands (DO NOT RUN until this task has explicit human
verification authorization; resource admission is not visual-analysis approval):

```sh
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/input-number.macos.mobile.test.tsrx src/text-entry-ownership.macos.mobile.test.tsrx
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
pnpm exec turbo run test:packed --filter=@octane-xplat/ui
pnpm exec turbo run pack:check --filter=@octane-xplat/ui
pnpm probe doctor
pnpm probe run examples/probes/number-input.macos.tsrx --target macos --watch
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"AppKit numeric request ownership package"}' -- pnpm exec turbo run package --filter=@xplat/macos
pnpm check:recipes
pnpm check:docs
pnpm check:doc-examples
pnpm check:changelog
```

check:docs and check:doc-examples remain absent in this worktree, and the
newer documentation-quality reference was read from the original checkout.
No tests, typegen, typechecks, builds, installs, probes, native/OS automation,
packaging, visual analysis or additional task/agent ran. All evidence-gated
issue checkboxes and native qualification remain open.

## AppKit dropdown current open intent

Demand assumption: ComponentsDemo's action/checkbox/radio/export menu,
OverlayDemo and the sandbox's menu examples represent common application actions.
They rank ahead of niche integrations. At 1fe3f6a58 DropdownMenu toggled from its
rendered open value and setOpen captured props/disablement; trigger, arrow,
dismissal and return-close requests lacked a shared claim. A held native Button
callback can still reach that old closure. These are source findings, not a
native timing failure or executed reproduction. Button's own retained-handler
policy outside this composed dropdown remains a separate review item.

The AppKit dropdown leaf now retains current props, own/button/group blocking,
button loading/interruptible policy and local open intent. One claim covers
trigger, arrow, dismiss and return-close requests; uncontrolled intent updates
before state/callback work, while controlled requests await parent acceptance.
Leaving controlled mode restores the preexisting local state rather than a
changed defaultOpen. Opening rechecks current blocking/loading and arrow opening
also rejects current open intent before render. Loading does not suppress an
already-open surface; disabled visibility suppression and close effects retain
their previous policy. Close remains allowed while disabled/loading.

A stable typed trigger binding makes detached callbacks inert. An accepted claim
survives callback-driven button-ref replacement, whose null/reattach handoff must
not release it. Nested requests are ignored. Consumer errors release the claim
without rolling back accepted local intent. Trigger errors still flow through
Button's existing reportActionError path; raw dismissal errors retain their
existing propagation path. Existing menu-return target/reset, initial first/last
focus, accepted controlled visibility, layer, menu keyboard and public ref/ID
paths are preserved. No public prop, dependency, manifest, shared coordination
hook or other-target leaf changed. This is not a generic Button, submenu or
ContextMenu ownership rewrite, or proof against arbitrarily delayed obsolete
native popup callbacks; those retain their existing layer contracts.

Seven new authored inline-popup object-driver cases, all UNRUN, cover rapid local
toggles, controlled rejection/current callbacks/local seed, own/button/group/
loading/interruptible policy, trigger/dismiss cross-action reentry and callback-
driven button-ref handoff, error release, teardown and arrow/current-open/reentry
policy. Existing ref/ID, controlled visibility, keyboard and Tab-return cases
remain relevant and unrun. The maintained menu-keyboard fixture now has human-
operated local/controlled acceptance/hold modes, external parent visibility,
disablement, trigger loading, removal/remount and bounded request history. Its
run hook still directly dispatches only the ordinary trigger, with no OS key or
pointer synthesis. No fixture ran.

The menu guide, Octane primitive reference and shared-menus AC14 reconcile this
source boundary. Local entity history and the cdb5207 source show rendered-open
closure behavior; stable local v0.18.0 contains that commit, so a focused stable
fix note records the correction. This is local Git evidence, not a registry audit
or native qualification. No shared audit snapshot was regenerated.

Lightweight checks: three TSRX source/test/fixture files and five scoped TSX
fences parsed; five added/changed local targets/anchors resolved; staged semantic and
whitespace review completed. Zero test cases or compiler transforms executed.
Native merged-ref/effect/field/window timing, popup dismissal races, key delivery,
Tab/return focus, repeated physical clicks, loading paint, VoiceOver, installed
consumers and pixels remain unqualified. Source cases replace popovers with inline
content and cannot establish any of those native behaviors.

Exact deferred commands (DO NOT RUN until this task has explicit human
verification authorization; resource admission is not visual-analysis approval):

```sh
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/menu-family.macos.mobile.test.tsrx src/menu-return.macos.mobile.test.tsrx src/button.macos.mobile.test.tsrx
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
pnpm exec turbo run test:packed --filter=@octane-xplat/ui
pnpm exec turbo run pack:check --filter=@octane-xplat/ui
pnpm probe doctor
pnpm probe run examples/probes/menu-keyboard.macos.tsrx --target macos --watch
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"AppKit dropdown current intent package"}' -- pnpm exec turbo run package --filter=@xplat/macos
pnpm check:recipes
pnpm check:docs
pnpm check:doc-examples
pnpm check:changelog
```

check:docs and check:doc-examples remain absent in this worktree; the newer
documentation-quality reference was read from the original checkout. No tests,
typegen, typechecks, builds, installs, probes, native/OS automation, packaging,
visual analysis or additional task/agent ran. All evidence-gated checkboxes and
native qualification remain open.

## AppKit Button current press ownership

Demand assumption: ComponentsDemo's normal/loading/disabled actions, everyday
save/help forms and composed dropdown/IconButton flows represent core desktop
usage. Dropdown review at 0fa8c0859 exposed the generic Button source gap: held
presses captured old props/group/loading, rendered pending state could outlive
settled tokens, URL opening preceded the reentry claim, and throwing then-access
could leave a token live. These are source findings, not observed OS behavior or
an executed failing case. This continues the shared action prerequisite before
niche integrations.

The AppKit Button now retains current props/group state and consults active
calls at press time. Explicit/group blocking wins; current loading or pending
calls block unless interruptible. A typed host binding rejects detached presses,
with existing refList flattening private/caller refs, including nested arrays.
Ref handoff preserves pending claims, while the existing teardown effect retires
actions and pending UI writes. Ownership is claimed before URL dispatch so a
noninterruptible platform-opener callback cannot reenter. Sanitization/URL-before-
action order and unsafe-URL/action behavior are preserved. Synchronous URL errors
release the claim, skip the action and retain their propagating error path.

Each accepted call snapshots its props, so URL/action/error callbacks keep their
accepted owner across props/ref replacement or teardown. Accepted app work is
not cancelled by teardown; its failure still reaches the captured error handler.
Action invocation/then-access/setup errors now release ownership and use that
handler. Standard Promise.resolve assimilation, explicit interruptible overlap,
settlement token counting, uncaught asynchronous fallback reporting, native link
target neutrality, content/busy/metadata and IconButton delegation remain. This
does not sanitize consumer error payloads, add cancellation, implement tooltip
presentation or rewrite Pressable/ToggleButton/other target action policies.
No public prop, dependency, manifest or other-target leaf changed.

Eight new object-driver cases (sixteen Button cases total), all UNRUN, cover
current own/group/loading/href/action policy, current interruptibility and token
settlement before render, URL bridge reentry, accepted action/error/ref-array
handoff, URL error/retry, throwing then-access/reentry, pending error ownership
after replacement/teardown and IconButton delegation. The new button-actions
fixture exposes human-operated manual success/failure, callback revisions,
external loading/disablement/interruptibility, opt-in documentation URL opening
and remove/remount. Fixture cleanup resolves queued work without later history
writes; its run hook records mounting only. It performs no automatic action,
URL opening or OS input. No test or fixture ran.

The components guide, Octane primitive reference, appkit-button-actions AC6 and
existing unreleased Button feature note reconcile this boundary. Entity history
identifies e7e123f as the target leaf introduction and no local stable v-tag
contains it, so the existing feature note was extended. This is local Git
evidence, not a registry audit. No shared audit snapshot was regenerated.

Lightweight verification: three TSRX source/test/fixture files and nine scoped
TSX fences parsed; five added/changed local targets/anchors resolved; staged semantic
and whitespace review completed. Zero tests or compiler transforms executed.
Actual merged ref/commit/teardown ordering, native URL bridge behavior, pointer/
hardware-key delivery, focus, pending layout/paint, VoiceOver, error delivery
across app shutdown, installed consumers and pixels remain unqualified. Existing
menu/numeric cases are still unrun; private composition guards do not establish
native platform support.

Exact deferred commands (DO NOT RUN until this task has explicit human
verification authorization; resource admission is not visual-analysis approval):

```sh
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/button.macos.mobile.test.tsrx src/menu-family.macos.mobile.test.tsrx src/toggle-button.macos.mobile.test.tsrx
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
pnpm exec turbo run test:packed --filter=@octane-xplat/ui
pnpm exec turbo run pack:check --filter=@octane-xplat/ui
pnpm probe doctor
pnpm probe run examples/probes/button-actions.macos.tsrx --target macos --watch
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"AppKit current Button ownership package"}' -- pnpm exec turbo run package --filter=@xplat/macos
pnpm check:recipes
pnpm check:docs
pnpm check:doc-examples
pnpm check:changelog
```

check:docs/check:doc-examples remain absent in this worktree; the newer
documentation-quality reference was read from the original checkout. No tests,
typegen, typechecks, builds, installs, probes, native/OS automation, packaging,
visual analysis or additional task/agent ran. All evidence-gated checkboxes and
native qualification remain open.

## AppKit toggle accepted value ownership

Demand assumption: pin/favorite saves and ordinary toolbar choices use the
ToggleButton/ActionControlsDemo path. After the Button prerequisite at d1a6f82b2,
source review found ToggleButton's current ref mirrored controlled/group display
on every render. An already accepted Button callback could then retain old props
but read a new parent's pressed value after synchronous URL dispatch, mixing two
owners. These are source findings, not native timing or executed failure evidence.

The AppKit leaf now keeps local intent separately and computes a controlled
request from its captured isPressed prop. Current Button ownership still chooses
the callback at acceptance; that callback's notification/save/error contract is
retained across URL-driven parent updates. Local changes update intent before
notification and keep it through controlled/group mode changes. A throwing
notification retains the local flip, skips save and reports through Button.
Existing group membership, optimistic no-rollback policy, busy/interruptible
ownership, icons, metadata and public types remain. No dependency, manifest,
shared hook or other-target leaf changed.

Three new object-driver cases (nine toggle cases total), all UNRUN, cover
controlled URL-driven parent replacement, local-to-controlled URL handoff/exit,
and notification error/retained intent/retry. The existing toggle fixture adds
human-operated controlled/local mode, parent value and request acceptance controls.
Its unchanged scripted path directly dispatches Pin and Complete save and reads
native pressed metadata; it synthesizes no OS input and does not run the new
mode trials. No test, fixture or URL dispatch ran.

Guide/Octane reference, appkit-toggle-actions AC5 and the existing unreleased
feature note reconcile this source boundary. Local history identifies 866fd2c as
the action-owner change and no stable local v-tag contains it; no registry audit
is claimed. No shared audit snapshot was regenerated.

Lightweight verification: three TSRX source/test/fixture files and four scoped
TSX fences parsed; four added/changed local targets/anchors resolved; staged semantic
and whitespace review completed. Zero tests/compiler transforms/native operations.
Actual synchronous platform URL callbacks, controlled writeback, native ref/effect
ordering, physical click/key delivery, focus, busy geometry, toolbar/group roving,
tooltip, reserved semibold width, VoiceOver, installed consumers and pixels remain
unqualified or separate gaps. Evidence-gated issue checkboxes remain open.

Exact deferred commands (DO NOT RUN until this task has explicit human
verification authorization; resource admission is not visual-analysis approval):

```sh
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/toggle-button.macos.mobile.test.tsrx src/button.macos.mobile.test.tsrx
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
pnpm exec turbo run test:packed --filter=@octane-xplat/ui
pnpm exec turbo run pack:check --filter=@octane-xplat/ui
pnpm probe doctor
pnpm probe run examples/probes/toggle-button.macos.tsrx --target macos --watch
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"AppKit accepted toggle value package"}' -- pnpm exec turbo run package --filter=@xplat/macos
pnpm check:recipes
pnpm check:docs
pnpm check:doc-examples
pnpm check:changelog
```

check:docs/check:doc-examples remain absent from this worktree. No tests, typegen,
typechecks, builds, installs, probes, native/OS automation, packaging, visual
analysis or additional task/agent ran. The goal remains active.

## AppKit Button native pointer hints

Demand assumption: Button's documented tooltip and IconButton's named help affordance
serve ordinary save/help and toolbar actions. At 94459ad66 Button's tooltip prop
never reached a native host property, and the guide recorded that presentation
gap. Web Button uses its native title attribute. AppKit's existing generic
Tooltip/useTooltip popup path is a separate feature, not an absent blanket
capability; it is unchanged here. This finding is source-only.

The Button leaf now assigns NSView.toolTip on the existing typed host, updates it
when tooltip changes, clears to nil when omitted and clears the captured host on
teardown after retiring actions. Its stable binding updates the same native hint
through public ref handoff without a transient nil write. Equal native values
skip repeat assignment. Busy/disabled state keeps the hint assigned, while names,
accessibilityHint, action policy, layout and ref ownership stay unchanged.
IconButton and ToggleButton inherit the Button property path; no new wrapper,
tracking area, popup root, timer, dependency, renderer prop, shared intrinsic,
public API or other-target leaf was added.

[Apple's NSView.toolTip contract](https://developer.apple.com/documentation/appkit/nsview/tooltip?changes=_1)
defines a nullable string and nil to cancel the hint. The generated SDK in
packages/platform/src/types/macos/AppKit.d.ts and renderer AppKit.d.ts declares
it as string without nullability. The target leaf uses Reflect for the native
property rather than editing generated bindings or substituting empty text for
nil. This local binding mismatch/workaround is source evidence; actual bridge
conversion remains unqualified. AppKit owns delay/appearance/placement. This is
a pointer-hint subset comparable to web's title; it adds no focus-triggered hint,
custom timing/placement, role/described-by relationship, or AX announcement promise.
Disabled/busy pointer delivery and coexistence with cursor/custom hover observers
must be checked on the OS.

Three new authored object-driver cases (nineteen Button cases total), all UNRUN,
cover initial/update/empty/removal without name/hint replacement, busy/disabled/
ref handoff and teardown, and IconButton delegation. The existing button-actions
fixture adds a changing revision hint and human-operated hint removal toggle;
its run hook still records mounting only. It does not synthesize hover or inspect
pixels. Guide/Octane reference, Button AC7, the toggle recipe's remaining focus-
hint limit and the existing unreleased Button feature note reconcile the subset.
No shared audit snapshot was regenerated.

Lightweight checks: three TSRX source/test/fixture files and ten scoped TSX fences
parsed; six added/changed local targets/anchors resolved; staged semantic and whitespace
review completed. Zero tests/compiler transforms/native operations. Actual native
property dispatch/nil conversion, effect/ref/teardown order, tooltip timing and
cancellation, disabled/busy delivery, pointer movement/hit testing, focus-only
reveal, VoiceOver, installed consumers and pixels remain unqualified. Native
pointer assignment is not visual or runtime proof. All evidence-gated checkboxes
remain open.

Exact deferred commands (DO NOT RUN until this task has explicit human
verification authorization; resource admission is not visual-analysis approval):

```sh
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/button.macos.mobile.test.tsrx src/toggle-button.macos.mobile.test.tsrx src/menu-family.macos.mobile.test.tsrx
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
pnpm exec turbo run test:packed --filter=@octane-xplat/ui
pnpm exec turbo run pack:check --filter=@octane-xplat/ui
pnpm probe doctor
pnpm probe run examples/probes/button-actions.macos.tsrx --target macos --watch
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"AppKit native Button hints package"}' -- pnpm exec turbo run package --filter=@xplat/macos
pnpm check:recipes
pnpm check:docs
pnpm check:doc-examples
pnpm check:changelog
```

check:docs/check:doc-examples remain absent from this worktree. No tests, typegen,
typechecks, builds, installs, probes, native/OS automation, packaging, visual
analysis or additional task/agent ran. Focus-triggered hints remain an implementation
gap; all native qualification remains open and the goal remains active.

## AppKit Toolbar role prerequisite

Demand assumption: ComponentsDemo's Toolbar and TableSelectionToolbar's bulk
application actions represent ordinary contextual commands. ToggleButtonGroup
uses ordinary group semantics on web; Toolbar is the actual web roving composite.
At 36704f1c2 the AppKit Toolbar supplied its label but no toolbar role, and the
renderer fell back to AXGroup even for a supplied toolbar role. This is a source
prerequisite finding, not an observed VoiceOver or keyboard failure.

The target Toolbar now supplies accessibilityRole=toolbar on its retained outer
host. The renderer role getter returns AXToolbar, matching
[Apple's toolbar role](https://developer.apple.com/documentation/applicationservices/kaxtoolbarrole?changes=__11).
The role alone does not create an activation handler, responder or Tab stop;
current labels, slots, layout orientation and child Button actions stay owned by
their existing paths. No new native object, focus registry/lease, public prop,
dependency, manifest, shared hook or other-target leaf changed. The existing
ObjC role selector handles the mapping without a new protocol method.

One new renderer VM case and one UI object-driver case, both UNRUN, cover the
named native role, label updates/role reset/ignored state, non-action/non-Tab
container and retained leaf/slot/child-action behavior. The new manual Toolbar
fixture exposes label/orientation changes and ordinary save/share actions; its
hook records mounting only. No case, fixture, action or OS input ran.

This commit deliberately repairs the host/renderer prerequisite before toolbar
keyboard implementation. Roving toolbar navigation and orientation AX metadata
remain implementation gaps. Future traversal must retain disabled/hidden and
nested-editor/composite ownership, and must not use canBecomeKeyView to discover
members after applying owned Tab suppression (that would exclude its own leased
members). The existing AppKit choice helper and physical input pipeline provide
source machinery, not native toolbar proof. Ordinary ToggleButtonGroup behavior
is not changed to introduce a different shared contract.

Guide/renderer README/Octane reference/resizable-workspace AC5 and a stable fix
note reconcile this boundary. Local entity history identifies 72d90e9 as the
Toolbar leaf introduction; stable tags v0.10.0 through v0.18.0 contain it. This
is local Git evidence, not a registry audit. No shared audit snapshot regenerated.

Lightweight checks: five source/test/fixture files (two TypeScript, three TSRX)
and four scoped TSX fences parsed; six added/changed local targets/anchors resolved;
staged semantic and whitespace review completed. Zero tests/compiler transforms/
native operations. Native role dispatch/child hierarchy, AX orientation, keyboard/
Tab/focus/input, VoiceOver, layout/pixels and installed consumers remain unqualified.
All evidence-gated issue checkboxes remain open.

Exact deferred commands (DO NOT RUN until this task has explicit human
verification authorization; resource admission is not visual-analysis approval):

```sh
pnpm exec turbo run test --filter=@octane-xplat/macos-renderer
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/toolbar.macos.mobile.test.tsrx src/button.macos.mobile.test.tsrx
pnpm exec turbo run typecheck --filter=...@octane-xplat/macos-renderer --filter=...@octane-xplat/ui
pnpm exec turbo run test:packed --filter=@octane-xplat/ui --filter=@octane-xplat/macos-renderer
pnpm exec turbo run pack:check --filter=@octane-xplat/ui
pnpm probe doctor
pnpm probe run examples/probes/toolbar.macos.tsrx --target macos --watch
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"AppKit Toolbar role package"}' -- pnpm exec turbo run package --filter=@xplat/macos
pnpm check:recipes
pnpm check:docs
pnpm check:doc-examples
pnpm check:changelog
```

check:docs/check:doc-examples remain absent from this worktree. No tests, typegen,
typechecks, builds, installs, probes, native/OS automation, packaging, visual
analysis or additional task/agent ran. Native qualification and the goal remain open.

## AppKit Toolbar discrete action focus and stable slots

Demand assumption: ComponentsDemo Toolbar, TableSelectionToolbar bulk actions
and ordinary save/share/pin bars need keyboard access before niche integrations.
At 815ec3acf the role prerequisite existed, but Toolbar still lacked focus/key
coordination. Its separate grid/flex slot trees also remounted controls when
orientation changed. Local v0.18.0 source contains that branch structure. These
are source findings, not native failures or executed reproductions.

The target leaf now keeps one slot tree and changes grid/flex/axis styles rather
than control identity. Row/column slot direction, centered 1fr/auto/1fr tracks,
size, gap and slot alignment remain explicit. A private owner discovers discrete
button/link/checkbox/radio hosts in native child order and reuses choice focus
for owned action Tab exclusions. It reads acceptsFirstResponder, not
canBecomeKeyView (which excludes its own leased hosts), with current hidden,
enabled/accessibility-enabled and same-window guards. Native Boolean/number
flags are normalized. A window update refreshes changes in order, visibility,
blocking and attachment; window migration releases previous ownership. It
repairs entry eligibility without forcing focus after a responder is removed.

Unmodified axis arrows and Home/End move focus with wrap, without activation or
selection callbacks. Movement is consumed only on accepted native focus; Enter,
Space, Tab and Escape stay with existing control/layer/native paths. Current
orientation is read at dispatch. Modified/composing/prevented events, foreign
responders and nested key reentry are ignored. Editors, adjustable controls,
nested toolbars/radio/tab/menu/list/outline/table composites and nested endContent
controls retain their own input and natural Tab stops. Mixed toolbars can have
additional stops; complete mixed-control roving remains an implementation gap.
The action path covers self-drawn hosts used by shared Button/IconButton/
ToggleButton/Switch/checkbox/link controls. Stock NSButton/text-control Tab
suppression is not established by the AccessibleHostView-only registry and
remains a separate gap. Physical key order follows the existing web helper;
RTL visual correspondence and AX orientation metadata remain unqualified or
unimplemented. This does not complete native toolbar support.

Each root owns its observer, membership map and choice helper. Claim precedes
old cleanup and native observer setup; captured center/remover/token/receiver
release that scope once. A ready observer and keyboard/Tab bridge are required
before exclusions; missing capability preserves natural stops and unconsumed
keys. Retirement precedes cleanup effects, stale delivery is inert, and late
observer/Tab handles release only their old scope. Cleanup wrappers attempt
remaining Tab releases after failures with fixed diagnostics and no native/input
payload. Refresh diagnostics are fixed; direct key/native-focus failures retain
the existing synchronous error path. Failed removals or native acquisition that
throws without returning a handle do not establish actual release/recovery.
Observation does not retry acquisition until reattachment. No renderer, shared
coordination hook, public prop, dependency, manifest or other-target leaf changed;
the removed applyEscapeProps call was the existing AppKit no-op.

Eleven new cases, all UNRUN: nine fake-window/bridge policy cases cover action
entry/manual movement, axis/guards/refused focus, editor/nested/foreign input,
current order/disabled/hidden/removal, window migration, captured cleanup/stale
delivery, capability absence, late acquisition and cleanup-failure/key reentry.
Two appended UI object-driver cases model actual Toolbar wiring/editor/activation
and retained slots/toggle/draft across axes. The manual fixture adds an editor,
local toggle, dynamic disabled/removal and nested toolbar trials; its hook still
records mounting only. No case, fixture or native operation ran.

Guide/renderer README/Octane reference/resizable-workspace AC6, new feature note
and existing stable fix note reconcile the implementation subset. The previous
role note remains historical prerequisite evidence; its keyboard gap is now
partly implemented by this source path. No shared audit snapshot regenerated.

Lightweight verification: five source/test/fixture files (two TypeScript, three
TSRX) and five scoped TSX fences parsed; seven added/changed local targets/anchors
resolved; staged semantic and whitespace review completed. Zero test cases,
compiler transforms, native operations or visual analysis. Actual native BOOL,
ref/commit/subviews ordering, focus/selection, observer ordering/window movement,
Tab stops/OS keys, nested control arbitration, cleanup/memory, RTL, grid/slot
geometry, VoiceOver, installed consumers and pixels remain unqualified. All
evidence-gated issue checkboxes remain open.

Exact deferred commands (DO NOT RUN until this task has explicit human
verification authorization; resource admission is not visual-analysis approval):

```sh
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/toolbar-focus.macos.mobile.test.ts src/toolbar.macos.mobile.test.tsrx src/button.macos.mobile.test.tsrx src/toggle-button.macos.mobile.test.tsrx
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
pnpm exec turbo run test:packed --filter=@octane-xplat/ui
pnpm exec turbo run pack:check --filter=@octane-xplat/ui
pnpm probe doctor
pnpm probe run examples/probes/toolbar.macos.tsrx --target macos --watch
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"AppKit Toolbar action focus package"}' -- pnpm exec turbo run package --filter=@xplat/macos
pnpm check:recipes
pnpm check:docs
pnpm check:doc-examples
pnpm check:changelog
```

At this source worktree revision check:docs/check:doc-examples are absent; their
availability must be rechecked after integration with main. User-authorized
rebase/merge does not supply runtime evidence or execute deferred heavy checks.
The goal remains active with mixed/stock-control and orientation-AX gaps open.

## Integration with local main after Toolbar focus

Human authorization now requires rebasing each clean worktree onto local main,
merging it, then continuing implementation. The Toolbar feature was completed as
008192916 before replay. Rebased onto local main
26ce8da2784bee7e4aa308bbab53eb83be92e1e1 (not origin/main), producing Toolbar
commit 1f51545bdcc39a40a8adbcf2006e4306f4652e53. Git skipped four equivalent
commits and dropped one already-upstream patch; 193 commits replayed. Historical
issue/Silo SHAs remain historical evidence, not revised qualification claims.

Conflicts preserved main's layout observers/projection paint, renderer intrinsic
video/pager/animated-image hosts, JSX facade in the picker consumer lane, current
documentation paths, guide restructuring and unrelated target work. The later
AppKit image-owned cache cutover supersedes the shared URL-cache implementation;
owned Swift Video/AnimatedImage and ScrollableArea Pager leaves retain their
source lifecycle contracts. This is source integration, not runtime proof.

Final reconciliation retains main's existing renderer-backed macOS Select and
its public types alongside the independently implemented AppKitPicker; these are
distinct native components and selection contracts, not forwarding aliases.
The packed-consumer source includes both. Lightbox retains main's renderer-owned
AVPlayerView video path inside the new stable media stage, separate from the
optional Video package's Swift surface. Guides, skill guidance, release note and
known limits now describe that path as implemented but unqualified, instead of
claiming an unsupported message. The existing authored lightbox object-driver
case also models video branch/autoPlay wiring; it remains unrun.

After replay, the five Toolbar source/test/fixture syntax parses, five scoped
TSX fences and seven changed local link targets/anchors passed again. Fifteen
integration source/declaration/fixture files parsed without compiler transforms;
two package JSON files parsed. Current unstaged whitespace checks passed. The
full historical range whitespace check additionally reports existing trailing
blank lines in files/src/file-types.macos.ts and ui/src/{Checkbox.macos.tsrx,
Switch.macos.tsrx,control-colors.macos.ts}; these are not test failures and were
left outside this integration correction. No tests/typechecks/builds/packaging,
OS input, probe execution or visual analysis ran. Main's check:docs and
check:doc-examples scripts are now present; the previously recorded exact
commands remain deferred along with check:recipes/check:changelog. Native
verification and the persistent goal remain open after the authorized Git merge.

## AppKit Toolbar current accessibility axis

Continued after the authorized clean rebase/local-main merge. Demand assumption:
named contextual and table bulk-action toolbars should expose the axis used for
layout/manual keys to accessibility before niche integrations. The existing
AccessibleHostView orientation selector only handled splitters; Toolbar supplied
no axis. This is a source gap, not an executed VoiceOver failure.

The macOS-conditioned JSX declaration now permits horizontal/vertical
accessibilityOrientation on masonview, using the same targeted declaration
pattern as label heading metadata. Shared/mobile/GTK attributes and public
Toolbar props are unchanged. Toolbar supplies its current effective axis,
including the default horizontal value. The existing native orientation override
maps toolbar values to SDK Vertical=1 / Horizontal=2 and missing/invalid values
to Unknown=0. Other roles keep the superclass result, and splitters stay vertical.
The existing accessibility prop ownership path stores updates; no new selector,
callback, responder, role, key handler, dependency or bridge lifecycle is added.
No native notification/announcement behavior is claimed.

The existing renderer VM role case now includes current horizontal/vertical,
invalid/missing reset, role removal and splitter assertions. The existing UI
case includes default/vertical/default axis forwarding on the retained host.
A target-specific JSX self-check accepts both axes and expects invalid/shared
attributes to reject. All are authored and UNRUN; syntax parsing does not
establish expected type errors or actual native method dispatch. Guide, renderer
and JSX READMEs, skill reference, recipe AC5/AC6 and existing feature/fix notes
now distinguish source-present axis metadata from actual AX qualification.

Actually checked: six changed source/declaration/test files and six scoped TSX
fences parsed; current whitespace and staged semantic review completed. Zero
tests, typechecks, compiler transforms or native operations. Real NSAccessibility
queries, BOOL/enum bridging, axis announcement/update notifications, VoiceOver,
OS input/focus and installed consumers remain unqualified. Mixed/stock-control
Toolbar Tab ownership remains an implementation gap. No audit snapshots changed.

Additional exact deferred commands (alongside the prior Toolbar commands):

```sh
pnpm exec turbo run test --filter=@octane-xplat/macos-renderer
pnpm exec turbo run typecheck --filter=...@octane-xplat/jsx --filter=...@octane-xplat/macos-renderer --filter=...@octane-xplat/ui
pnpm exec turbo run test:packed --filter=@octane-xplat/jsx --filter=@octane-xplat/macos-renderer --filter=@octane-xplat/ui
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/toolbar.macos.mobile.test.tsrx
```

The resource limit still defers recipe/docs/doc-example/changelog gates, probes,
builds, packaging and OS automation. No visual analysis is authorized. Clean
Git integration is not native qualification; the persistent goal remains active.

## AppKit canonical source-owned Popover

Demand assumption: ComponentsDemo token entry, ComplexSelector custom pickers,
anchored notifications and ordinary details panels are common flows. Source
review found macOS root Popover and Tokenizer/ComplexSelector imported a second,
inline implementation in surfaces.macos, while menus/date/navigation used the
separate Popover.macos leaf. Local stable v0.18.0 contains the root inline export.
The latter leaf still created an independent NSPopover root, losing declaring
providers. These are source findings, not executed native reproductions.

The root and both target consumers now select one canonical Popover.macos leaf;
the duplicate Popover was removed from surfaces.macos. Overlay is unchanged.
Tokenizer passes its stable wrapper ref rather than a pre-commit current-value
snapshot. The canonical component uses the existing renderer showLayer source
outlet, native portal and shared position helper. No renderer, shared hook,
manifest, dependency or other-target leaf changed. It never renders an inline
fallback or independently renders children. Content/provider updates and nested
layer depth remain in the declaring tree; native layout/commit timing remains
unqualified. Typeahead results retain their own source-owned host.

The private owner claims a scope before bridge acquisition/publication and
reveals only after that scope's source commit. Current physical placement,
alignment and finite numeric/px offset flip/clamp through positionPopover; its
physical alignment matches the public web path. Current outside policy updates
the existing host. Native frame/scroll/window observers and mouse monitors remain
owned by the existing renderer layer. A captured window-update observer waits
for anchor attachment and watches hidden/detached/window-retired owners. Initially
hidden anchors wait; active hidden/retired owners cancel until close/open rearms
them. Replacing the anchor retires only the old source. Missing showLayer/source
outlet/staged handle fails explicitly; declined native presentation requests close.

Controlled outside/Escape dismissal remains a request until accepted; defaultOpen
owns uncontrolled visibility. The top-layer gate is revalidated after its callback.
Retirement precedes native close, and stale source/commit/close/notification
callbacks are inert. Late handles and observer tokens release their captured
scope/receiver; observer removal failures emit a fixed diagnostic. Native close
failures/unreturned native acquisitions do not establish complete recovery. The
existing finalFocusRef/captured native return behavior remains; this adds no
focus trap, auto-editor focus, app activation, OS popover arrow or animation.
Generic useLayer/hover and direct Tooltip roots retain separate limitations.

Eleven new cases, all UNRUN: eight fake owner/bridge cases cover staged commit,
current position/policy, controlled rejection/top gate, attachment/replacement,
window/hidden cancellation/rearm, captured and late acquisition cleanup, stale
callbacks and capability absence. Three actual source-portal/object-driver cases
model declaring provider/depth updates, current controlled Escape/dismissal and
uncontrolled defaultOpen. The former AppKit NSPopover-specific case was removed
from the generic mobile layer suite; its current portal/depth/silent-owner-close
contract is covered in the target suite instead. Tokenizer geometry cases now
explicitly mock the outer Popover as well as results; they do not qualify native
hosting. The maintained public-root manual fixture records mounting only.

Guide, renderer README, Octane primitives/overlays references, source-window-layer
recipe AC4 and stable fix note reconcile the source subset. No shared audit
snapshots regenerated. Lightweight verification: eleven changed source/test/
fixture files parsed (three TS/eight TSRX), five scoped TSX fences parsed, and
changed local links/anchors resolved; staged semantic/current whitespace review
completed. Exact link count is recorded with the commit's issue progress. Zero
tests/typechecks/compiler transforms, builds, probes, packaging, OS automation or
visual analysis ran. Actual renderer source-outlet discovery, provider/ref/commit
ordering, native sizing/clipping/scroll/RTL/positions, nested blur/dismissal,
OS input/IME/Tab/focus/return, VoiceOver, cleanup/memory and installed consumers
remain unqualified. This does not complete any evidence-gated issue checkbox.

Exact deferred commands (DO NOT RUN until explicit human authorization):

```sh
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/popover-owner.macos.mobile.test.ts src/popover.macos.mobile.test.tsrx src/tokenizer-overflow.macos.mobile.test.tsrx src/typeahead-results.macos.mobile.test.tsrx src/select.macos.mobile.test.tsrx src/menu-family.macos.mobile.test.tsrx
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
pnpm exec turbo run test:packed --filter=@octane-xplat/ui
pnpm exec turbo run pack:check --filter=@octane-xplat/ui
pnpm probe doctor
pnpm probe run examples/probes/popover.macos.tsrx --target macos --watch
goddard-agent resource run --json '{"resources":{"native_builds":1},"purpose":"AppKit source-owned Popover package"}' -- pnpm exec turbo run package --filter=@xplat/macos
pnpm check:recipes
pnpm check:docs
pnpm check:doc-examples
pnpm check:changelog
```

Clean-worktree rebase/local-main merge and feature-branch publication follow the
human's Git workflow; they supply no native qualification. Goal remains active.

## AppKit CSS state selectors and resize media

Demand assumption: hover rows, pressed buttons, keyboard focus rings and
narrow-window layouts are everyday stylesheet needs. Source review found the
renderer already wires `:hover` (tracking area), `:active`/`:pressed`/
`:highlighted` (passive press recognizer), `:focus`/`:focus-visible`/
`:focus-within` (window first responder), switch `:checked`, `:disabled` and
`:normal` since d0dd2418b, and re-evaluates stylesheet `@media` on host window
resize since 6342fd4a3. Neither is in v0.18.0. The renderer README, known-limits
page, Octane styling reference and issue #62 still said only `:disabled`
responds and media ignore resize. Those claims are corrected.

One source defect was repaired: CSS `:focus-visible` read only
`NSWindow.keyViewSelectionDirection` during the later window-update
notification. Apple documents it as the direction currently used to change key
view, so Tab focus probably reads DirectSelection there (hypothesis; not
reproduced natively). `installCssModalityObserver` now records the last input
modality through the existing renderer key/pointer dispatchers (unmodified or
Shift keyDown = keyboard; left/right/other mouse down = pointer; never consumes
events), installed only when a stylesheet uses `:focus-visible`.
`syncContainerFocus` matches text entry (`textfield`/`textview`/`searchbar`,
browser parity), a non-zero traversal direction, or keyboard modality.
Maintained consumer: the AppKit column resize handle's `:focus-visible` rule.

Media rules use one process-wide viewport, the largest host window's content
area; secondary windows cannot have their own media results. This is documented
as a limit, not changed.

Three new cases in `css-machinery.test.ts`, all UNRUN: modality observer,
`:focus-visible` resolution (modality/direction/text entry/field editor), and
the resize observer (single install, foreign-window filtering, microtask
coalescing, restyle gated on media changes). Recipe `appkit-responsive-layout`
gains AC7 for stylesheet resize media. Release note
`.changelog/appkit-css-states.md` covers the unreleased feature. Lightweight
verification only: two TS files parsed with zero diagnostics, whitespace check.
Actual tracking-area hover, press delivery, OS Tab/field-editor focus,
modality ordering, window resize/restyle timing, VoiceOver and pixels remain
unqualified.

Exact deferred commands (DO NOT RUN until explicit human authorization):

```sh
pnpm exec turbo run test --filter=@octane-xplat/macos-renderer -- test/css-machinery.test.ts
pnpm exec turbo run typecheck --filter=...@octane-xplat/macos-renderer
pnpm probe run examples/probes/container-reveal.macos.tsrx --target macos --watch
pnpm probe run examples/probes/responsive-layout.macos.tsrx --target macos --watch
pnpm check:recipes
pnpm check:docs
pnpm check:doc-examples
pnpm check:changelog
```

## AppKit color control keyboard and assistive adjustment

Tracked in #78 (successor to #62). Source review at 9665f2b04 found
`ColorSlider.macos` and `ColorArea.macos` defined an `adjust` function but
never wired it. They exposed only an adjustable role and label: no value, no
increment/decrement, no keyboard handling and no responder, so the controls
(and the pair inside `ColorPicker`) were pointer-only on AppKit. Web leaves
have Tab focus and arrow keys; mobile leaves have assistive increment/decrement.

Both views now:

- read a `latest` props ref, so retained handlers never replay a stale value;
- share one committed `move` path (clamp, `onHsb`, `onHsbEnd`);
- take arrow keys through `useKeyboard` (hue ±1°, saturation/brightness ±1%,
  Shift ×10), ignoring disabled, prevented, composing and Control/Option/Command
  events;
- become first responder on tap and at pan start;
- expose numeric AXSlider metadata (hue 0–360, brightness 0–100), a text
  `accessibilityValueDescription`, `disabled`/`accessibilityState`, and assistive
  increment/decrement (hue 10°, brightness 5%, as on mobile), dropped when
  disabled.

The renderer returns AXSlider values as NSNumber, so the description carries the
readable text. Public props, shared/web/mobile leaves and the renderer are
unchanged.

Five new cases in `color-controls.macos.mobile.test.tsrx`, all UNRUN: slider
metadata/assistive steps/clamping/callbacks, slider keys, disabled behavior,
area channels/clamping, and the picker's slider path. The app guide gains a
Color controls section (and a Date controls heading, separating content that
sat under Slider on AppKit). Octane primitives reference and release note
`.changelog/appkit-color-control-input.md` updated. No recipe covers color
controls. Lightweight verification only: test file parsed with the TypeScript
parser (zero diagnostics); TSRX view edits parse-checked in isolation;
whitespace clean. Actual responder/Tab order, key delivery, VoiceOver
announcements and adjustment, and pan/tap coexistence on one view remain
unqualified.

Exact deferred commands (DO NOT RUN until explicit human authorization):

```sh
XPLAT_UI_TEST_TARGET=macos pnpm exec turbo run test:native --filter=@octane-xplat/ui -- src/components/forms/color-controls.macos.mobile.test.tsrx src/components/forms/slider.macos.mobile.test.tsrx
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui
pnpm check:docs
pnpm check:doc-examples
pnpm check:changelog
```

## AppKit Chart pointer scrubbing

Tracked in #78. At 838b4cf9b the AppKit Chart leaf only had a tap recognizer
without coordinates, so `onPress` always hit the scene center. AppKit had no
hover or drag scrubbing, while web drives `createScrub` from pointer events.
Charts are lower demand than controls, but hover tooltips are the expected
desktop chart interaction.

The renderer gains `pointer-motion.ts`: per-lease NSTrackingAreas with
entered/exited/moved options (ActiveAlways, InVisibleRect), dispatched through
the existing hover tracking target's new `mouseMoved:` method. These records
are separate from `hoverRecordsByArea`, so cursor, tooltip and CSS hover
records keep their one-area-per-view behavior. `viewPoint` converts window
points to top-left view coordinates with the same math as pan events.
`locatePointer` reads the current mouse down/up event only when it belongs to
the view's window. The bridge exposes `observePointerMotion` and
`locatePointer`; no event monitors or polling were added.

`charts/src/appkit-pointer.macos.ts` maps raw renderer pan events onto scrub
phases: began gives down at the start point then move, changed gives move,
ended gives up, and cancelled or a non-finite end gives cancel. Hover/leave
are suppressed during a drag, so an exit mid-drag does not reset the scrub.
Taps use the located point, falling back to the center. The leaf observes
motion only while interactive. It still consumes the renderer's raw pan
shape because charts has no runtime dependency on the ui `usePan` helper.

Fourteen new cases, all UNRUN: seven renderer pointer-motion cases (conversion,
option mask, dispatch phases, release, lease independence, error isolation,
capability absence, locate filtering) and seven chart adapter cases. The charts
README gains a pointer section; release note `.changelog/appkit-chart-pointer.md`.
No recipe covers chart interaction. Lightweight verification only: six TS files
parsed with zero diagnostics, the TSRX additions parse-checked in isolation,
whitespace clean. Actual tracking-area delivery, currentEvent timing inside the
click recognizer, pan/click coexistence on one view, coordinates under
scaling/RTL, and pixels remain unqualified.

Exact deferred commands (DO NOT RUN until explicit human authorization):

```sh
pnpm exec turbo run test --filter=@octane-xplat/macos-renderer -- test/pointer-motion.test.ts
pnpm exec turbo run test --filter=@octane-xplat/charts -- tests/appkit-pointer.test.ts
pnpm exec turbo run typecheck --filter=...@octane-xplat/macos-renderer --filter=...@octane-xplat/charts
pnpm check:docs
pnpm check:doc-examples
pnpm check:changelog
```

## AppKit decorative border bands

Tracked in #78. At 6f30ff7f5 `syncBorderBox` warned and painted solid for
`double`, `groove`, `ridge`, `inset` and `outset`. These styles now paint as
per-side filled bands on the existing layered border path.

`border-styles.ts` adds three pure helpers:
- `borderBands`: double thirds, or one solid band below width 3; inset/outset
  shade top-left or bottom-right; groove/ridge shade opposite halves.
- `darkBorderComponents`: Chromium `Color::Dark()`, where black becomes grey
  84/255.
- `borderBandPoints`: band trapezoids. `borderSideCGPath` now derives its path
  from this helper, so solid sides keep identical geometry.

The first band reuses each side's shape layer. Extra bands use per-side
`borderBandShapes`, which are hidden for stroked, zero-width and uniform-pattern
states and removed on fast-path return and teardown. Dark fills resolve sRGB
components under the view's appearance; pattern colors keep the base. Only
unknown styles still warn. When shape layers are unavailable, banded boxes warn
and paint solid, like patterned borders. Outlines and box-shadow are unchanged.
Inner band edges stay straight at rounded corners.

Eight new cases, all UNRUN: four pure border-style cases (band table,
darkening, geometry identity, double bands) and four style-reconcile paint
cases (inset shading without warning, double extras and retirement across
solid/double/dashed, unknown style warning, clearing). The style-reconcile fake
NSColor gained component conversion and an sRGB factory. The renderer README
gains a Decorative borders section; the styling guide, Octane styling
reference, recipe `appkit-patterned-borders` AC5, the border fixture's style
cycle and release note `.changelog/appkit-decorative-borders.md` are updated.
Lightweight verification only: four TS files parsed with zero diagnostics,
whitespace clean. Native band geometry, shading under appearance changes,
rounded-corner joins, scale/antialiasing and pixels remain unqualified.

Exact deferred commands (DO NOT RUN until explicit human authorization):

```sh
pnpm exec turbo run test --filter=@octane-xplat/macos-renderer -- test/border-styles.test.ts test/style-reconcile.test.ts
pnpm exec turbo run typecheck --filter=...@octane-xplat/macos-renderer
pnpm probe run examples/probes/border-styles.macos.tsrx --target macos --watch
pnpm check:recipes
pnpm check:docs
pnpm check:doc-examples
pnpm check:changelog
```

## Desktop applicability decisions

Decision #134 (approved 2026-10-29) records which phone-oriented services stay
unsupported on native macOS. No leaf changes: each listed leaf already reports
`supported: false` or warns, and its public docs already say so.

| Area | macOS outcome |
| --- | --- |
| Geofencing | `supported: false`; use `@octane-xplat/geolocation` for one-time positions |
| Haptics | Presets play through `NSHapticFeedbackManager`; `patterns` and `realtime` stay unsupported |
| Firebase Analytics, Crashlytics | `supported: false`; route product analytics to PostHog and crashes to Sentry |
| System bars, software keyboard | Desktop-neutral; calls warn or no-op |
| Pull-to-refresh | Unsupported; put a visible refresh action in the toolbar or content |
| Rich-text editing | WKWebView-hosted editors are the accepted AppKit path; a native editor is not planned |

Barcode scanning is excluded. Issue #78 called it hardware-bound, but
`barcodeScanner.scanImage` decodes still images, and Vision's
`VNDetectBarcodesRequest` can do that on any Mac. It stays an implementation
gap. The haptics row in #78 was also stale: presets were already wired.

## Intel x86_64 support

Decision #135 (2026-10-29): the AppKit target supports Intel Macs as well as
Apple Silicon. Nothing is implemented yet. Every native artifact is currently
arm64-only:

| Artifact | Built by | Ships as |
| --- | --- | --- |
| JSC host, `NativeScript.framework` | `packages/cli/src/macos/jsc-host/build-runtime.sh` | `prebuilt/macos-arm64/` |
| SDK metadata | `build-metadata.sh` | `metadata.nsmd`, loaded by `host.m` as `metadata.macos.arm64.nsmd` |
| Metadata generator | `build-generator.sh` | `objc-metadata-generator` (also runs on the build Mac) |
| Mason layout engine | `packages/macos-renderer/native/xplatmason/build.sh` (Rust `aarch64-apple-darwin`) | `libxplatmason.dylib` |
| App native leaves | `packages/cli/src/macos/native.ts` (`arm64-apple-macos`, Zig `aarch64-macos`) | per-app dylibs |

Packaging and tooling reject other architectures: `package.ts`, `native.ts`,
`doctor.ts`, `inspectMachO` in `jsc-host/runtime.ts`, `workshop` build
checks, `scripts/probe/doctor.ts` and the macOS verification scripts.

Feasibility evidence, source-read only: pinned NativeScript runtimes
`5b697b39` carry x86_64 `objc_msgSend_stret` dispatch in
`ffi/napi/ClassMember.mm`, a `macosx-universal` libffi and an x86_64 metadata
target in `scripts/metagen.js`. Its macOS CMake branch, however, forces
`CMAKE_OSX_ARCHITECTURES` to `arm64`, so our runtimes patch must lift that.
A 2026-10-29 feasibility probe, run with human authorization, settled most
of this. The scratch scripts, logs and report are in the main checkout's
gitignored `research/macos-x86_64-probe/` (`REPORT.md`). Built on this arm64
Mac with Xcode 27.0 and run on the Intel Mac `andromeda.local` (macOS 15.7.7):

| Piece | Result |
| --- | --- |
| x86_64 SDK metadata | Built by the arm64 generator with `-target x86_64-apple-macos11.0`; same `NSMD` layout, 5,017,175 bytes |
| JSC host | Cross-compiled with `CMAKE_OSX_ARCHITECTURES=x86_64`, `minos 13.5` |
| `NativeScript.framework` | Cross-compiled after editing upstream's macOS branch from `set(CMAKE_OSX_ARCHITECTURES "arm64")` to `x86_64`; `minos 13.3` as before; the bundled libffi is already universal |
| Mason | Rust `x86_64-apple-darwin` + clang `x86_64-apple-macos13.5`; `dlopen` succeeds on andromeda |
| Minimal app | The `macos-jsc-app` fixture, packaged for arm64 and then given the x86_64 host, framework and metadata, exits 0 with `JSC_FIXTURE_OK` on andromeda |
| Metadata generator for x86_64 | Fails to link: Xcode's and the Command Line Tools' `libclang` are arm64-only |

What the probe shows:
- `METADATA_BINARY_ARCH` only sets the generator binary's own compile target.
  The emitted metadata's architecture follows the clang `-target`.
- Our `CMAKE_SYSTEM_PROCESSOR` guard does not trip when cross-compiling.
- The probe shipped x86_64 metadata under the hardcoded name
  `metadata.macos.arm64.nsmd`; universal packaging needs `host.m` to select
  the file by architecture.
- Intel Macs can run Xplat apps, but app native leaves cannot yet be built on
  an Intel Mac without an x86_64 libclang.

Still unproven at probe time: the AppKit renderer, Mason layout and native
leaves running inside an x86_64 app, and a universal (lipo) bundle.

**Implemented (2026-10-29).** Packaged apps are now universal:

- **Prebuilts:** `prebuilt/macos/` holds a lipo'd host and
  `NativeScript.framework`, `metadata.macos.arm64.nsmd` and
  `metadata.macos.x86_64.nsmd`, and an arm64-only generator. The manifest
  records `architectures: ["arm64", "x86_64"]`. Mason is rebuilt as a
  universal `libxplatmason.dylib`.
- **Runtime:** `host.m` picks the metadata file by architecture at compile
  time.
- **Binary checks:** `inspectMachO` reads fat files and checks each slice's
  `minos` and `@rpath` loads. It reports a missing slice as
  `<label> lacks an <arch> slice`.
- **Native leaves:** `native.ts` builds each leaf separately per architecture,
  combines the builds with `lipo`, and generates metadata for each
  architecture.
- **Packaging:** output goes to `artifacts/macos-universal/`. Leaf-free apps
  can be packaged on an Intel Mac; native leaves still need an Apple Silicon
  build Mac.

Evidence, 2026-10-29:

| Check | Result |
| --- | --- |
| Prebuilt rebuild (Xcode 27.0, SDK 27.0) | Host, framework and Mason report `x86_64 arm64`; host `minos 13.5`, framework `13.3` |
| `turbo run test --filter=@octane-xplat/cli` | All macOS tests pass, including fat-file, missing-slice, per-slice `minos` and non-Mach-O cases. `route-generation`/`route-platform-contracts` failures appear only in this worktree's install and do not touch this change; the same files passed on the main checkout |
| `packages/macos-renderer` tests (`node --test test/*.test.ts`) | `prebuilt-engine.test.ts` passes for the universal dylib. `style-reconcile.test.ts` still fails on older harness drift (main fails 14 cases in that file) |
| CLI `tsc -p tsconfig.json` | 0 errors |
| `verify-macos-jsc.mjs` | Universal `JSCFixture.app` passes locally and on `andromeda.local` (Intel, macOS 15.7.7): `JSC_FIXTURE_OK`, exit 0 |
| Native-leaf consumer | `verify-macos-native-consumer.mjs` stops at its `xplat doctor` step on fixture checks unrelated to macOS (`packageManager`, `@tsrx/oxc` peer; all macOS rows pass). Running `xplat build --targets macos` in that scratch app compiles 4 universal leaves (C, ObjC, Swift, Zig), passes `codesign --verify --deep --strict`, and prints `NATIVE_VALUES c=40 objc=42 swift=43 zig=44` with exit 0, both locally and on andromeda |

Not run: the `@octane-xplat/platform#typegen`-blocked turbo typechecks and
`macos-renderer` turbo tests (that typegen failure also happens on `main`).
Packaged-consumer qualification and notarization of universal builds remain
open.

**AppKit renderer on Intel (2026-10-29).** Two `main` regressions blocked every
renderer bundle and are fixed:
- `43e25bb8e`: octane 0.16.3 (`cf5e0c68b`, @tsrx/core 0.5.5) rejects
  module-scope `<style>` blocks. The 17 AppKit leaves that used them now
  import sibling `.macos.css` files.
- `9de8129b4`: the readable-host `accessible` branch called a nonexistent
  `setAccessibilityElement` method.

After those fixes:

| Check | Result |
| --- | --- |
| `packages/motion/tests/macos-runtime.mjs` (renderer + Mason layout, shared layout, drag and container assertions) | Passes locally |
| The same bundle on `andromeda.local`, run by the universal host with x86_64 metadata and the universal `libxplatmason.dylib` | Passes: all five `MOTION_*_OK` markers, exit 0 |
| `apps/macos` packaged (`pnpm package`) | Host, framework, Mason and 13 leaf dylibs all `arm64 x86_64`, with both metadata files. The packaged harness mounts without render errors on both Macs |

Two harness findings, not specific to architecture:
- **Output only through a pseudo-terminal:** packaged stdout is
  block-buffered, so `[assert]` lines appear only under a pseudo-terminal
  (`script -q`); `[harness]` lines on stderr appear without one.
- **The sweep stalls:** after `Apps tab mounted shared gallery: OK`, it stops
  making progress before the Counter demo assertion, and no
  `[macos-smoke]` summary appears within 240 s. One rerun printed no
  assertions in 75 s. Not yet diagnosed, and not compared with dev-mode
  `pnpm --filter @xplat/macos smoke`.

Building the packaged app also needed each rich-text package's
`build:assets` step (`dist/macos/browser.js` in `richtext`, `tiptap` and
`lexical`), which `turbo run build` normally runs but which the
`platform#typegen` failure blocks.

### Upstream limitation: NativeScript runtimes force arm64 on macOS

- **Owner and version:** NativeScript/runtimes, pinned `5b697b39`; still
  present on `main` at the same commit (checked 2026-10-29).
- **Limitation:** `NativeScript/CMakeLists.txt`'s `TARGET_PLATFORM=macos`
  branch runs `set(CMAKE_OSX_ARCHITECTURES "arm64")`. That normal variable
  shadows a caller's `-DCMAKE_OSX_ARCHITECTURES`, so the framework can only
  be built for arm64. This is a build limitation, not a runtime one: the
  sources already carry x86_64 dispatch and a universal libffi.
- **Evidence:** a source read plus the x86_64 probe above, where an x86_64
  framework built with the line changed ran on a real Intel Mac.
- **Local workaround:** `packages/cli/src/macos/jsc-host/patches/nativescript-runtimes.patch`
  wraps the line in `if(NOT CMAKE_OSX_ARCHITECTURES)`, and `build-runtime.sh`
  builds each architecture separately and combines them with `lipo`.
- **Removal:** drop the hunk once
  [NativeScript/runtimes#101](https://github.com/NativeScript/runtimes/pull/101)
  lands and the pin moves past it.

The x86_64 metadata-generator probe failed to link against the `libclang`
candidates in the tested Apple Silicon Xcode 27 / Command Line Tools
installation. This does not establish that an Intel Mac's own Xcode or LLVM
installation lacks x86_64 libclang. The shipped generator remains arm64-only,
and the CLI rejects Intel native-leaf build hosts. [Issue #80](https://github.com/octane-xplat/octane-xplat/issues/80)
tracks qualifying an Intel toolchain, distributing its generator and lifting
that restriction. Intel runtime support is already demonstrated above.

Planned shape, pending that probe: universal (arm64 + x86_64) binaries and one
`.app`/`.dmg`, with per-architecture metadata files selected by the host at
compile time. The prebuilt manifest declares its architectures, and packaging
builds exactly the declared set.

## AppKit barcode still-image decoding

`packages/barcode-scanner/src/barcode-scanner.macos.ts` now decodes still
images through Vision instead of reporting `supported: false`. `scanImage`
takes a path, a `file:` URL, `{ uri }` or an `NSImage`. Remote URLs reject,
and so do unreadable images and a failed `performRequestsError`.
Symbologies are prefixed string literals, because the generated metadata
targets macOS 11 and omits `VNBarcodeSymbologyCodabar`. The assumption that
each constant's value equals its name is unverified on a running Mac.

- **Formats:** omitted formats request the whole Xplat vocabulary.
- **UPC-A:** Vision reports UPC-A as a leading-zero EAN-13; this is rewritten
  to `upc_a` unless only `ean13` was requested.
- **Bounds:** converted from Vision's normalized bottom-left box into CGImage
  pixels with a top-left origin. EXIF orientation is not applied.
- **Threading:** decoding runs synchronously on the main thread.
- **Live scanning:** stays unavailable, and `ensure()` reports `'unsupported'`.
- **Permission owner:** the macOS leaf no longer registers a camera owner. It
  had registered a bare function, but `@octane-xplat/platform` permissions
  expect `{ getPermissions, requestPermissions }`. The iOS/Android, web and
  Windows barcode leaves (and others, such as `contacts`) have the same
  bare-function registration; that cross-platform bug is logged in Silo
  `feedback_observations` and is not owned by this target.

Six node:test cases in `packages/barcode-scanner/tests/macos.test.ts`, all
UNRUN, drive the leaf in a vm with stub Vision/AppKit globals (haptics
pattern). They do not exercise Vision. The package gained a `test` script; the
README and release note `.changelog/macos-barcode-image-decoding.md` are
updated. Lightweight verification only: both TS files parsed with zero
diagnostics, whitespace clean.

Exact deferred commands (DO NOT RUN until explicit human authorization):

```sh
pnpm exec turbo run test --filter=@octane-xplat/barcode-scanner
pnpm exec turbo run typecheck --filter=...@octane-xplat/barcode-scanner
pnpm check:docs
pnpm check:doc-examples
pnpm check:changelog
```


### Smoke stall investigation after migration (2026-10-29)

The authorized dev-mode comparison first exposed two current-`main` compile
failures. Commit `e65e5bc85` adapts the AppKit WebView message to the shared
`{ data, url }` payload and restores the files export leaf's missing
`MIME_EXTENSIONS` import. UI and files declaration generation then passed.
Targeted WebView and smoke-runner lint passed; files lint still reports eight
pre-existing brace-rule errors outside the import change.

The first runtime attempt did not launch its host: its 120-second deadline
expired while compiling native leaves. Commit `151903bbf` adds an explicit
cold-build timeout override, preserving the 120-second default and all 30
required assertions:

```sh
XPLAT_MACOS_SMOKE_TIMEOUT_MS=600000 pnpm exec turbo run smoke --filter=@xplat/macos
```

Nonvisual samples of the previously packaged app on Apple Silicon macOS 27.2
showed active JavaScript/native work during startup. At about 96 seconds the
main thread was inside `NSWindow.recalculateKeyViewLoop` and Mason subtree
layout, not parked waiting for a host timer. A temporary bundle that skipped
that call reached the AppKit event loop but still spent its run in native
layout and produced no smoke summary in 100 seconds. This is diagnostic
evidence, not a production workaround or a root-cause conclusion. The original
Counter-route stall remains unqualified. Raw samples and temporary bundles
are local under `research/smoke-stall/`; Turbo output is in
`/tmp/appkit-dev-smoke{,2,3,4}.log`.

The 600000ms dev run built and launched the host with 13 native leaf
libraries. It eventually passed Home mount and Home counter assertions, then
stopped progressing after dispatching the Apps-tab action. The resource broker
cancelled the workload with `resource workload cancelled or task ownership
lost` before a final summary. This is an interrupted run, not a 30-assertion
pass or a timeout result. `dev.sample.txt` shows active Mason work during
startup; `dev-idle.sample.txt` shows AppKit constraint updating after the tab
action. A low instantaneous CPU reading alone does not prove a timer failure. A separate temporary
engine-call profiler counted 434 engine nodes and 22,085 style submissions,
10,284 dirty calls and 867 compute/layout pairs by 96 seconds. These counts
identify repeated subtree synchronization as a useful next measurement target;
they do not establish which invalidations are unnecessary.

Broad checks remain outside the narrowly authorized stall investigation; no
new merge qualification is claimed. Before integration, run:

```sh
pnpm exec turbo run typecheck --filter=...@octane-xplat/ui --filter=...@octane-xplat/files --filter=...@octane-xplat/macos-renderer --filter=...@xplat/macos
```

No public API or recipe behavior changed in these compile and harness fixes.
The native input, VoiceOver, presentation and notarization gaps above remain
open. Local Silo feedback preserves the compile and cold-deadline expectation
mismatches (`a7b30cd8-bfd1-4319-bd57-ddd17a53b01c`,
`53a5dcff-3031-42a2-8cc3-ad8983818de7`).


### Unchanged Mason style submissions (2026-10-29)

Commit `44f9967c1` caches the last successful native style dictionary for each
renderer node. Repeated subtree synchronization skips unchanged style writes.
Temporary root and scroll-content sizing use the same cache, so an ancestor
pass restores authored dimensions. Style removal, native handle recreation and
failed writes invalidate or replace the cached value. Leaf measurement dirty
calls and layout scheduling retain their existing behavior.

The focused `test:mason` task executes source against fake native hosts; it
needs no generated SDK declarations or native process. All 22 tests pass,
including repeated style synchronization, root resizing, scroll-content sizing,
property removal, reused native handles and recovery from failed style writes:

```sh
pnpm exec turbo run test:mason --filter=@octane-xplat/macos-renderer
```

Targeted lint passes with the existing unused `make` warning in `mason.ts`.
The attempted native comparison was cancelled by the resource broker after
4m49s, during dependency preparation, with `resource workload cancelled or
task ownership lost`. It never launched the host. Output is local in
`/tmp/appkit-mason-smoke.log`; focused test output is in
`/tmp/appkit-mason-tests4.log`. This second broker cancellation does not prove
a timeout, runtime regression or runtime improvement. The full 30-assertion
sweep remains required, and no native qualification checkbox closes here.

This is an internal bridge optimization with no public API, recipe or agent
workflow change. No startup-speed or stall-fix claim is made without the native
comparison. The dependent typecheck above now includes `macos-renderer`;
merging remains deferred until those required checks can run.

### Scroll-container bounds and first complete sweep (2026-10-30)

Commit `8211f9a90` fixes the root cause shared by the `vlist` assertion
failure and the observed sweep stall. On AppKit, a `<scrollview>` Mason leaf
measured its full document size, and every column flex ancestor carried an
unbounded content-based minimum. A `flex-1` scroll view plus the
screen/tabs/tab-pane/route-pane chain therefore expanded to full document
height instead of the window bound. `VirtualList` then read a viewport equal
to the whole document and mounted all 500 rows; the ensuing mount, layout and
bridge/GC churn presented as the earlier stall (a CPU sample showed the main
thread inside one timer callback's microtask drain under JavaScriptCore
garbage collection and `ObjCObjectTypeConv::toJS` conversions).

Two complementary changes restore the bound:

- `mason.ts`: a scrollview's automatic minimum size is zero along its scroll
  axis unless the author sets an explicit min dimension. This also bounds
  flex-1 scroll areas such as the Test tab's `test-scroll`.
- `tokens.css`, `app.css`, `RoutePane.macos.tsrx`: `min-width`/`min-height: 0`
  and `flex-shrink: 1` on the macOS `.vx-screen`/`.vx-tabs`/`.vx-tabpane`/
  `.vx-app` chain and the active route pane, so the window bound reaches the
  scroller. Mason computes a container's content minimum from child measures
  rather than child min styles, so per-level min rules are required.

Verified locally on Apple Silicon macOS 27.2:

```sh
XPLAT_MACOS_SMOKE_TIMEOUT_MS=600000 pnpm exec turbo run smoke --filter=@xplat/macos --only
```

— 30 assertions, 0 failures in 3m18s. This is the first complete local AppKit
sweep: the VirtualList windowed the 500-row list (3 rows mounted at assertion
time), the drop-first mutation passed, and the sweep finished through the Test
tab. `pnpm exec turbo run test:mason --filter=@octane-xplat/macos-renderer`
passes 22/22. The assertion line is action-dispatch evidence; OS input,
hit-testing and pixels remain unqualified.

Ablations: with only the `mason.ts` change the ancestors still expanded and
the assertion failed (500 mounted, `vp=24031`); with only the CSS/route
changes the scrollview leaf itself still overflowed its bounded parent
(500 mounted, `vp=27541`). Both are required.

The dependent typecheck command above currently fails in `macos-renderer`
with 25 pre-existing errors in `index.ts`, `keyboard.ts`,
`outline-headings.ts`, `image-fit.ts` and `context-pointer.ts` — none in the
files changed here; several look like stale or incomplete generated
declarations (for example `NSAccessibilityPostNotification`). Several
packages' `typegen` tasks also failed in this worktree's run. These are
unrelated to this change but still block the merge-qualification typecheck.
No public API or recipe behavior changed. Temporary sweep/ancestry
diagnostics were reverted before commit.

### Deferred suite runs and packed-consumer repair (2026-10-30)

Local runs against the landed scroll-bound fix:

- `turbo run test --filter=@octane-xplat/files`: 91 vitest tests + 7
  node:test cases pass, including `files.macos.test.ts` (11) and the AppKit
  pick-filter, file-input and bridge suites. Source-level coverage only —
  NSOpenPanel/NSSavePanel runtime qualification stays open.
- `turbo run test --filter=@octane-xplat/macos-renderer`: 645 pass / 19 fail
  in files unrelated to the scroll change (`text-value`, `applyProps`,
  `image-fit`, table truncation, `letterSpacing`, field-editor adapters).
  Several look environmental (for example `deepStrictEqual` reporting
  "same structure but not reference-equal" on plain `{location,length}`
  objects) but the set needs an owner before it counts as green.
- `ui` `test:macos` lane: `macos-value-exports`, `query-storage`,
  `table-universal` (29 node tests), `thumbhash`, `macos-barrel` and
  `packed-consumer --macos-only` all pass after two repairs —
  `4eceb4f18` retarget the consumer's `jsxImportSource` from
  `macos-renderer` (whose jsx-runtime entries were removed in `308c14c58`)
  to `@octane-xplat/jsx` and count all seven keyboard-inset doc examples;
  `5536b92ba` drops css side-effect imports from generated
  declarations so `tsrx-typegen --pack-check` reports "packed exports and
  declaration graph are valid" instead of 18 unresolved `.css` references.

`turbo run pack:check --filter=@octane-xplat/ui` is green. The
`macos-renderer` typecheck (25 errors in unrelated files) and the 19
renderer test failures remain the open verification blockers recorded
above; both predate the scroll-bound change.

### Renderer typecheck repaired and ASI crash fixed (2026-10-30)

`245587637` fixes a real runtime bug: a leading `[` on the line after
`return null` in `parseImagePosition` continued the expression as
`null[x, y] = [y, x]`, throwing TypeError for two-token positions mixing a
vertical/horizontal keyword with a length (for example `bottom 10px`).
`11a30aaf1` clears the 25 pre-existing `macos-renderer` typecheck errors —
ancestor-walk null checks, heading-outline narrowing, the missing
`NSGestureRecognizer`/`NSAccessibilityPostNotification` imports, a
super-property read annotation, `NSTextAlignment` typing, the file-drop
`AppKitView` comparison, optional `HeadingView` members and AppKit property
assignment for picker labels. `tsc --noEmit -p tsconfig.json` is clean for
`macos-renderer`; the merge-qualification typecheck command above no longer
fails on this package.

The authored `macos-renderer` suite now reports 647 pass / 17 fail (was
645/19 — the image-fit cases recovered). The remaining failures are
pre-existing and unrelated to this task's changes: `deepStrictEqual`
reference-equality mismatches on stub objects and assorted feature tests in
`applyProps`, `testID`, table truncation, `letterSpacing`, field-editor and
inventory files. They still need an owner before the suite counts as green.

### Merge-gate typecheck rerun (2026-10-30)

After the renderer repairs, the recorded command ran 74 tasks: 59 succeeded,
failing only at `@octane-xplat/keyboard#typecheck` — its
`tsconfig.envs.json` "native" environment pattern requires
`types/generated/index.d.ts`, but the `typecheck` task does not depend on
the package's own `typegen` (only `^typegen`). `pnpm --filter
@octane-xplat/keyboard typegen && typecheck` passes clean. This is an
ordering gap in the leaf-declaration refactor landed on main
(`89794c053`…`a5fcfea3d`), not in this task's AppKit work. A second full
smoke sweep after the typecheck repairs passed 30/30 assertions in 4m31s
(`/tmp/appkit-post-typecheck-smoke.log`).

### Renderer suite failure root cause identified (2026-10-30)

The 17 remaining `macos-renderer` failures are dominated by one mechanism:
the vm-slice harness (`runInNewContext` in `test/mock-globals.ts` and direct
calls in image/picker tests) evaluates source fragments in a fresh JS realm,
so objects the slice creates carry that realm's `Object.prototype`.
`assert.deepEqual`/`deepStrictEqual` then reports "Values have same
structure but are not reference-equal" for structurally identical values.
The fix is per-assertion: spread or field-wise compare at the failing sites
(`{ ...editor.selectedRange }` style). Running slices in the main realm is
**not** viable — `runInThisContext` leaks top-level `var`/`function`
declarations into `globalThis` and breaks hundreds of tests (attempted and
reverted). Owner needed for the per-site edits; the `applyProps`/`testID`
cluster and the action-metadata/inventory cases should be re-inspected
after the realm fixes in case they share the cause.
