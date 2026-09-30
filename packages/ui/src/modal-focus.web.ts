type Scope = {
	layer: HTMLElement
	panel: HTMLElement
	trigger: HTMLElement | null
}

const scopes: Scope[] = []
const originalInert = new Map<HTMLElement, boolean>()
let observer: MutationObserver | undefined

function topScope(): Scope | undefined {
	return scopes[scopes.length - 1]
}

function updateIsolation(): void {
	const top = topScope()
	if (!top) {
		for (const [element, inert] of originalInert) {
			if (!inert) {element.removeAttribute('inert')}
		}

		originalInert.clear()
		return
	}

	for (const element of Array.from(top.layer.ownerDocument.body.children) as HTMLElement[]) {
		if (!originalInert.has(element)) {originalInert.set(element, element.hasAttribute('inert'))}
		const inert = originalInert.get(element) || !element.contains(top.layer)
		element.toggleAttribute('inert', inert)
	}
}

function tabStops(panel: HTMLElement): HTMLElement[] {
	return Array.from(panel.querySelectorAll<HTMLElement>(
		'a[href],button,input,textarea,select,[tabindex],[contenteditable="true"]',
	)).filter((element) => {
		if (element.tabIndex < 0 || element.matches(':disabled') || element.closest('[inert],[hidden]')) {return false}
		for (let parent: HTMLElement | null = element; parent; parent = parent.parentElement) {
			const style = getComputedStyle(parent)
			if (style.display === 'none' || style.visibility === 'hidden') {return false}
		}

		return true
	})
}

/** Own keyboard focus only for a modal body portal. Inert preserves the
 * background's state while hiding it from both focus and the browser AX tree. */
export function isolateModalFocus(layer: HTMLElement, panel: HTMLElement, dismiss: () => void): () => void {
	const document = layer.ownerDocument
	const scope: Scope = { layer, panel, trigger: document.activeElement as HTMLElement | null }
	const tabIndex = panel.getAttribute('tabindex')
	if (tabIndex === null) {panel.tabIndex = -1}
	scopes.push(scope)
	updateIsolation()

	// An outer modal may have made this newly appended portal inert before
	// its effect ran. Restore the top layer before attempting to focus it.
	;(tabStops(panel)[0] ?? panel).focus({ preventScroll: true })
	if (!observer) {
		observer = new MutationObserver(updateIsolation)
		observer.observe(document.body, { childList: true })
	}

	const focusInside = () => (tabStops(panel)[0] ?? panel).focus({ preventScroll: true })
	const onFocus = (event: FocusEvent) => {
		if (topScope() === scope && !panel.contains(event.target as Node)) {focusInside()}
	}

	const onKey = (event: KeyboardEvent) => {
		if (topScope() !== scope || event.isComposing || event.keyCode === 229) {return}
		if (event.key === 'Escape') {
			event.preventDefault()
			event.stopPropagation()
			dismiss()
		} else if (event.key === 'Tab') {
			const stops = tabStops(panel)
			const index = stops.indexOf(document.activeElement as HTMLElement)
			if (!stops.length || index < 0 || (event.shiftKey ? index === 0 : index === stops.length - 1)) {
				event.preventDefault()

				;(stops.length ? stops[event.shiftKey ? stops.length - 1 : 0] : panel).focus({ preventScroll: true })
			}
		}
	}

	document.addEventListener('focusin', onFocus)
	document.addEventListener('keydown', onKey, true)
	return () => {
		const wasTop = topScope() === scope
		const index = scopes.indexOf(scope)
		if (index < 0) {return}
		// If a lower modal closes first, its children's return targets disappear.
		for (const other of scopes) {
			if (other !== scope && other.trigger && scope.layer.contains(other.trigger)) {other.trigger = scope.trigger}
		}

		scopes.splice(index, 1)
		document.removeEventListener('focusin', onFocus)
		document.removeEventListener('keydown', onKey, true)
		if (tabIndex === null) {panel.removeAttribute('tabindex')}
		updateIsolation()
		if (!scopes.length) {
			observer?.disconnect()
			observer = undefined
		}

		if (wasTop) {
			const trigger = scope.trigger
			if (trigger?.isConnected && !trigger.closest('[inert]')) {trigger.focus({ preventScroll: true })}
			else {
				const remaining = topScope()
				if (remaining) {(tabStops(remaining.panel)[0] ?? remaining.panel).focus({ preventScroll: true })}
			}
		}
	}
}
