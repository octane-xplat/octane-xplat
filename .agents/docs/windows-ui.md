# Qualify Windows UI controls

Use the [Windows setup guide](../../docs/platform/windows-setup.md) and
[host runbook](windows-test-host.md) to prepare the experimental target. Component
dispositions, blockers, run histories, and inventories belong in Silo and local
files; keep this page focused on how to assess a control.

## Qualify a control

Inspect `windows_checks` before selecting work. An implemented declaration or a
reused native default is not full behavior, accessibility, layout, or production
qualification. Platform-authentic phone subpaths need a separate Windows scope.

```sh
silo table show windows_checks
silo sql "SELECT key, title, status, source_revision, evidence FROM windows_checks ORDER BY key"
```

For the core20 plan, use the exact final component gates. The broader
`scenario:windows-os-*` prefix also contains older bounded OS scenarios;
their passes do not establish this plan's fresh-main component qualification.

```sh
silo query windows-core20-final-gates
```

Choose a bounded user flow, retain the exact source and packaged artifact, and
exercise actual OS input when that is the behavior being claimed. Keep handler
dispatch, native automation, keyboard/pointer input, geometry, Narrator, and
visual comparison as distinct evidence. A passing prerequisite does not qualify
every dependent control.

The pinned Windows Core's [accessibility updater](https://github.com/NativeScript/NativeScript/blob/abae298cee169ccd6dbd741d8c8ecc2e3d9dc13b/packages/core/application/application.windows.ts#L404)
is an empty upstream stub; Xplat's local patch adds only `SetName`. Generic role
or state metadata does not supply a List, Table or Tab peer and its patterns.
Choose genuine native peers and inspect their actual UIA structure.

Check shared ownership seams before making per-control workarounds: pointer
subscriptions/capture, focus and keyboard routing, controlled rollback, layout
and percentage sizing, text hosting, locale formatting, and modal cleanup. Keep
upstream repair scope and removal conditions in the
[owning repair notes](parity/windows-support-progress.md).

Use `windows_recipe_checks` for per-criterion documentation and execution
assessments; do not relabel Windows evidence as a mobile or AppKit target.

## Position measured input peers

Pin the Windows Pressable's absolute input peer at `left: 0` and `top: 0`.
Measured width and height alone leave its origin at the padded content's static
position. Retain the drawing/peer frame checks for padded controls such as
ClickableCard and Banner dismissal, separately from their activation checks.

## List row input prerequisite

This candidate still requires packaged OS/UIA qualification. The Windows `ListItem` leaf routes
interactive rows through the existing
measured Pressable peer, without a second root tap handler. It hosts primitive
leading, label, description, child and trailing content through TextSlot,
including numeric zero. The shared props remain unchanged:

```tsx
import { List, ListItem } from '@octane-xplat/ui'

export function MessageRows() {
	return <List>
		<ListItem label="Inbox" onPress={() => console.log('Opened')} />
		<ListItem label={0} description="Unread" />
	</List>
}
```

Windows List row content uses a column with stretched children. Keep this
wrapper direction explicit: a horizontal wrapper can retain an intrinsic-width
ListItem inside a wider row, so its input peer never fills or tracks the row.
The maintained resize check must still compare actual peer and drawing bounds.

