import type { RouteHead } from '../props'
import { focusBrowserTarget } from '../internal/accessibility/focus-target.web'

/** Per-document effects. Prepared route data never enters history.state. */
export function createBrowserRouteEffects(browser: Window): {
	head: (next?: RouteHead) => void
	save(key: string | undefined): void
	forget(key: string): void
	clearFocus(): void
	restore(
		key: string | undefined,
		options?: { hash?: string; root?: HTMLElement | null; focus?: boolean },
	): void
	dispose(): void
} {
	const document = browser.document
	const initialTitle = document.title
	const positions = new Map<string, { x: number; y: number; focus: HTMLElement | null }>()
	let releaseFocusTarget: (() => void) | undefined
	const visible = (element: HTMLElement | null): element is HTMLElement => {
		if (
			!element?.isConnected ||
			element.matches(':disabled') ||
			element.closest('[inert],[hidden]')
		) {
			return false
		}
		for (let parent: HTMLElement | null = element; parent; parent = parent.parentElement) {
			const style = browser.getComputedStyle(parent)
			if (style.display === 'none' || style.visibility === 'hidden') {
				return false
			}
		}
		return true
	}
	const findId = (id: string, root?: HTMLElement | null) => {
		const local =
			(root?.id === id
				? root
				: Array.from(root?.querySelectorAll<HTMLElement>('[id]') ?? []).find(
						(node) => node.id === id,
					)) ?? null
		if (visible(local)) {
			return local
		}
		const global = document.getElementById(id)
		return visible(global) ? global : null
	}
	const focus = (target: HTMLElement) => {
		releaseFocusTarget?.()
		releaseFocusTarget = focusBrowserTarget(target, { focusVisible: false })
	}
	const pageTarget = (root?: HTMLElement | null) => {
		const container = root ?? null
		if (!visible(container)) {
			return document.body
		}
		for (const selector of [
			'[autofocus]',
			'h1,[role="heading"][aria-level="1"]',
			'main,[role="main"]',
		]) {
			const target = Array.from(container.querySelectorAll<HTMLElement>(selector)).find(visible)
			if (target) {
				return target
			}
		}
		return document.body
	}
	const metadata = new Map<
		string,
		{ node: HTMLMetaElement; original: string | null; created: boolean }
	>()
	let applied = false
	let activeMeta = new Set<string>()
	const head = (next?: RouteHead): void => {
		applied = true
		document.title = next?.title ?? initialTitle
		const names = new Set(Object.keys(next?.meta ?? {}))
		for (const name of activeMeta) {
			if (names.has(name)) {
				continue
			}

			const previous = metadata.get(name)!
			if (previous.created) {
				previous.node.remove()
			} else if (previous.original === null) {
				previous.node.removeAttribute('content')
			} else {
				previous.node.content = previous.original
			}
		}
		for (const name of names) {
			let entry = metadata.get(name)
			if (!entry) {
				const existing = [...document.head.querySelectorAll('meta[name]')].find(
					(node) => node.getAttribute('name') === name,
				) as HTMLMetaElement | undefined

				const node = existing ?? document.createElement('meta')
				entry = { node, original: existing?.getAttribute('content') ?? null, created: !existing }
				metadata.set(name, entry)
			}

			entry.node.name = name
			entry.node.content = next!.meta![name]
			if (!entry.node.isConnected) {
				document.head.append(entry.node)
			}
		}
		activeMeta = names
	}
	return {
		head,
		save(key: string | undefined): void {
			if (key) {
				const active = document.activeElement as HTMLElement | null
				positions.set(key, {
					x: browser.scrollX,
					y: browser.scrollY,
					focus: active !== document.body && visible(active) ? active : null,
				})
			}
		},
		forget(key: string): void {
			positions.delete(key)
		},
		clearFocus(): void {
			releaseFocusTarget?.()
			releaseFocusTarget = undefined
		},
		restore(
			key: string | undefined,
			options: { hash?: string; root?: HTMLElement | null; focus?: boolean } = {},
		): void {
			const position = key ? positions.get(key) : undefined
			const hashTarget = options.hash ? findId(options.hash, options.root) : null
			if (options.focus !== false) {
				const previous = position?.focus
				const restored = visible(previous ?? null)
					? previous
					: previous?.id
						? findId(previous.id, options.root)
						: null

				focus(restored ?? hashTarget ?? pageTarget(options.root))
			}
			if (position) {
				browser.scrollTo(position.x, position.y)
				return
			}
			if (hashTarget?.scrollIntoView) {
				hashTarget.scrollIntoView()
			} else {
				browser.scrollTo(0, 0)
			}
		},
		dispose(): void {
			releaseFocusTarget?.()
			releaseFocusTarget = undefined
			if (applied) {
				head()
			}
			positions.clear()
			metadata.clear()
		},
	}
}
