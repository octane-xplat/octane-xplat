# AppKit verification scope

Absolute and grid panel placement has a maintained nonvisual AppKit regression.
It checks a 268×773pt panel with full-width rows and a 693pt growing scroll view,
then repeats solver passes and resizes without shrinking or repositioning the
host window. This qualifies the fixture's geometry on Apple Silicon macOS;
it does not establish OS input, visual parity, or every grid configuration.
Run the focused check from the repository root:

```sh
pnpm --filter @xplat/macos test:layout-placement
```

## Packed consumers and overlays

`@octane-xplat/macos-renderer` has independent packed-consumer coverage for
system fonts, rendering updates, and the CLI's AppKit packaging contract. This
coverage does not establish OS input delivery or general UI-package parity.

The packed renderer's `Dock.macos.tsx` fixture checks CSS absolute edge
placement, percentages, resizing, keyed identity, and subtree cleanup. Its
siblings share the containing block; they do not consume space sequentially
like the removed native DockLayout. The fill view pins all four edges
explicitly. This fixture must not be reported as sequential docking coverage.

```sh
pnpm exec turbo run test:packed --filter=@octane-xplat/macos-renderer
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
pnpm exec turbo run test:macos-exports --filter=@octane-xplat/ui --concurrency=1
pnpm exec turbo run test:macos --filter=@octane-xplat/ui --concurrency=1
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
(`pnpm --filter @xplat/macos test:overlays`); that qualifies handler dispatch,
not physical OS input. See the
[renderer setup and verification boundary](../../packages/macos-renderer/README.md).

The broader `@octane-xplat/ui` native suite is green: the universal entries
export `Children` again, and the focused imperative-sheet service tests pass
alongside the rest of the mobile and macOS cases.
