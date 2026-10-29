import { expect, it, vi } from 'vitest'
import { scrollCommandPaletteHighlight } from './command-palette-scroll.macos'

it('reveals the complete row using AppKit local bounds, including grouped offsets', () => {
	const bounds = { origin: { x: 0, y: 0 }, size: { width: 240, height: 54 } }
	const row = { bounds, scrollRectToVisible: vi.fn() }
	scrollCommandPaletteHighlight(row)
	expect(row.scrollRectToVisible).toHaveBeenCalledWith(bounds)
	scrollCommandPaletteHighlight(undefined)
})
