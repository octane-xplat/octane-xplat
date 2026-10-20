ID: route-transitions
Targets: web, ios, android, macos, linux, windows
Related APIs: router, defineTransitions, defineWebTransition, defineNativeTransition, defineAppKitTransition, TransitionDefinition, RouteTransitionResult

# Animate route changes

## Starting point

An app with generated routing contracts, a mounted route outlet and two routes.
Animation is an optional visual effect around navigation; it does not decide
presentation, authorization, history, or server rendering.

## Requirements

Request a built-in or registered typed transition name, supply platform leaves,
and distinguish navigation commitment from animation completion.

## Acceptance criteria

- AC1: The reader can request a preset and inspect navigation and animation results separately.
- AC2: A configured transition export generates finite typed names and installs its implementations without handwritten augmentation.
- AC3: Browser effects surround the actual DOM commit after guards/loaders. Reduced motion, unavailable APIs and unsupported custom types preserve successful navigation with an explicit skipped result.
- AC4: Forward, Back, overlap, modal backgrounds and disposal preserve routing ownership. A stale deferred browser callback cannot commit an obsolete destination.
- AC5: The same shared name resolves through platform leaves. Native custom effects use the host's transition engine, with supported page/modal/pane subsets and unsupported-target fallbacks explicit.

## Documentation

- AC1: [Animate browser navigation](../../../docs/app/navigation.md#animate-browser-navigation) distinguishes navigation and animation results.
- AC2: [Animate browser navigation](../../../docs/app/navigation.md#animate-browser-navigation) shows registration, generated names and platform leaves.
- AC3: [Animate browser navigation](../../../docs/app/navigation.md#animate-browser-navigation) and [qualification commands](../navigation-checks.md) cover browser timing and fallbacks.
- AC4: [Maintained checks](../navigation-checks.md) cover callback timing, overlap and stale updates; the production browser fixture covers forward/Back and retained modal routing. Gap: NativeScript rendered-pane effects, native custom modal-surface motion and native GTK executor lifecycle remain incomplete.
- AC5: [Animate browser navigation](../../../docs/app/navigation.md#animate-browser-navigation) shows identical keys and explicit skipped leaves. The native page adapter and its explicit modal/pane subset are documented in [Animate native pages](../../../docs/app/navigation.md#animate-native-pages). Frame execution and reversal passed iOS/Android release checks. [Animate AppKit panes](../../../docs/app/navigation.md#animate-appkit-panes) documents typed incoming-wrapper motion, direction and restoration; its 202-check native routing run covers intermediate values and lifecycle. Native GTK and native modal-surface custom effects remain unfinished.

## Audit storage limitation

The shared `recipe_audit` table currently accepts only `web`, `ios`, `android`
and `macos`, while recipes also support Linux and Windows. Its CLI cannot alter
existing check constraints. Keep those target names accurate: Linux has source
checks and a 14-check WebKitGTK navigation/pane baseline, but custom CSS
transition execution on that host is not yet qualified. Windows has source/type
checks and no runtime VM. These limits do not establish native GTK transitions
or Windows behavior, and must not be recorded as another platform's runtime pass.
