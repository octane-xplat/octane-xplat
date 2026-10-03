// Duck-typed native/AppKit view-tree walk for `useOutlineFromDOM` — views
// with accessibilityRole 'header' contribute outline items. No DOM, no
// platform imports: NS LayoutBase exposes `eachChildView`, ScrollView-style
// hosts expose `.content`, and both renderers keep `children`/subviews
// arrays for fallback.
import type { OutlineItem } from './props'
import { slugify, uniqueSlug } from './outline-utils'

export function* outlineChildViews(view: any): Generator<any> {
	if (!view) {
		return
	}

	if (typeof view.eachChildView === 'function') {
		const kids: any[] = []
		view.eachChildView((c: any) => {
			kids.push(c)
			return true
		})

		yield* kids
		return
	}

	if (view.content) {
		yield view.content
	}

	const kids = view.children ?? view.subviews
	if (Array.isArray(kids)) {
		yield* kids
	}
}

function textOf(view: any): string {
	if (typeof view.text === 'string') {
		return view.text
	}

	let out = ''
	for (const child of outlineChildViews(view)) {
		out += textOf(child)
	}

	return out
}

function levelOf(view: any): number {
	const cls = String(view.className ?? '')
	const m = cls.match(/vx-h(\d)/)
	return m ? Number(m[1]) : 2
}

/** Depth-first heading collection — matches document order. */
export function outlineItemsFromViewTree(root: any): OutlineItem[] {
	const counts = new Map<string, number>()
	const items: OutlineItem[] = []
	const walk = (view: any) => {
		if (!view) {
			return
		}

		if (view.accessibilityRole === 'header') {
			const label = textOf(view).trim()
			if (label) {
				const id = view.id || uniqueSlug(slugify(label), counts)
				items.push({ id, label, level: levelOf(view) })
			}

			return
		}

		for (const child of outlineChildViews(view)) {
			walk(child)
		}
	}

	walk(root)
	return items
}

/** Locate a view by `id` inside a subtree — used by Outline's native
 *  activation to find the heading it should scroll to. */
export function findViewById(root: any, id: string): any {
	if (!root) {
		return null
	}

	if (root.id === id) {
		return root
	}

	for (const child of outlineChildViews(root)) {
		const hit = findViewById(child, id)
		if (hit) {
			return hit
		}
	}

	return null
}
