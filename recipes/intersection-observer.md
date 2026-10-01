# Track view visibility while scrolling

ID: intersection-observer
Targets: web, ios, android, macos
Related APIs: @octane-xplat/intersection-observer, IntersectionObserver, useIntersectionObserver, IntersectionObserverInit, supported

## Starting point

A working Octane xplat app with a target view and, when observing scroll content,
its scrolling container available in the shared component. The reader knows
basic `.tsrx` component syntax.

## Requirements

- Observe a target against the viewport or an explicit root.
- React to visibility and threshold changes and release observation when the
  target is no longer needed.
- Keep platform limits visible to callers.

## Acceptance criteria

- AC1: On web, iOS, and Android, a shared component can bind a target and
  optional root, then read the latest entry and `isIntersecting` as the target
  crosses the configured threshold.
- AC2: On web, iOS, and Android, an imperative observer can observe and
  unobserve targets, deliver entries for configured `rootMargin` and
  `threshold` values, and disconnect all targets.
- AC3: Callers can check `supported`; it is `true` on web, iOS, and Android
  and `false` on macOS and non-DOM web hosts, which do not deliver entries.

## Documentation

- AC1: [Hook usage and root binding](../packages/intersection-observer/README.md#hook)
  and the maintained
  [scroll probe](../examples/probes/intersection-observer.tsrx).
- AC2: [Imperative API](../packages/intersection-observer/README.md#imperative)
  and [native behavior notes](../packages/intersection-observer/README.md#native-behavior-notes).
- AC3: [Platform support](../packages/intersection-observer/README.md#platform-support).
