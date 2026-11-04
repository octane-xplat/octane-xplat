# AppKit renderer internals

Use this map when changing `packages/macos-appkit`. The public entry is
[`src/index.ts`](../../packages/macos-appkit/src/index.ts); its declaration
contract remains in `src/index.d.ts`.

## Find the owner

Paths below are relative to `packages/macos-appkit/src/`.

| Responsibility | Modules |
| --- | --- |
| Composition and host adapters | `runtime.ts`, `host-bridge.ts` |
| Node contracts, element capabilities and identities | `model.ts`, `registry.ts` |
| Construction, batches and roots | `nodes.ts`, `driver.ts`, `roots.ts` |
| Attachment, projection and layout | `tree.ts`, `projection.ts`, `layout.ts` |
| CSS matching, state and environment | `css-cascade.ts`, `css-animations.ts`, `css-pseudo-state.ts`, `style-environment.ts` |
| Stateless style reads and normalization | `style-values.ts` |
| Native styling and painting | `native-style.ts`, `pointer-style.ts`, `native-colors.ts`, `outlines.ts`, `background-paint.ts`, `border-paint.ts`, `shadow-paint.ts`, `transform-paint.ts` |
| Element creation, props and disposal | `container-elements.ts`, `controls.ts`, `picker-elements.ts`, `input-elements.ts`, `text-elements.ts`, `image-elements.ts`, `hosted-elements.ts` |
| Generic prop merging and removal | `element-props.ts` |
| Actions, subscriptions and accessibility | `actions.ts`, `subscriptions.ts`, `hover.ts`, `accessible-host.ts`, `accessibility.ts` |
| Native surfaces | `popover.ts`, `context-menu.ts`, `picker-bridge.ts`, `sheet-bridge.ts`; existing `presentation.ts` and `layer.ts` own their surface engines |
| Inspection and measurement | `automation.ts`, `measurements.ts`, `parity.ts` |

## Keep lifecycle and initialization explicit

Each subsystem factory owns its retained maps, observers, native classes and
cleanup. Put a builtin element's factory, native prop handler and disposal in
its element module. `nodes.ts` coordinates construction and teardown order;
`element-props.ts` merges the next prop bag, applies common fields and dispatches
individual native props. Keep synchronization that reads several props after
the whole bag has been merged.

The registry owns element support and containment queries as well as identity
maps. It has no service dependencies and is constructed first. Node creation,
batch validation and projection consult that same registry, including live
plugin registrations; metadata queries must not depend on node construction.

Import stateless style queries from `style-values.ts` directly. Reading computed
styles, class membership or collapsed state must not require the native style
writer, the CSS cascade or the diagnostics service. Stateful services retain
their own maps, timers and native resources.

Cross-subsystem contracts import named result types and use `Pick` to name the
required operations or state. `runtime.ts` passes already-constructed services
directly and uses getters for forward references. Read a forward dependency at
operation time, not during construction. These remaining cycles coordinate
style application, tree mutation and element lifecycle; moving a pure query
out of them is preferable to adding another lazy dependency. Mutations such as
allocating an action ID reach the owner's live state; copying a counter into
a dependency object would lose that connection.

Construct all services before installing compatibility, Mason, tab content and
host bridges. Native classes must be registered before Mason subclasses the
accessible host. Preserve per-process services and per-root state when moving
code; a module split must not create a second renderer registry or timer.

## Verify a change

The Node suite includes direct factory tests and older VM fixtures. The legacy
adapter in `test/renderer-source.ts` reads declarations from their production
modules; it carries no copied implementation. New tests should exercise the
factory interface with explicit adapters, as `test/root-ownership.test.ts` does.
VM fixtures establish branch behavior, not native input or drawing.

```sh
bun run turbo run test --filter=@octane-xplat/macos-appkit
bun run turbo run typecheck --filter=...@octane-xplat/macos-appkit
bun run turbo run test:packed --filter=@octane-xplat/macos-appkit
```

The packed consumer covers real AppKit lifecycle and retained-root HMR. Follow
[AppKit verification](appkit-verification.md) for its limits and host setup;
reserve build resources before running it. Internal file moves preserve the
package exports and do not introduce a public recipe or API.
