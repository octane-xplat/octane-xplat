# Give a routed modal its own history

ID: route-modals
Targets: web, ios, android, macos
Related APIs: router.push, router.back, router.dismiss, useRouter, RouteOutlet, useNavigationBlocker

## Starting point

Generated route contracts and a mounted route outlet in an application window.

## Requirements

Present a shareable route modally, navigate inside its own flow, return to its
presenter and preserve its declaring providers and admitted state.

## Acceptance criteria

- AC1: The reader distinguishes presentation from transition, uses the typed
  request and the `+modal` file default, and handles skipped effects separately.
- AC2: Back within a native/AppKit modal traverses its retained entries; first-step
  Back returns `at-base` and dismiss closes the flow. Browser document history
  has an explicit linear subset. Nested dismissal retains its presenter.
- AC3: Guards and entry-owned confirmation run before canonical dismissal;
  passive native surface paths have explicit policies. Raw host closure and
  owner teardown clean up the modal family rather than promising an exit veto.
- AC4: Declaring providers and presenter state survive presentation/dismissal;
  retained data and owned modal roots are released with their owner. AppKit's
  in-window surface, transition subset and runtime/input limits are explicit.
- AC5: Browser modals expose dialog semantics, isolate background focus, retain
  a focus owner across screens and restore their opener or remaining parent
  modal. Tab is contained and Escape requests guarded dismissal. Stable DOM IDs
  support opener replacement; keyboard/DOM evidence is distinct from assistive
  technology input and native focus policy.

## Documentation

- AC1: [Present a route modally](../../../docs/app/navigation.md#present-a-route-modally) shows presentation defaults and separate animation results.
- AC2: [Present a route modally](../../../docs/app/navigation.md#present-a-route-modally) explains modal Back, dismissal, nesting and the browser subset.
- AC3: [Confirmation](../../../docs/app/navigation.md#confirm-before-leaving-unsaved-edits) and [guarded modal checks](../navigation-checks.md#keep-native-modal-dismissal-guarded) distinguish admission from raw closure.
- AC4: [Preserve providers](../../../docs/app/navigation.md#preserve-providers-across-native-pages) and [AppKit qualification](../navigation-checks.md#appkit-routed-modals-in-an-attached-window) describe ownership and target limits.
- AC5: [Present a route modally](../../../docs/app/navigation.md#present-a-route-modally) explains dialog naming and focus; [browser modal focus](../navigation-checks.md#browser-routed-modal-focus) records keyboard and DOM qualification.
- Maintained platform fixtures and [navigation checks](../navigation-checks.md)
  keep runtime qualification separate from documentation coverage.
