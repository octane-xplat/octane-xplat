# Gesture ownership core

The typed ownership core under `packages/ui/src/gestures/` is internal while the
[gesture proposal](../design/gesture-system.md) is implemented. Its hooks and
composition helpers are not exported from the package root. Production gesture
props still use their existing implementation until the platform bindings and
public cutover are qualified; do not document the prototype as released support.

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

Use [the focused gesture checks](testing.md#gesture-owner-checks) for the internal
state machine, compiled hook lifecycle, and browser input adapter. The browser
fixture deliberately uses the real internal adapter without importing the public
UI barrel; it does not establish a completed Pressable or scrolling cutover.
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

The internal iOS driver cancels competing UIKit recognizers, then seeks supported
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
into an already suspended scope. Context/host bindings remain private until the
public cutover. Browser scroll momentum and Android/AppKit full-input suspension
remain unsupported; no input-only lock may be advertised as a scroll freeze.
