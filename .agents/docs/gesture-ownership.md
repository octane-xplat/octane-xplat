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