Compiled-leaf contracts exercise the source behavior; the maintained
[`collections` input mode](../../tools/windows-qualification/README.md#inspect-the-collections-source-fixture)
checks real input separately. A native Button or
Hyperlink peer is only the row's input prerequisite: List/ListItem structural
roles, slot geometry, resize, OS activation, delegation, nested controls,
navigation and the wider props matrix remain unqualified. Keep both final
component gates pending until the complete plan criteria pass.

## Table header input prerequisite

The Windows sortable-header source candidate uses the existing measured
Pressable peer in place of the native default's raw tap handler. It preserves
the controlled single-column sort cycle and names the peer from the current
header and sort direction. Primitive header text, including zero, receives a
text host. Current sort state is passed as header props so an unchanged column
still rerenders after controlled updates; the ref retains live callback policy.
Public props and plugin composition stay the same:

```tsx
import { Table, useTableSortable, useTableSortableState } from '@octane-xplat/ui'

export function SortedRows() {
	const state = useTableSortableState({ data: [{ name: 'Inbox' }, { name: 'Archive' }] })
	const sortable = useTableSortable(state.sortConfig)
	return <Table data={state.sortedData}
		columns={[{ key: 'name', header: 'Name', sortable: true }]}
		plugins={{ sortable }} />
}
```

Compiled contracts do not qualify this native input candidate. Inspect the maintained `table` scene
before choosing native Table/header/row/cell peers; the header Button does not
supply those structural roles. The source fixture includes controlled rejection
and a many-row case without a substitute scrolling implementation. OS input,
geometry, scrolling, remount and current-main checks remain required. Shift
multi-sort, header context menus and the wider plugin matrix are not added by
this prerequisite. Keep the final Table gate pending.

The maintained `tabs` scene similarly exposes the actual TabList/Tab composition,
controlled acceptance/rejection, disabled stops and matching panel content. The
fixture alone does not establish TabItem/SelectionItem, a single Tab stop or arrow
navigation. Use the [driver guide](../../tools/windows-qualification/README.md#inspect-table-and-tab-source-fixtures)
to select these scenes and retain their native/UIA failures.

## Anchored layers and menu inspection

Use the maintained `selector`, `dropdown-menu` and `layer` scenes to inspect the
actual public paths. These private fixtures declare the Screen owner required
for their RootLayout presentation. The other scenes retain their original
VStack props and child markup. Select one through the recorded command channel:

```json
{ "sequence": "layer-inspection-1", "action": "scene", "value": "layer" }
```

The [driver guide](../../tools/windows-qualification/README.md#inspect-menus-and-anchored-layers)
describes controlled rejection, current-callback events, native snapshots and
mount/disabled commands. Inspect actual trigger/surface bounds and choose a
point outside the measured surface; a named outside target can be covered after
flip or resize. Keep direct useLayer anchoring/dismissal separate from Selector
and DropdownMenu qualification. These are unexecuted source fixtures, with no
new keyboard or native-role implementation and no runtime pass.

## Native tab semantics

The pinned Core preview's
[`TabView` implementation](https://github.com/NativeScript/NativeScript/blob/abae298cee169ccd6dbd741d8c8ecc2e3d9dc13b/packages/core/ui/tab-view/index.windows.ts)
constructs a Grid, StackPanel and Buttons. It does not instantiate WinUI
`TabView` or `TabViewItem`. Replacing the shared strip with that NativeScript
component therefore does not supply a stock tab-selection peer. Probe actual
WinUI tab ownership, SelectionItem and keyboard behavior before choosing a
Windows tab adapter. Source inspection alone does not qualify that adapter.

With `@nativescript/windows` 0.1.0-alpha.144, direct construction of
`Microsoft.UI.Xaml.Controls.TabView` throws `ActivateInstance failed` with
`Not implemented` in the packaged x64 host, before `initNativeView`. Do not
treat the projected class's presence as usable activation. The working
stock-engine probe returns a native Grid as the NativeScript view root,
appends an `XamlReader.Load` TabView to it, and connects selection events after
mounting:

```ts
import { Microsoft } from '@octane-xplat/platform/windows'

const root = new Microsoft.UI.Xaml.Controls.Grid()
const tabs = Microsoft.UI.Xaml.Markup.XamlReader.Load(`
<TabView xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
  IsAddTabButtonVisible="False">
  <TabViewItem Header="First" IsClosable="False" />
  <TabViewItem Header="Second" IsClosable="False" />
</TabView>`)
root.Children.Append(tabs)
// Return root from createNativeView; retain tabs for the controller.
```

That hosting path exposes native TabItem/SelectionItem peers and delivers
selection callbacks through UIA Select and mouse input. Stock Right Arrow
moves focus past disabled tabs without changing selection; the public adapter
must supply automatic selection and preserve its controlled-value contract.
The tested host lacks `__nsConstructWinRTSubclass` and `__nsWrapWinRTPointer`,
so current upstream subclass source is not proof of that binary's capability.
Look up `scenario:windows-core20-tabs-stock-peer` in Silo for the exact source,
runtime evidence and failed alternatives. This engine result does not qualify
public TabList/Tab. Recheck activation after changing the Windows runtime.

During NativeScript native setup on that binary, the tested JavaScript
`TabItems.InsertAt` and `Append` paths fail with HRESULT `0x80004005`, including
stock/minimal item templates, string/framework headers and an explicitly typed
index. Named items declared inside the loaded XAML support framework headers
without those collection calls:

```ts
const tabs = Microsoft.UI.Xaml.Markup.XamlReader.Load(`
<TabView xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
  xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
  IsAddTabButtonVisible="False">
  <TabViewItem x:Name="FirstItem" IsClosable="False" />
</TabView>`)
const first = tabs.FindName('FirstItem')
first.Header = new Microsoft.UI.Xaml.Controls.Grid()
```

The bounded named-item probe establishes genuine peers and nonempty framework
header frames with the stock item template. It does not establish a custom
template, keyboard selection, controlled rejection or structural-update
lifecycle. Keep those checks with `scenario:windows-core20-tabs-public-adapter`
in Silo. Reprobe the failed calls after a runtime change before removing a local
construction workaround; this result does not establish a general collection
defect in other call contexts.

Defer controlled rollback until the native selection event returns. In the
pinned host, a render update can occur inside a rollback write and leave the
container index and item selection flags inconsistent. Reassigning the same
index in a later task did not repair that state. Retire queued reconciliation
on unload or native-tree replacement, and check selected peers against both
the controlled value and displayed panel. The public-adapter Silo record keeps
the reproduction and runtime boundary.

## Raster images and avatar names

The pinned NativeScript Windows preview `abae298cee169ccd6dbd741d8c8ecc2e3d9dc13b`
has an empty `wgc` base64 decoder. Its synchronous `ImageSource.fromBase64Sync`
returns null in the packaged host. The Windows raster resolver preserves data
URIs for core's async WinRT loader. This repairs the default async path; explicit
synchronous decoding and synchronous placeholders remain separate gaps.

```ts
import { ImageSource } from '@nativescript/core'

const encoded = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGOQL9z6HwAEPQJFam2brwAAAABJRU5ErkJggg=='
const image = await ImageSource.fromBase64(encoded)
console.log(image.width, image.height, image.windows.PixelWidth, image.windows.PixelHeight)
```

Check model and native bitmap dimensions separately: synchronous byte sources
can retain zero `ImageSource` dimensions while native decoding is still pending.
Positive native `BitmapImage.PixelWidth`/`PixelHeight` establish decode; a named
UIA Image establishes a separate accessibility shape. Neither establishes visual
appearance or Narrator behavior. Find the controlled decoder evidence under
`windows-core20-run86/` in `local_artifacts`.

Core also applies accessibility labels to the outer Border rather than its
inner WinUI Image. The image binding names the inner peer after attachment,
removes the Border from the accessibility control view, and restores its owned
values when the binding ends. In the pinned host, starting with no source leaves
the peer's bounds empty, including after a later photo assignment. Avatar starts
with a named transparent bitmap behind its initials so the peer has a frame
from its first mount. Initials use an explicit font size
relative to the circle because the pinned native CSS path does not interpret
the shared percentage font size as the intended avatar-relative size.

```tsx
import { Avatar, Image } from '@octane-xplat/ui'

export function Person({ src, name }: { src: string; name: string }) {
  return <>
    <Avatar name={name} />
    <Image src={src} alt={name} style={{ width: 40, height: 40 }} />
  </>
}
```

Keep the workaround until the pinned core provides a working synchronous
decoder and names its actual Image peer. Review the source resolver and name
binding together when upgrading; preserve SVG's separate host path. See the
[Windows image example](../../docs/platform/windows-setup.md#avatars-and-raster-images-candidate)
for the bounded consumer surface.

## Measurement ref lifecycle

A callback ref can be cleared and rebound to the same view within one commit.
Windows `useMeasure` releases subscriptions immediately, but defers clearing
bounds until the next task. Rebinding cancels that clear and retains unchanged
bounds. Clearing them synchronously creates a null-to-bounds render loop for
inline Tab refs, starving native layout while the views still measure zero.
Unmount cancels the deferred clear; a retired null ref cannot restart it.
Preserve this lifecycle when changing native input peers or measurement refs.

## Windows type declarations and module selection

The Windows app's typecheck follows its runtime import graph: Windows/native
conditions and suffixes, with app sources as roots. Imported package sources
remain checked. Other platforms' unrelated entrypoints are checked by their
own package programs rather than added as Windows app roots. The harness
includes UI's existing driver-prop declarations explicitly when checking its
workspace source.

The pinned NativeScript Vite preview's build checker detects TSRX only from
root filenames or explicit `.tsrx` imports. An extensionless import of the
qualification component leaves it using plain TypeScript, which cannot resolve
that file. Keep the extension explicit in the qualification entry and
`noEmitOnError: true` in the app config so both checker paths stop a build on
diagnostics. Unlike registry Vite 8.0.21, this preview already supplies Windows
suffixes in both paths; it needs no local suffix patch. The installed-plugin
regression `scripts/windows-vite-typecheck.test.mjs` reproduces the extensionless
failure, checks Windows leaf selection and rejects a real type error through
each compiler. Revisit the explicit-import workaround when upstream
[`hasTsrxImports`](https://github.com/NativeScript/NativeScript/blob/abae298cee169ccd6dbd741d8c8ecc2e3d9dc13b/packages/vite/helpers/typescript-check.ts)
discovers extensionless TSRX modules. This is checker evidence, separate from
packaged runtime qualification.

The pinned Core `abae298` Windows declarations infer incompatible symbol-indexed
setter unions on `View` and its layout subclasses. The Core patch gives `View`
an `unknown` symbol index, so a `FlexboxLayout` or `StackLayout` can be passed to
`addChild` without casts. Named properties retain their declared types, and
dynamic symbol values require narrowing before use. The maintained
`scripts/windows-core-view-types.test.mjs` checks the installed declaration and
reproduces the original assignability failure when that line is removed.
This is TypeScript evidence; it does not establish native layout behavior.

Child traversal derives its node type from `View.eachChildView`, which exposes
`ViewCommon` in the Windows preview and `View` in registry Core. Revisit the declaration patch when upgrading Core;
remove it once the upstream Windows view and layout declarations preserve
assignability without it.

## Find local evidence

The former UI register, lab report, and later qualification report are indexed
in `local_artifacts`. Use [operational evidence lookup](exploration.md#operational-evidence)
to retrieve their file paths and provenance. Historical parked/implemented
counts do not describe current source or close current qualification gates.
