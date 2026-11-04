# AppKit verification scope

Absolute and grid panel placement has a maintained nonvisual AppKit regression.
It checks a 268×773pt panel with full-width rows and a 693pt growing scroll view,
then repeats solver passes and resizes without shrinking or repositioning the
host window. This qualifies the fixture's geometry on Apple Silicon macOS;
it does not establish OS input, visual parity, or every grid configuration.
Run the focused check from the repository root:

```sh
bun run --filter @xplat/macos test:layout-placement
```

## Packed consumers and overlays

`@octane-xplat/macos-appkit` has independent packed-consumer coverage for
system fonts, rendering updates, and the CLI's AppKit packaging contract. This
coverage does not establish OS input delivery or general UI-package parity.

The packed `Paint.macos.tsx`/`paint-lifecycle.ts` fixture checks percentage and
point translations after native layout, percentage radii, per-corner/banded
border hosts, outset/inset shadow layers, layered image/gradient backgrounds,
outline bounds expansion after resize, projection radius compensation, style
removal and retirement. Repeated updates retain one layer host per feature;
posting a native frame notification after retirement cannot recreate paint.
These are native geometry and resource-lifetime assertions, not visual parity.
Observer acquisition/reentry/failing-release balances use the production
coordinator with native-boundary stand-ins; this is not a global native observer
inventory or whole-process leak-freedom check.

The packed action-ownership fixture checks real button tag/handler replacement,
native-disabled controls, a programmatically delivered native click selector,
text submission/readonly suppression, AX-only semantic views, AX press and
increment/decrement, readonly/disabled adjustment suppression, distinct native
custom actions for same-named folded links, and held callbacks after retirement.
The host exposes overridden AX getter properties as JS methods; the fixture
invokes callable getters with their receiver. Its span and adjustment props use
the existing private transport used by UI wrappers, not a new public JSX API.
Shared-view replacement, old-recognizer suppression, release failures and IME
coordination use production constructors with native-boundary stand-ins.
These checks establish programmatic native dispatch and lifetime behavior, not
physical input, an IME journey, VoiceOver or whole-process leak freedom. Native
AX custom-action objects remain process-retained for the documented bridge
finalizer workaround while their retired JS feature closures are cleared.

The packed root-directory fixture checks native main, retained-tab and
list-template roots, compiler tab portals, an external portal target, popup and
window-layer roots. It asserts inherited Menlo fonts, immediate visits to live
hosts, duplicate-host rejection, newest-debug-root fallback, host reuse and
retirement. A setup failure is injected through the host boundary in the real
runtime; this is not a failing OS-release test. Retained-root HMR separately
checks debug identity and old-root retirement after host reuse. Process observer
installation counts and failing observation cleanup use production constructors
with native-boundary stand-ins, not a native observer inventory.

```sh
bun run turbo run test:packed --filter=@octane-xplat/macos-appkit
```

The packed renderer's `Dock.macos.tsx` fixture checks CSS absolute edge
placement, percentages, resizing, keyed identity, and subtree cleanup. Its
siblings share the containing block; they do not consume space sequentially
like the removed native DockLayout. The fill view pins all four edges
explicitly. This fixture must not be reported as sequential docking coverage.

```sh
bun run turbo run test:packed --filter=@octane-xplat/macos-appkit
```

AppKit layout uses points for numeric lengths, native measurements, and CSS
grid tracks. Keep Mason's CSS parsing scale at 1; a Retina backing scale
would otherwise double only the track lengths. The packed wrap fixture checks
80-point columns and 30-point rows, including resize and style removal.
Logical proxies forward CSS placement before ancestor layout runs; child-authored
styles take precedence, and reparenting restores the child's own style.
Mason frame notifications recompute placement without invalidating intrinsic
size. Content mutations still invalidate it. This prevents an AppKit constraint
feedback loop that grew the tab fixture's window to 44,793 points; the packed
tab regression checks that reorder retains the host window's height.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
export function FixedCells() {
	return <masonview style={{ display: 'grid', gridTemplateColumns: '80px 80px', gridAutoRows: '30px' }}>
		<label text="One" />
		<proxyviewcontainer style={{ gridColumn: '2' }}>
			<label text="Two" />
		</proxyviewcontainer>
	</masonview>
}
```

Shared AppKit dialogs, alert dialogs, bottom sheets, lightboxes, and toast
stacks have dedicated presentation and cleanup. The renderer's 88 native-state
tests pass, and the bounded packed overlay consumer typechecks JSX and
imperative declarations in Bundler and NodeNext modes. Those checks cover
source, handler dispatch, and declarations; they do not establish physical OS
input or VoiceOver behavior. Lightbox video playback, double-click zoom, and
touch swipe navigation remain unavailable on macOS; see
[shared presentations](../../docs/app/primitives.md#macos-shared-presentations).

The normal UI AppKit packed check builds the full macOS barrel and compares
runtime values with declarations in Bundler and NodeNext modes. The focused
export audit also compares the source barrel's explicit values with the
emitted declaration surface and bundles the AppKit `Theme` leaf independently.
These are source and build checks; they do not establish physical OS input or
nested-theme color parity.

```sh
bun run turbo run test:macos-exports --filter=@octane-xplat/ui --concurrency=1
bun run turbo run test:macos --filter=@octane-xplat/ui --concurrency=1
```

Patched Octane 0.14.0 rejects JSX inside data-returning hooks with
`unsupported module declaration requires universal plan lowering`. The five
table hooks for numbering, expansion, grouping, status and trees keep their
JSX in named components and return `tableSlot` descriptors, which the Table
leaves render through `TableSlot`. The AppKit barrel build passes with this
workaround; the maintained
`tests/table-universal.test.mjs` checks all five hooks with HMR on and off.
The packed consumer also uses the current `Table data` and column-level
`renderCell` contract. These are compiler, build and declaration checks.
Remove the authoring restriction only after an Octane upgrade passes equivalent
nested-JSX probes. The [routing contract notes](notes/routing-contract.md)
record the related Octane 0.11.0 limitation.

The isolated AppKit overlay fixture previously passed its overlay assertions
(`bun run --filter @xplat/macos test:overlays`); that qualifies handler dispatch,
not physical OS input. See the
[renderer setup and verification boundary](../../docs/packages/package-macos-appkit.md).

The broader `@octane-xplat/ui` native suite is green: the universal entries
export `Children` again, and the focused imperative-sheet service tests pass
alongside the rest of the mobile and macOS cases.
