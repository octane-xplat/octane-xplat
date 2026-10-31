interface GridNode { view: unknown; props: Record<string, unknown>; cssClasses?: Set<string> }

/** Read marked managed cells in native child order, including across host wrappers.
 * Nested hook roots and GridList components own their descendants separately. */
export function readGridCells(root: any, nodeForView: (view: object) => GridNode | undefined, nestedRoots: readonly object[] = []): object[] {
	const cells: object[] = [], seen = new Set<object>(), excluded = new Set(nestedRoots)
	const visit = (view: any) => {
		if (!view || (typeof view !== 'object' && typeof view !== 'function') || seen.has(view)) {return}
		seen.add(view)
		const node = nodeForView(view)
		const managed = node?.view === view ? node : undefined
		if (view !== root && (excluded.has(view) || managed?.cssClasses?.has('vx-gridlist'))) {return}
		if (view !== root && managed && managed.props['data-grid-cell'] != null) {cells.push(view)}
		const children = view.subviews
		if (Array.isArray(children)) { for (const child of children) {visit(child)} }
		else if (children && typeof children.objectAtIndex === 'function') {
			const count = Number(children.count)
			if (Number.isSafeInteger(count) && count >= 0) {for (let index = 0; index < count; index++) {visit(children.objectAtIndex(index))}}
		}
	}
	visit(root)
	return cells
}
