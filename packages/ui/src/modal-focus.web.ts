import './layer-keys.web'
import { isTopLayer, layerContains, registerLayer } from './layer-stack'
type Scope = {
	layer: HTMLElement
	panel: HTMLElement
	trigger: HTMLElement | null
}

const TAB_STOP_SELECTOR = 'a[href],button,input,textarea,select,[tabindex],[contenteditable="true"]'

const CLICK_TRIGGER_MAX_AGE_MS = 1000

const recentClickTargets = new WeakMap<Document, { element: HTMLElement; at: number }>()
const clickCaptureDocuments = new WeakSet<Document>()
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
			if (!inert) {
				element.removeAttribute('inert')
			}
		}

		originalInert.clear()
		return
	}

	for (const element of Array.from(top.layer.ownerDocument.body.children) as HTMLElement[]) {
		if (!originalInert.has(element)) {
			originalInert.set(element, element.hasAttribute('inert'))
		}

		const inert = originalInert.get(element) || !element.contains(top.layer)
		element.toggleAttribute('inert', inert)
	}
}

function isTabStop(element: HTMLElement): boolean {
	if (element.tabIndex < 0 || element.matches(':disabled') || element.closest('[inert],[hidden]')) {
		return false
	}

	for (let parent: HTMLElement | null = element; parent; parent = parent.parentElement) {
		const style = getComputedStyle(parent)
		if (style.display === 'none' || style.visibility === 'hidden') {
			return false
		}
	}

	return true
}

function tabStops(panel: HTMLElement): HTMLElement[] {
	return Array.from(panel.querySelectorAll<HTMLElement>(TAB_STOP_SELECTOR)).filter(isTabStop)
}

// WebKit may leave pointer-activated buttons unfocused. Keep their target
// briefly so the modal effect can associate a new portal with its opener.
function captureClickTargets(document: Document): void {
	if (clickCaptureDocuments.has(document)) {
		return
	}

	clickCaptureDocuments.add(document)
	document.addEventListener(
		'click',
		(event) => {
			recentClickTargets.delete(document)
			for (const target of event.composedPath()) {
				if (
					!target ||
					typeof target !== 'object' ||
					!('nodeType' in target) ||
					(target as Node).nodeType !== 1
				) {
					continue
				}

				const element = target as HTMLElement
				if (element.matches(TAB_STOP_SELECTOR) && isTabStop(element)) {
					recentClickTargets.set(document, { element, at: Date.now() })
					return
				}
			}
		},
		true,
	)
}

if (typeof document !== 'undefined') {
	captureClickTargets(document)
}

/** Own keyboard focus only for a modal body portal. Inert preserves the
 * background's state while hiding it from both focus and the browser AX tree. */
export function isolateModalFocus(
	layer: HTMLElement,
	panel: HTMLElement,
	dismiss: () => void,
	depth = scopes.length,
): () => void {
	const document = layer.ownerDocument
	captureClickTargets(document)
	const recentClick = recentClickTargets.get(document)
	const clickTrigger =
		recentClick && Date.now() - recentClick.at <= CLICK_TRIGGER_MAX_AGE_MS
			? recentClick.element
			: null

	recentClickTargets.delete(document)
	const scope: Scope = {
		layer,
		panel,
		trigger: clickTrigger ?? (document.activeElement as HTMLElement | null),
	}

	const tabIndex = panel.getAttribute('tabindex')
	if (tabIndex === null) {
		panel.tabIndex = -1
	}

	const token = {}
	const removeLayer = registerLayer({
		token,
		depth,
		behavior: 'close',
		dismiss,
		contains: (target) => panel.contains(target),
	})

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
		if (
			topScope() === scope &&
			!panel.contains(event.target as Node) &&
			!layerContains(event.target)
		) {
			focusInside()
		}
	}

	const onKey = (event: KeyboardEvent) => {
		if (topScope() !== scope || !isTopLayer(token) || event.isComposing || event.keyCode === 229) {
			return
		}

		if (event.key === 'Tab') {
			const stops = tabStops(panel)
			const index = stops.indexOf(document.activeElement as HTMLElement)
			if (
				!stops.length ||
				index < 0 ||
				(event.shiftKey ? index === 0 : index === stops.length - 1)
			) {
				event.preventDefault()

				;(stops.length ? stops[event.shiftKey ? stops.length - 1 : 0] : panel).focus({
					preventScroll: true,
				})
			}
		}
	}

	document.addEventListener('focusin', onFocus)
	document.addEventListener('keydown', onKey, true)
	return () => {
		const wasTop = topScope() === scope
		const index = scopes.indexOf(scope)
		if (index < 0) {
			return
		}

		// If a lower modal closes first, its children's return targets disappear.
		for (const other of scopes) {
			if (other !== scope && other.trigger && scope.layer.contains(other.trigger)) {
				other.trigger = scope.trigger
			}
		}

		scopes.splice(index, 1)
		removeLayer()
		document.removeEventListener('focusin', onFocus)
		document.removeEventListener('keydown', onKey, true)
		if (tabIndex === null) {
			panel.removeAttribute('tabindex')
		}

		updateIsolation()
		if (!scopes.length) {
			observer?.disconnect()
			observer = undefined
		}

		if (wasTop) {
			const trigger = scope.trigger
			if (trigger?.isConnected && !trigger.closest('[inert]')) {
				trigger.focus({ preventScroll: true })
			} else {
				const remaining = topScope()
				if (remaining) {
					;(tabStops(remaining.panel)[0] ?? remaining.panel).focus({ preventScroll: true })
				}
			}
		}
	}
}
