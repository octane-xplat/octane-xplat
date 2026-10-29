# Stripe checkout implementation and qualification

The package follows @stripe/stripe-react-native 0.84.0's initialization,
PaymentSheet result and URL-callback shapes. Public declarations were explored
with exports-md before selecting the subset. Expo's current integration uses
that library; it is not an Expo-owned payment engine.

## API and engine choice

The first supported subset is guest PaymentIntent checkout. It deliberately
omits saved-customer flows, SetupIntents, customFlow, card primitives, manual
confirmation and appearance settings. Unknown initialization/sheet options
reject. The app owns server authorization, order amount/currency, Intent
creation and webhook fulfilment. No client success result proves payment
settlement, and no native bridge returns raw SDK objects or errors.

The available @triniwiz/nativescript-stripe 9.0.1 declarations contain no
PaymentSheet API. Its packaged settings pin Stripe iOS22.8.1 and Android20.17.0.
Instead the leaf bridges official iOS26.15.1 and Android23.25.1, matching the native
SDK versions declared by Stripe React Native0.84.0. The modern iOS SDK ships
through Swift Package Manager, so the product declares plugin-level SPM config
rather than the obsolete CocoaPods dependency. Source inspection used opensrc
for these exact SDK tags; implementation code was not copied.

Web uses @stripe/stripe-js10.2.0's pure loader and Payment Element in a native
HTML dialog. The adapter requires a server-created card-only Intent and disables
web wallets. This narrower web contract avoids silently accepting delayed
methods under a guest card-checkout promise. Native wallet options configure
only their corresponding native platform, following the upstream convention.

Stripe's package declares an iOS15 minimum and its PaymentSheet depends on UIKit.
No AppKit backend is wired. Native GTK and Windows also have no backend; each
imports safely and reports unavailable rather than embedding a second browser
checkout inside the native API.

## Ownership and failure behavior

The app has one SDK configuration and one active checkout. The coordinator
snapshots options before its first await, prevents overlapping mutations,
invalidates the earlier order before replacing a prepared sheet, and drops
prepared state after completion/reset. A failed or canceled presentation can
retry the same Intent. Reconfiguration and disposal reject while busy.

The Octane hook returns stable app-scoped operations and owns no per-screen
presentation. App authors keep the action owner alive until it resolves; an
unmount must not dismiss another caller's checkout. Browser confirmation disables
cancel while pending, preserves the form after a decline and destroys Elements
and dialog resources at the end. A redirect can navigate away; the return route
must restore the order and verify it with the server.

The Android bridge starts a private ComponentActivity so Stripe can register its
ActivityResult launcher before STARTED. Request data lives in process memory,
not Intent extras or saved state. Process death drops the client request; the
app must recover through server order state. Android runtime is unverified.

## Evidence

- Ten tests pass: six coordinator tests for validation, immutable option
  snapshots, replacement invalidation, overlap/retry, failure sanitization and
  callback routing and encrypted return URLs; four JSDOM dialog tests for SDK-owned mounting, cancellation,
  decline retry, confirmation exclusion, failed load cleanup and browser gating.
  Stripe is mocked at these boundaries. This is not a real payment test.
- Combined source typechecking passes for web/iOS/Android and native desktop
  entry points. The maintained checkout action is included in the source check.
- Packed consumer checks pass with ambient-free web/native declarations, web
  production bundling, iOS adapter resolution and shipped Android/Swift/config
  files. This does not prove platform-native compilation or installed checkout.
- On skymac.local, the Swift bridge typechecked against the official iOS26.15.1
  simulator frameworks. The check uses the released binary SDK to avoid building
  every Swift SDK source module. The NativeScript fixture uses those same
  frameworks plus the product Swift source; it is separate from consumer SPM
  resolution. No real card or valid payment credentials are supplied.
- The first native app fixture build failed before any runtime assertions. A
  focused incremental diagnostic identified Swift4 optional-flattening semantics
  in the app build, unlike the original standalone Swift5 check. The bridge now
  separates JSON parsing and dictionary casting and uses explicit optional
  bindings. The maintained check covers both Swift4 and Swift5 language modes.
  The corrected iOS26.2 fixture passed ten assertions covering initialization,
  guest preparation, duplicate presentation/reset guards, actual SDK failure on
  invalid fixture credentials, presenter release, disposal and unrelated URL
  rejection. The task-owned simulator was shut down after the run. Consumer SPM
  resolution is still unverified.

A successful real test-mode payment, cancellation/retry with a loaded Intent,
authentication redirects and wallet merchant setup remain unverified pending an
app-owned test backend. No live charge or public package publication is part of
this task. Android qualification is explicitly deferred by the user. Native
macOS/GTK/Windows are unavailable, so no device tests run there.

## Probe diagnostics

The existing probe process helper selects stderr when nonempty and otherwise
stdout; NativeScript prints the detailed Swift compiler errors on stdout and a
short build failure on stderr. The resulting probe report concealed the actual
compile error. A task-owned Turbo diagnostic captured both streams from the
cached fixture build. No shared probe code or remote tracked work was changed. Silo observations
770e4dbe-a09d-4f2e-baca-d2a393524f2a and
0ad8fe6f-4356-4c95-8cec-d11aa3cae21c preserve these expectations and evidence.
