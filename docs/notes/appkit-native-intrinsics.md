# AppKit native intrinsic implementation ledger

This contributor note tracks runtime work toward the shared native JSX release.
A declaration or a platform component that attaches a host through a ref does
not implement the corresponding raw intrinsic tag.

The [original plan](goddard://task/d95bf9e4-08ae-4198-9c1a-024f8baaf7a7)
requires the complete native contract before release: no reduced macOS subset,
legacy source aliases, or compatibility period. This ledger does not change
those gates. Stage 3 source/default migration and full platform qualification
remain separate work.

## Current inventory

The authority is `NativeElements` in `packages/jsx/src/shared.d.ts`: 39 core
intrinsics, nine maintained extensions, and compiler-produced `#text`.
All conditioned native declarations derive from that same map.

| Family            | Existing AppKit factories                                      | Missing raw AppKit hosts                                                                                                               |
| ----------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Layout            | `absolutelayout`, `flexboxlayout`, `gridlayout`, `stacklayout` | `contentview`, `docklayout`, `proxyviewcontainer`, `rootlayout`, `wraplayout`                                                          |
| Text              | `label`, `span`                                                | `formattedstring`, `htmlview`                                                                                                          |
| Text input        | `textfield`, `textview`                                        | `searchbar`                                                                                                                            |
| Controls          | `button`, `switch`, `slider`                                   | `activityindicator`, `datepicker`, `listpicker`, `progress`, `segmentedbar`, `segmentedbaritem`, `timepicker`                          |
| Collections       | —                                                              | `listview`, `tabview`, `tabviewitem`                                                                                                   |
| Navigation        | —                                                              | `actionbar`, `actionitem`, `frame`, `navigationbutton`, `page`                                                                         |
| Other             | `image`, `scrollview`, `webview`                               | `liquidglass`, `placeholder`                                                                                                           |
| Shared extensions | —                                                              | `animatedimage`, `applesigninbutton`, `cachedimage`, `googlesigninbutton`, `nscanvas`, `pager`, `svgview`, `xplatlottie`, `xplatvideo` |

There are now 14 core factories and 25 missing core hosts. `span` is viewless;
its factory presence does not establish formatted-text behavior. The renderer
also handles `#text` and its historical AppKit-only `stack` name. Neither adds
a shared core element. Existing factory presence is source evidence, not a
claim that all shared props, events, styles, or lifecycle behavior are qualified.

[Palmer's retained attempt](goddard://task/5a8593b0-4b58-41b8-b194-acb1b4b4c13a)
failed during implementation, without a retained commit or submission result.
The current inventory therefore supersedes the assessment that the whole
runtime-parity assignment had finished.

## StackLayout host

The new host uses AppKit's NSStackView. Its default direction is vertical and
its default gap is zero. Updating or removing `orientation` reuses the same
native view; removing it restores vertical layout. Padding and child cross-axis
alignment use Auto Layout constraints. A fixed-size child with stretch
alignment centers on the cross axis, matching NativeScript's layout helper.

```tsx
/** @jsxImportSource @octane-xplat/jsx */
export default function Example() {
	return (
		<stacklayout orientation="horizontal" style={{ width: 240, height: 80, padding: 8 }}>
			<label text="First" verticalAlignment="middle" style={{ width: 40, height: 16 }} />
			<label text="Second" verticalAlignment="top" style={{ width: 40, height: 16 }} />
		</stacklayout>
	)
}
```

The maintained consumer fixture exercises default/reactive direction, padding,
fixed dimensions, different child alignment, keyed moves, child removal, host
identity, callback/object refs and cleanup, and reactive shared tap payloads.
Its production bundle and retained-root HMR run outside the repository from
packed JSX, renderer, and CLI packages. Viewless text children and invalid
orientation are rejected before a batch mutates the tree.

```sh
pnpm --filter @octane-xplat/macos-renderer test
pnpm --filter @octane-xplat/macos-renderer test:packed
pnpm --filter @octane-xplat/jsx typecheck
pnpm --filter @octane-xplat/jsx test:packed
```

CodeBlock, TimeWheelPanel, DateRangeInput and DateTimeInput already emit this
intrinsic in their macOS implementations. Their former unsupported-tag failure
is removed. The packed fixture establishes the raw host behavior; it does not
qualify every surrounding component interaction.

## Remaining release gates

The 25 missing core hosts and nine missing raw extension hosts remain required.
Existing hosts still need the full common contract audit, including lifecycle
notifications, gesture coverage, visibility/collapse, style coverage, and
payload normalization. StackLayout's inherited common-contract gaps are part
of that audit; this change does not qualify all common events or OS input.
No new iOS/Android execution or visual parity evidence is supplied by this unit.

This host fix does not change the recommended UI Stack API or the requirements
of the shared-layout recipe. Public source migration, release documentation,
package defaults, and the full native/web acceptance matrix must still land
and pass together. A sensible next independent host unit is ContentView's
single-child ownership, replacement, layout, refs, and disposal.
