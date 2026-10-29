interface Node { type: string; view: unknown; props: Record<string, unknown> }
export interface AppKitOutlineHeading { id: string; label: string; level: number; view: object }

/** Renderer-owned metadata distinguishes Xplat headings from native widgets.
 * NSArray subviews are not JS arrays. Reading this tree never scrolls/focuses. */
export function readOutlineHeadings(root: any, nodeForView: (view: object) => Node | undefined): AppKitOutlineHeading[] {
	const headings: AppKitOutlineHeading[] = [], seen = new Set<object>()
	const visit = (view: any) => {
		if (!view || (typeof view !== 'object' && typeof view !== 'function') || seen.has(view)) return
		seen.add(view)
		const node = nodeForView(view)
		if (node?.view === view && node.type === 'label' && node.props.accessibilityRole === 'heading') {
			const label = String(view.stringValue ?? '').trim(), level = node.props.accessibilityHeadingLevel
			if (label) headings.push({ view, id: String(node.props.id ?? ''), label,
				level: typeof level === 'number' && Number.isInteger(level) && level >= 1 && level <= 6 ? level : 2 })
			return
		}
		const children = view.subviews
		if (Array.isArray(children)) { for (const child of children) visit(child) }
		else if (children && typeof children.objectAtIndex === 'function') {
			const count = Number(children.count)
			if (Number.isSafeInteger(count) && count >= 0) for (let index = 0; index < count; index++) visit(children.objectAtIndex(index))
		}
	}
	visit(root)
	return headings
}
