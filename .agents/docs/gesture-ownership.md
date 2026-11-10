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

The iOS raw-contact adapter snapshots UIKit contacts in logical window units.
Filter ended/cancelled touches from `UIEvent.allTouches`; that collection is not
an active-pointer list. Freeze the window-to-local basis for translation while
recomputing local positions against the current host transform. The Android bridge maps stable MotionEvent pointer IDs and converts screen pixels
to logical window units. Real OS pan and pan-to-pinch qualification exists for
both mobile adapters; retain the exact evidence boundaries in Silo. The AppKit
prototype supports one mouse contact; direct-touch pinch and trackpad
magnification reject attachment explicitly. Other native hosts reject this
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
Mouse qualification uses window-targeted native events posted through the OS queue.
A direct accessibility method call is handler-route evidence, not screen-reader
qualification. A background probe without a key window cannot qualify OS keyboard
activation; do not substitute that result for a broken gesture recognizer.

Callback refs can be replaced within one renderer commit without the native host
changing. Coalesce that temporary null ref through the commit's microtask boundary;
retain the registration if the same host returns. Actual host replacement detaches
immediately, component cleanup disposes synchronously, and a remaining null ref
cancels before the next OS input turn.

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
Their private GTK/Windows widget transport does not establish shared gesture support.

Opaque platform widgets remain native input boundaries. Native sheet presenters,
third-party drawer engines, embedded editing engines and OS navigation cannot be
claimed or frozen merely because a wrapper is a View. The initial suspension
adapter rejects unknown native subclasses. Do not advertise engine interoperability
or replace their gesture machinery without a separate adapter qualification.
The native Drawer still uses ui-drawer's engine; closed-edge intent and its
animation lifecycle need an adapter before it can share custom gesture composition.
This boundary is separate from the public pan/pinch cutover, not proof of coordinated
native drawer/descendant gestures.

Component callbacks bridge errors into their mounted renderer boundary after
synchronous cancellation/finalization. A retired component cannot receive a
state update; errors from its cleanup use the uncaught-error route. Keep engine
fault reporting separate from app callback errors. Maintained handler tests
qualify this route; they do not qualify OS interruption by themselves.
