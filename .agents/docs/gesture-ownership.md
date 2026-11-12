# Gesture ownership core

The public hooks and component attachment contract are implemented under
`packages/ui/src/gestures/`. Use the [gesture guide](../../docs/app/gestures.md)
for app code and [the approved design](../design/gesture-system.md) for rationale.
The public cutover removes independent `onSwipe` and translation aliases;
`onPan`/`onPinch` conveniences use the same samples as typed handles.

The coordinator owns contact sequences and recognizer sessions. Gesture handles
own committed callbacks and read-only Octane signal projections. Composition is
a tree of handle identities: rebuilding equivalent descriptions must not replace
recognizers. Priority means waiting for earlier eligible candidates to fail;
competition means first activation wins. A dormant pinch can become eligible
when a second contact invalidates a one-contact pan; cancelled one-contact
recognizers cannot restart before all fingers lift.

## Signal ownership boundary

Allocate component-local cells through compiled signal hooks/declarations, not
an imperative `Scope.signal$` call during rendering. Imperative scopes are for
non-render owners such as the input coordinator and standalone qualification
fixtures. Keep the public projections branded and read-only.

Octane retires local signal owners before ordinary effect/ref cleanup. An
attached controller observes its exact signal cell's retirement through the
signal binding protocol, finalizes from its retained sample, and suppresses
publication into retired cells. While cells remain alive, publish ownership and
state before invoking lifecycle callbacks. Cleanup is idempotent; retaining a
handle must not prolong a component's signal lifetime.

## Verification boundaries

