# Return after sign-in and replace account-owned screens

ID: authentication-routing
Targets: web, ios, android, macos
Related APIs: router.navigateUrl, router.replace, routingContext, beforeLoad, redirect, RouteOutlet

## Starting point

A configured canonical router. The application owns sign-in, its current
account and services; the router prepares destinations using that context.

## Requirements

Return to a requested application URL after sign-in, preserve typed route
inputs and keep account-owned prepared data within its owner lifetime. Client
guards remain separate from server authorization and application cache cleanup.

## Acceptance criteria

- AC1: The reader returns with `navigateUrl(returnUrl, { replace: true })`,
  applies origin/scheme/search policy and fresh guards, handles rejection and
  avoids an unchecked cast or a duplicate login entry.
- AC2: The reader supplies a per-attempt context snapshot, understands shallow
  service identity and asynchronous sources, and does not mutate nested account
  values underneath pending work.
- AC3: Account or permission changes replace a common keyed owner around all
  affected outlets and modals, cancel obsolete work and discard retained router
  data without implying deletion of application stores or browser URL history.
- AC4: Protected cold/warm links and browser history use guards before protected
  content is displayed; denied traversal has a bounded correction policy, and
  cancelled/expired sign-in has an explicit outcome without redirect loops.

## Documentation

- AC1: [Return after sign-in](../../../docs/app/navigation.md#return-after-sign-in)
  and the maintained router protocol test cover URL-based replacement and
  untrusted-origin/scheme rejection.
- AC2: [Return after sign-in](../../../docs/app/navigation.md#return-after-sign-in),
  root-context declarations and the synchronous snapshot regressions distinguish
  top-level snapshots from application-owned mutable services.
- AC3: [Preserve providers](../../../docs/app/navigation.md#preserve-providers-across-native-pages)
  and [return after sign-in](../../../docs/app/navigation.md#return-after-sign-in)
  explain common-owner keys and a one-shot return intent consumed by the replacement
  owner. Work started by the retiring owner can be cancelled. Maintained browser,
  NativeScript and AppKit fixtures exercise owned-data release and remounts.
- AC4: [Guard and redirect requirements](../notes/routing-contracts.md) and
  [the routing plan](../../plans/routing-api.md#17-guards-and-redirects) describe guarded browser restoration, bounded correction and direction-preserving
  retry. Canonical native dismissal prepares its presenter; history redirects can
  replace another stack or open a modal above the admitted source. iOS Frame
  leading-edge Back prepares after release; see [gesture qualification](../navigation-checks.md#qualify-ios-frame-edge-back).
  Native routed modals disable direct SDK cancellation and use canonical dismissal
  or claimed Android Back. Interactive dismissal is outside that supported subset.
  The shared [controlled sign-in example](../../../packages/ui/tests/authentication-routing-example.web.tsrx)
  has four Octane DOM/jsdom tests and [20 production Chromium checks](../navigation-checks.md#account-changes-and-sign-in-returns).
  They cover cold/warm links, Back/Forward after account change/expiry, late SDK
  results after modal cancellation, modal success, return handoff, malformed
  returns and private-data release/revalidation. The browser command mounts an
  explicit instance and controls its SDK promises. The renderer-neutral
  [native example](../../../packages/ui/tests/authentication-native-example.tsrx)
  runs the same owner policy on actual iOS/Android Frame/modal hosts and AppKit
  retained views/panels: 18 auth assertions, including an uncancellable old-owner
  loader, modal cancellation/success and private-view release. The full fixtures
  pass 267 iOS, 264 Android and 243 AppKit checks; 79 native object-driver tests
  include this protocol. Native auth URL requests occur inside running apps.
  Generated client cold startup and OS URL delivery have separate evidence;
  their combination with real providers, OS auth dialogs, physical input and
  assistive technology remains unqualified.
