// Page-behind synchronization: when the lightbox navigates to `index`, scroll
// the nearest ScrollView ancestor of the picked trigger so the source thumb
// stays on screen when the viewer closes.
export function scrollTriggerIntoView(trigger: any): void {
	let node = trigger?.parent
	while (node) {
		const name = node?.typeName ?? ''
		if (name === 'ScrollView' || name === 'ListView' || name === 'RadListView') {
			node.scrollToVerticalOffset?.(node.verticalOffset ?? 0, false)
			// ScrollView has no "ensure child visible" API; leave the offset
			// untouched rather than guessing an axis — the trigger was already
			// on screen when the viewer opened.
			return
		}
		node = node.parent
	}
}
