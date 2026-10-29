# Navigate custom native macOS cell grids

`useGridFocus` now has an AppKit source implementation for marked native cells.
It reuses the native grid focus and scrolling engine, supports bounded arrow
and Home/End movement, and leaves selection/activation with the cell. No new
dependency or public option is added.

```tsx
// Palette.macos.tsx
import { useGridFocus } from '@octane-xplat/ui'
export function Palette() {
	const grid = useGridFocus<NSView>({ rows: 1, columns: 2 })
	return <masonview ref={grid.ref} onKeyDown={grid.onKeyDown} className="flex flex-row gap-2">
		<button data-grid-cell text="Red" onTap={() => console.log('Red')} />
		<button data-grid-cell text="Blue" onTap={() => console.log('Blue')} />
	</masonview>
}
```

See [custom AppKit cells](https://github.com/octane-xplat/octane-xplat/blob/main/docs/app/components.md#custom-grid-cell-focus-on-appkit).
Native input, compiled hooks, nested focus, scrolling, layout, VoiceOver,
cleanup and installed consumers remain unqualified. The selector-based
`useGridList` hook is a separate remaining gap.
