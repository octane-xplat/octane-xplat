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

Check shared ownership seams before making per-control workarounds: pointer
subscriptions/capture, focus and keyboard routing, controlled rollback, layout
and percentage sizing, text hosting, locale formatting, and modal cleanup. Keep
upstream repair scope and removal conditions in the
[owning repair notes](parity/windows-support-progress.md).

Use `windows_recipe_checks` for per-criterion documentation and execution
assessments; do not relabel Windows evidence as a mobile or AppKit target.

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
controlled acceptance/rejection, disabled stops and matching panel content. It
does not implement or qualify TabItem/SelectionItem, a single Tab stop or arrow
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

## Find local evidence

The former UI register, lab report, and later qualification report are indexed
in `local_artifacts`. Use [operational evidence lookup](exploration.md#operational-evidence)
to retrieve their file paths and provenance. Historical parked/implemented
counts do not describe current source or close current qualification gates.
