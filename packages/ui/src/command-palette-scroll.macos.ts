/** AppKit converts a row's local bounds through its enclosing clip view. */
export function scrollCommandPaletteHighlight(row: any): void {
	row?.scrollRectToVisible?.(row.bounds)
}
