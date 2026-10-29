interface HeadingView {
	stringValue: string
	accessibilityRole: string
	accessibilityTitle: string | null
	accessibilityValue: unknown
}
interface Original {
	role: string
	title: string | null
	value: unknown
	valueFollowsText: boolean
}
const originals = new WeakMap<HeadingView, Original>()

/** AXHeading uses its value for the level and its title for readable content.
 * Keep those separate from NSTextField's visible string/attributed string. */
export function syncHeadingAccessibility(view: HeadingView, props: Record<string, unknown>) {
	if (props.accessibilityRole !== 'heading') {
		const original = originals.get(view)
		if (!original) return
		originals.delete(view)
		view.accessibilityRole = original.role
		view.accessibilityTitle = original.title
		view.accessibilityValue = original.valueFollowsText ? String(view.stringValue ?? '') : original.value
		return
	}
	if (!originals.has(view)) {
		const value = view.accessibilityValue
		originals.set(view, { role: view.accessibilityRole, title: view.accessibilityTitle, value,
			valueFollowsText: value === String(view.stringValue ?? '') })
	}
	const level = props.accessibilityHeadingLevel
	view.accessibilityRole = 'AXHeading'
	view.accessibilityTitle = String(view.stringValue ?? '')
	view.accessibilityValue = typeof level === 'number' && Number.isInteger(level) && level >= 1 && level <= 6 ? level : 2
}
