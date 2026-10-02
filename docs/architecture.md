# How an Xplat app fits together

> Keep product code shared, and put platform-specific work at the edges.

## Keep the app coherent

Share the app's data, actions, and ordinary screens. Tailor a layout or control
when it improves the experience on a particular platform. For example, a trip
packing flow can stay shared while a platform-specific component supplies an
OS control. [File variants](module-resolution.md) keep that choice behind one
import. Check [target support](spec.md#choose-your-targets) before assuming a
shared component is implemented everywhere.

Octane provides React-style components and compiles their UI. NativeScript
supplies native views and API access on iOS/Android. You usually work through
Xplat components and services; the layers below explain where a new feature
belongs when your agent needs to go beyond them.

## The three layers

An app normally has these layers:

```text
screens and features
        ↓
shared UI components and services
        ↓
web or native platform leaves
```

Your screens should talk to `@octane-xplat/ui` and
`@octane-xplat/platform`. They should not talk directly to a DOM element or a
NativeScript view.

The UI package's common root exports live in `index.shared.ts`. Platform
entries select implementations while preserving the same public names and
types. `KeyboardAvoiding` is exported from every root entry: iOS and Android
adjust around the software keyboard, while web, Linux, macOS, and Windows keep
a neutral column wrapper.

## Shared code and platform code

Start from the job an app needs, not the name of an OS widget. A common
concept can have a useful shared intersection even when the platform widgets
that implement its richer forms are different. Keep the shared contract only
as broad as every target can honor: same props and actions must mean the same
observable behavior, and each class must meet its stated pixel-parity claim.
A shared baseline and platform-authentic variants can coexist.

Choose how to deliver the shared contract, or keep the richer widget
platform-authentic:

| Approach           | Use it when                                                                                                                            | Examples                                                  |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Self-drawn         | The framework can own the visuals and behavior on every target.                                                                        | `Switch`, `Slider`, `ActivityIndicator`, `Tabs`, `Drawer` |
| Chrome-reset       | A host control supplies behavior that would be costly to replace, and its chrome can be removed.                                       | `TextInput`, `TextArea`                                   |
| Hosted             | An OS or engine supplies interior content while the framework owns the frame or draws shared chrome.                                   | `WebView`, `Video`, `CameraView`                          |
| Platform-authentic | The OS surface or behavior is the point, so normalizing it would change the contract. Keep it in a platform subpath under its OS name. | `UITableView`, `RecyclerView`, `UIModal`, `LiquidGlass`   |

### When a wrapper may pass through

A shared wrapper may omit a platform-specific enhancement when passing its
children through is still useful and the omission is predictable. Check:

- **Frequency:** a common pattern used throughout an app is a stronger reason
  to share than a rare, one-off wrapper. Frequency is a factor, not a cutoff.
- **Children:** wrapping caller-provided JSX can remove platform branches from
  shared screens. Having children alone is not enough.
- **Residual value:** after the enhancement is absent, the wrapper must still
  provide useful structure or layout. If its main purpose disappears, keep it
  platform-specific.
- **Predictability:** developers should expect the omitted enhancement on that
  target, and the pass-through should preserve the wrapper's shared contract,
  including children and applicable layout or styling props.

For example, a keyboard-avoidance wrapper can remain useful as a shared layout
boundary on a target without a software keyboard. A `WebView` cannot pass
through meaningfully when its web content surface is unavailable. Document a
pass-through as intentional behavior; do not silently drop shared props.

Use these checks when shaping a new primitive:

1. Define the common task and its smallest useful props, events, and state
   before choosing a host widget. Commonness is a reason to look for an
   intersection, not permission to promise behavior some targets lack.
2. Separate that baseline from richer platform capabilities. A shared API
   must not silently ignore a prop or substitute a different gesture or
   presentation on one target. Keep platform extensions available under
   explicit subpaths.
3. Put unavoidable translation in platform leaves. Keep platform conditionals
   and native names out of shared component logic; make the import path or
   file suffix show where a developer crosses the boundary.
4. Size the escape hatch to the divergence: a small platform detail can use
   an explicit prop bag, implementation differences belong in separate
   leaves, and a genuinely different widget belongs in a platform subpath.
   Avoid inert shared props and whole-file forks for a one-prop difference.
5. Give silent-failure cases a mechanical guard, such as a lint rule, named
   error, or structural check.
6. Verify the claim on each target. For visuals, compare bounds and selected
   resolved styles in a controlled stage; for behavior, assert the same
   events and state transitions. Record whether evidence is source-read or
   device-verified.

Lists show why the shared contract and host widget must be considered
separately. A small, unvirtualized list is a common shared job: `ScrollView`
plus `items.map(...)` gives it ordered rows and ordinary scrolling. The shared
`VirtualList` adds bounded vertical windowing and measured-height anchoring;
off-window rows unmount rather than recycle. Native cell recycling remains in
`UITableView` and `RecyclerView` under the platform subpaths. A shared API
must name the behavior it actually provides and must not imply native cell
reuse.

### Normalization classes

Components are classified by the visuals they own; platform-authentic
components live in platform subpaths rather than the shared contract. The class says what the
parity claim covers — divergence inside a claim is a bug, divergence outside
it is the design:

| Class                | Interior                 | Chrome        | Parity claim                        | Examples                                              |
| -------------------- | ------------------------ | ------------- | ----------------------------------- | ----------------------------------------------------- |
| `self-drawn`         | us                       | all ours      | every pixel                         | `Switch`, `Tabs`, `SegmentedControl`, `ListItem`      |
| `chrome-reset`       | the OS widget's behavior | stripped      | every pixel                         | `TextInput`, `TextArea`, `SearchInput`                |
| `hosted`             | an OS/engine surface     | ours, or none | the frame + whatever chrome we draw | `Video`, `CameraView` (chrome ours); `WebView` (none) |
| `platform-authentic` | the OS                   | the OS        | none — OS chrome is the point       | `UISwitch`, `MaterialDialog`, the subpath catalogs    |

The class matters when you read [known limits](known-limits.md): a
`different` row against a `hosted` component's interior pixels is expected,
not a bug. How a component earns its class — and how the same idiom can ship
twice as two separate components — is framework-authoring policy in the
[architecture notes](architecture-notes.md#normalization-classes-how-a-shared-component-gets-classified).

Split a component when the platform needs a different implementation:

```text
ShareButton.tsrx          native default
ShareButton.web.tsrx      browser implementation
ShareButton.mobile.tsrx   shared iOS and Android implementation
```

The filename tells the build which implementation to use. The screen that
imports `ShareButton` does not need an `if (ios)` branch.

## What belongs in a screen

Screens own product decisions: what to show, what to save, and where to go
next. They can use shared state, UI components, and platform service
interfaces.

They should not contain:

- DOM globals such as `window` or `document`.
- Native view names such as `gridlayout` or `page`.
- Two copies of the same platform decision.

If a screen needs one of those things, put the platform detail behind a shared
component or service instead.

## Shared state

Keep shared state in a `.ts` module using Octane signals
(`octane/signals`). [Fetching data](data.md) is the full guide; the summary:

For example, a module-level `packedCount$ = signal$(0)` can be read by a
header and a sheet. Both read the same value; neither needs a context provider.

A component that reads `packedCount$.get()` in render subscribes automatically —
on web _and_ on native. There is no platform leaf, no subscription hook, and
no compiler flag. Name shared signals with a `$` suffix so the compiler
preserves the reads through caches and props, and make sure the module imports
`octane/signals` at runtime. Use `import 'octane/signals'` in a consuming
module that otherwise only calls `.get()`.

Reads of async queries suspend: render them under `@try`/`@pending`/`@catch`.
On native, a committed `@try` boundary must not suspend again — queries are
stale-while-revalidate, so only suspend before first data.

Two exceptions:

- **Non-signal module state** (plain stores, mutable objects) does not
  subscribe on native. Wrap those reads in `useStore(store)` per reading
  component — the universal renderer retains unchanged-prop children, so a
  bare read in a child goes stale. (Decision #27.)
- **Reads outside render** (module init, event handlers) never subscribe —
  same as web. Write with `.set()` and read imperatively there.

For the compiler boundaries, file rules, and the full layer map, see the
[architecture notes](architecture-notes.md).
