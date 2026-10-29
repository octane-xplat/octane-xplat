/** Own only this layer's token. Other layers and consumer edits survive release. */
export function ownAnchorName(element: HTMLElement, name: string): () => void {
	const tokens = () =>
		element.style
			.getPropertyValue('anchor-name')
			.split(',')
			.map((token) => token.trim())
			.filter((token) => token && token !== 'none')

	const previous = element.style.getPropertyValue('anchor-name')
	const priority = element.style.getPropertyPriority('anchor-name')
	const added = !tokens().includes(name)
	if (added) {
		element.style.setProperty('anchor-name', [...tokens(), name].join(', '), priority)
	}

	return () => {
		if (!added) {
			return
		}

		if (!tokens().includes(name)) {
			return
		}

		const currentPriority = element.style.getPropertyPriority('anchor-name')
		const remaining = tokens().filter((token) => token !== name)
		if (remaining.length) {
			element.style.setProperty('anchor-name', remaining.join(', '), currentPriority)
		} else if (previous === 'none') {
			element.style.setProperty('anchor-name', previous, priority)
		} else {
			element.style.removeProperty('anchor-name')
		}
	}
}

/** Let the browser resolve rem/em/var/calc rather than treating them as px. */
export function resolveCSSLayerOffset(offset: number | string, anchor: HTMLElement): number {
	if (typeof offset === 'number') {
		return Number.isFinite(offset) ? Math.max(0, offset) : 0
	}

	const probe = anchor.ownerDocument.createElement('div')
	const context = getComputedStyle(anchor)
	probe.style.cssText =
		'position:fixed;visibility:hidden;pointer-events:none;height:0;padding:0;border:0;'

	probe.style.fontSize = context.fontSize
	// Chromium can expose a custom property's value without enumerating its name.
	// Read the variables actually referenced by the length, including fallbacks.
	for (const match of offset.matchAll(/var\(\s*(--[^,\s)]+)/g)) {
		const name = match[1]
		const value = context.getPropertyValue(name)
		if (value) {
			probe.style.setProperty(name, value)
		}
	}

	probe.style.width = offset

	;(anchor.parentElement ?? anchor.ownerDocument.body).append(probe)
	try {
		const width =
			probe.getBoundingClientRect().width || Number.parseFloat(getComputedStyle(probe).width)

		return Number.isFinite(width) ? Math.max(0, width) : 0
	} finally {
		probe.remove()
	}
}