Use [the focused gesture checks](testing.md#gesture-owner-checks) for the shared
state machine, compiled hook lifecycle, and browser input adapter. The browser
fixture mounts public hooks, layout/scroll hosts, Pressable and Motion. It uses
actual browser mouse/keyboard/wheel input plus explicit virtual-click and capture-loss
API calls. This does not qualify touch momentum or native input.
Native object-driver tests verify signal/lifecycle contracts, never OS gesture
delivery. Keep platform input qualification separate and retain actual results
outside Git, following [exploration](exploration.md).

## Host bindings and suspension leases

`createGestureBinding` compares leaf identity and composition structure after
commit. New description objects do not replace registrations; host replacement
or a changed relationship tree disposes the old attachment. Platform adapters
must roll back partially attached listeners, reservations and registrations if
attachment fails. Raw native observers may receive the same event through
several ancestors; deduplicate at the window owner, never per recognizer.

Desktop host bridges share the runtime-neutral mouse integration in
`packages/ui/src/gestures/input.host.ts`; AppKit supplies its native surface and
activation provenance. GTK and Windows feed the same wrapper and owner. Its affine basis helper freezes plain numeric conversions; parent-local conversion keeps Motion outside the host's own transform. This wrapper does not add touch policy or suspension.
The native root resolves each claim through the registered host's scheduler,
not the scheduler of the first surface retained in that root. Keep frame/error
scheduling root-scoped and native claiming host-scoped.

The iOS raw-contact adapter snapshots UIKit contacts in logical window units.
Filter ended/cancelled touches from `UIEvent.allTouches`; that collection is not
an active-pointer list. Freeze the window-to-local basis for translation while
recomputing local positions against the current host transform. The Android bridge maps stable MotionEvent pointer IDs and converts screen pixels
to logical window units. Real OS pan and pan-to-pinch qualification exists for
both mobile adapters; retain the exact evidence boundaries in Silo. The AppKit
prototype supports one mouse contact; direct-touch pinch and trackpad
magnification reject attachment explicitly. GTK and Windows provide the same bounded mouse subset; other native hosts reject this
internal adapter explicitly. Do not infer support
from the shared coordinator or declarations.

Scope leases count owners. A native driver's first freeze must preflight and
roll back its own partial mutations; only a successful freeze publishes
suspended state. The last release restores input. Detach removes the driver
before notifying subscribers, and retirement restores native state without
writing into retired signal cells. Acquisition during freeze/restoration returns
`busy`; detached or unsupported operations return their specific failure. A
synchronous unmount caused by suspension publication returns `detached` after
restoration. A scope cannot be attached to more than one host.

The scroll-policy registry intersects independent reservations at every managed
viewport, including viewports mounted under an existing reservation. This does
not change overflow, offsets or layout. Host integration must register the actual
scroll viewports and refresh ancestry after committed reparenting. A registry
unit test does not prove that Mason/browser scrolling obeys its policy.

## Browser adapter limits

The internal web adapter shares one policy writer between a gesture host and a
managed viewport, intersects authored restrictions with reservations, and updates
policy after committed options or live enablement changes. Every attachment owns
a root lease; removing a gesture must not remove listeners still needed by a
scope or viewport.

Browser scope suspension requires `inert` and an input-only subtree. It rejects
scrollable overflow, embedded foreign documents, and a focused editable control
before mutation. Wheel/key/click guards supplement `inert`; overlapping scopes
restore the original flag only after the final owner releases. Do not turn this
bounded input gate into a scroll-freeze claim: stopping existing browser touch
scrolling and momentum remains unqualified. Programmatic handler dispatch is not
accessibility-service evidence.

For iOS admission, collection sizes are not a reliable first-down marker. Also
prefer Mason's public `elementFromPoint()` and logical parent chain when
available: a framework layout tree must not be inferred from UIKit ancestry
alone. Retain physical native hit testing for non-Mason hosts. The real concurrent
pinch gate remains separate from the mounted bridge regression.

## Semantic participants and host lifetime

Semantic presses share the root contact owner. A successful pan claim cancels
pointer activation before its start callback. That rejection persists through
release, while a new independent down and non-pointer activation remain eligible.
Native pointer activation follows the owner's successful release; SDK semantic
tap delivery must not produce a second action. Keep the SDK route for virtual
activation and native double recognition. Avoid Mason's tap-to-click alias for
native eligibility. Commit new handlers without replacing contact observers.

AppKit's action store retains explicit pointer, keyboard and accessibility origin
at the dispatch boundary. Managed interception runs after the renderer's disabled
and lifecycle checks; ordinary action ownership is unchanged without an interceptor.
Shared presses subscribe to the scoped keyboard dispatcher for unmodified Enter
and Space; prevent the native default only for an eligible focused owner. A
lazy `NativeClass` base's `keyDown` method is not sufficient native registration.
The eager native action base in `accessible-host.ts` supplies AX action selectors
before Mason subclasses are allocated; semantic properties retain their native
push path. Never replace an AX-service check with a direct JS method call.
Coordinate conversion includes backing-layer transforms before the adapter
freezes the parent plane. NSView-only conversion mis-scales a Motion drag under
a transformed parent even when its nested button still receives the input.
Mouse qualification uses window-targeted native events posted through the OS queue.
A direct accessibility method call is handler-route evidence, not screen-reader
qualification. A background probe without a key window cannot qualify OS keyboard
activation; do not substitute that result for a broken gesture recognizer.

Callback refs can be replaced within one renderer commit without the native host
changing. Coalesce that temporary null ref through the commit's microtask boundary;
retain the registration if the same host returns. Actual host replacement detaches
immediately, component cleanup disposes synchronously, and a remaining null ref
cancels before the next OS input turn.

Native `loaded` can precede window attachment. A retained UIKit sheet can reuse
the same size, so another `layoutChanged` is not guaranteed. The shared native
interaction hook retries readiness once on an animation frame after its loaded
microtask. Coalesce duplicate events and cancel the retry on unload, host
replacement, or disposal. Never keep a frame loop alive for a detached host.
Keep real-input repeated presentation separate from object-driver lifecycle tests.

Native bridged point/size/rect fields need explicit numeric copies. Do not spread
Objective-C structs: their fields can be non-enumerable. Translation freezes its
axis basis at first contact, including a dormant multi-contact recognizer; its
centroid baseline starts when its required contact count becomes available.
Pointer-count signals continue to observe the cohort after cancellation.

## Bounded iOS suspension

The iOS driver cancels competing UIKit recognizers, then seeks supported
Mason scroll surfaces to their current offsets to stop deceleration/tweens. It
excludes the coordinator's raw-contact recognizers, so cancelling a descendant
cannot destroy an outside owner's observation. Native flags use overlapping leases;
restoration attempts every saved flag even after a cleanup failure. Never change
overflow to enforce input policy.

Success is restricted to the UIKit/Mason surfaces covered by the driver. Unknown
native subclasses, native controls, editable text, embedded WebViews and bouncing
UIScrollViews outside their legal offset range return unsupported before mutation.
Managed viewports mounted during a lease inherit its reservation. Framework scope
membership follows context, including across portals; members outside the physical
adapter's coverage make suspension unsupported. An uncovered portal cannot mount
into an already suspended scope. Portal targets register ownership during insertion, before layout commands can
acquire a lease. An uncovered portal is rejected during render while suspended. Browser scroll momentum and Android/AppKit full-input suspension
remain unsupported; no input-only lock may be advertised as a scroll freeze.

Convenience callback controllers allocate after commit and only while a callback
exists. Ordinary layout hosts allocate no gesture signal cells. Keep the typed
hook's renderer-owned cells separate from this imperative convenience lifetime.
Binding revisions prevent an older cleanup from overwriting a newer registration.

Octane's universal renderer cannot recursively replace its root with
`flushUniversalSync(root.render(...))` from a cancellation callback during an
already committed native host batch. This is an upstream root-transaction limit,
not proof that component state updates fail: compiled tests verify a normal
state setter can schedule the replacement gesture from that same cancellation
path. Keep direct root replacement outside the in-progress commit; coordinator
cancellation remains synchronous. The original failure is retained in Silo's
feedback observations and a local report.

## Framework consumers and opaque engines

Motion's pan and visual press subscriptions use the framework-only
`@octane-xplat/ui/internal/gesture-input` integration boundary. It allocates
controllers only after host commit; package consumers do not import private
controller files or create independent recognizers. Visual observers never
become a second semantic activation target and cancel before pan start.
Motion's x/y channels use a frozen logical-parent basis, excluding the host's
own transform. Public pan hooks keep their frozen host basis. Local grab points
still refer to the attached host. Preserve this distinction in platform adapters.
Built-in sliders/resize handles use the same owner with manipulation priority.
GTK/Windows controls now use these same manipulation registrations. Raw `view.on("pan")` remains a separate widget API; framework controls must not install it alongside shared ownership.

Opaque platform widgets remain native input boundaries. Native sheet presenters,
third-party drawer engines, embedded editing engines and OS navigation cannot be
claimed or frozen merely because a wrapper is a View. The initial suspension
adapter rejects unknown native subclasses. Do not advertise engine interoperability
or replace their gesture machinery without a separate adapter qualification.
Mobile Drawer now uses the common owner through the internal gesture-input boundary.
Its leaf supplies synchronous edge admission and signed intent before activation;
the enabled host reserves its horizontal axis before OS recognition. The default Motion
bridge retains its frozen parent basis; Drawer selects its stable root host basis.
The owner still enforces native manipulation boundaries and exact-one pointer
cancellation. No public cross-host composition graph is added. The UI scalar
animation engine drives one leaf presentation writer; generation checks prevent
stale settles from committing state. See [Drawer](native-drawer.md) for limits.
UI BottomSheet's private grabber pan and platform-native sheet presenters remain
separate integration boundaries; do not generalize Drawer qualification to them.

Component callbacks bridge errors into their mounted renderer boundary after
synchronous cancellation/finalization. A retired component cannot receive a
state update; errors from its cleanup use the uncaught-error route. Keep engine
fault reporting separate from app callback errors. Maintained handler tests
qualify this route; they do not qualify OS interruption by themselves.

## Desktop input leaves

GTK uses one capture-phase raw event controller per native input surface (window
or popover), filters ancestor delivery by Gdk surface and copies mouse data,
and resets pending native gesture tracking only when the owner claims. Editing,
adjustable and hosted native controls remain boundaries. Semantic Mason buttons
keep role-specific keyboard bindings and acquire focus on pointer press. The
persistent ref surface supports focus/blur subscriptions with native controller
cleanup so Motion can mount without relying on raw GTK signals. Semantic Mason
controls expose a parameterless GAction through the existing press registration;
AT-SPI actions carry virtual provenance independently of active pointer cohorts.
Retirement disconnects the action and its callbacks. A role or label alone does
not establish an accessibility action. Use the
[packed public-component gate](../../tools/platform-qualification/desktop-gestures/README.md#packed-public-components)
to exercise this boundary through the service and real input. The
preset resolves signal imports beside the selected universal runtime; mixing
Node/default export trees creates independent hook-owner registries. GJS roots
install a Promise-backed `queueMicrotask` when absent because Octane's signal
publication/retirement also uses that global, separately from root scheduling.

Windows stages UI's `platforms/windows/GestureInput.cs` through the NativeScript
plugin pipeline and compiles it into the native host. Its typed WinUI observer
normalizes one mouse contact and handles capture, window interruption and cleanup.
One managed callback per visual input root feeds the shared owner. Popup visual
trees own separate input roots even when they share XamlRoot; Motion parent
conversion rejects a parent in another root. The pinned beta.24 API
uses `NSWinRT.dotnet.asDelegate` for managed callbacks; `NSWinRT.asDelegate` is for
WinRT delegates. Native semantic peers and their transparent templates are
constructed in the existing managed bridge. Their WinUI overrides mark the
pointer/key origin synchronously; typed Click/LayoutUpdated subscriptions carry
that origin and release explicitly. The packed Core consumer lost a JS-composed
peer's ButtonBase identity at managed ingress; assigning its WinRT-created
template across that boundary also failed. Do not infer this integration from a
standalone WinRT peer gate or revert to pointer-down timing heuristics.
Raw native views cross this same boundary through the runtime's public pointer
key and an explicit C#/WinRT UIElement projection. The JS surface retains the
source view throughout the native call and observation lease; no pointer escapes
into public gesture events. Object-typed `OriginalSource` can likewise arrive
as `IInspectable` for custom Mason classes; query its known UIElement base
before walking the visual ancestry, including parents returned through the
base DependencyObject API. Native transport IDs use canonical IUnknown keys as
opaque strings, avoiding managed-wrapper identity and numeric precision loss. The JS surface, observed
root and active hit elements retain their native views; no identity cache outlives
those leases. Temporary COM queries release on the UI thread. A managed-button hit-path
pass does not qualify an ordinary Mason track. Readiness queries XamlRoot directly rather
than probing mobile member names on a WinRT proxy.
Windows frames and managed holds use cancellable WinUI DispatcherQueue timers
through the existing owner scheduler. The isolated beta.24 host did not execute
a JavaScript timeout despite its template pump; do not qualify the native
scheduler by assuming a working global timer. The runtime timeout/pump gap is
bounded to that host fixture and still needs upstream/packed-host qualification.
Virtual actions remain eligible during an unrelated pointer cohort. Never infer
activation source from pointer-down state or a timing window.

Both desktop leaves reject pinch and multi-contact configurations, including
configuration changes on an existing attachment. Receiving mouse contacts does
not reserve touch axes, stop wheel input or suspend native momentum. Desktop
full suspension remains unsupported. Native window coordinates are logical
units; native screen positions remain null. Packed public-component, Motion,
Mason and accessibility-service qualification remain separate from transport
and handler checks; consult Silo and retained reports for the actual artifacts.

Leaf admission is a predicate inside the existing owner, not an external-engine
capture protocol. `PanAdmission` rejects first-down regions and signed intent
before claim; optional live enablement supplements the ordinary signal/prop
configuration. Native horizontal reservations must exist before contact. A
per-down policy write cannot promise to revoke scrolling already admitted by
the native engine. With NativeScript core 9.1.3 on Android, `loaded` can precede
OS window insertion for hidden descendants; native adapter attachment then
rejects a missing window. The maintained [Drawer input fixture](../../packages/ui/tests/fixtures/drawer-input.mobile.tsrx)
exercises the composed host. Common hosts and imperative leaves work around
this by retrying after committed load/layout only when the native view is
attached (Android `isAttachedToWindow`, iOS `window`, Windows XamlRoot).
Imperative framework owners share this deferred lifecycle with the component
hooks; a NativeScript ref may arrive before its native-view property exists.
Cleanup invalidates queued
attachment callbacks. Reassess the readiness gate if upstream guarantees
window insertion before `loaded`; do not remove it on build evidence alone.
