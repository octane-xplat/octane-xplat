# Show loading and recovery during navigation

ID: navigation-feedback
Targets: web, ios, android, macos
Related APIs: useNavigation, useRouterState, RouterNavigationState, NavigationFailure, NavigationDestinationSnapshot, router.retry, router.clearFailure, RouterProvider, RouteOutlet

## Starting point

A configured canonical router and a mounted route outlet. The reader can open
a route and wants to show progress or recover when that attempt fails.

## Requirements

Show feedback for the rendering flow while keeping its committed screen and
URL intact. Recover through explicit retry or dismissal rather than optional
loading/error props on a screen that never committed.

## Acceptance criteria

- AC1: The reader can show pending feedback for one flow, including cold CSR entry, while the committed screen stays visible. Feedback remains separate from transition completion and another flow's work.
- AC2: The reader distinguishes missing patterns/resources/platform screens, forbidden access, invalid input and unexpected preparation/commit failures, and places recovery UI where it remains visible without exposing private error objects.
- AC3: Retry repeats captured inputs through current guards and definitions; a successful commit or explicit clearing removes failure feedback. Clearing does not cancel new work, cancellation is not an error, and stale completions cannot overwrite a newer outcome or add an extra cold-entry history item.
- AC4: Shared status and Back UI can inherit a custom provider without claiming its DTO types. Typed state/match/navigator/accessor reads require the matching explicit instance, and outlet-owner teardown clears obsolete feedback while instance disposal remains creator-owned.

## Documentation

- AC1: [Handle pending work and failures](../../../docs/app/navigation.md#handle-pending-work-and-failures) and the maintained production [browser fixture](../../../apps/web/tests/fixtures/routing-contract/fixture.web.tsrx).
- AC2: [Handle pending work and failures](../../../docs/app/navigation.md#handle-pending-work-and-failures) explains result kinds, feedback placement, local errors and render-boundary reset.
- AC3: [Handle pending work and failures](../../../docs/app/navigation.md#handle-pending-work-and-failures), [router protocol tests](../../../packages/ui/src/router-instance.test.ts), and [release checks](../navigation-checks.md).
- AC4: [Bind a custom router to rendering](../../../docs/app/navigation.md#bind-a-custom-router-to-rendering), [provider ownership](../../../docs/app/navigation.md#preserve-providers-across-native-pages), and shared [renderer cases](../../../packages/ui/tests/router-scope-cases.tsrx).
