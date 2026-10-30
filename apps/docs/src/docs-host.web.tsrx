import { useEffect, useState, useRef } from 'octane'
import { openUrl } from '@octane-xplat/platform'
import type { ScrollableAreaHandle, WebViewMessageEvent } from '@octane-xplat/ui'

// The docs currently have a browser host. These integrations have no shared
// UI equivalent; keep them out of the presentation components.

export function useDocsKeyboard(options: { isOpen: boolean; open(): void }) {
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
				e.preventDefault()
				if (options.isOpen) {
					// The palette's own clear action resets the query and refocuses the input.
					const clear = window.document.querySelector<HTMLButtonElement>(
						'.vx-cmdk-layer .vx-input-clear:not(:disabled)',
					)

					if (clear) {
						clear.click()
					} else {
						;(window.document.getElementById('palette-query') as HTMLInputElement | null)?.focus()
					}
				} else {
					options.open()
				}

				return
			}

			if (e.key === '/' && !options.isOpen) {
				const t = e.target as HTMLElement | null
				if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) {
					return
				}

				e.preventDefault()
				options.open()
			}
		}

		window.addEventListener('keydown', onKey)
		return () => window.removeEventListener('keydown', onKey)
	}, [options.isOpen])
}

export function useTableScrollEdges(
	scroll: { current: ScrollableAreaHandle | null },
	rows: string[][],
) {
	useEffect(() => {
		const element = scroll.current?.native
		if (!(element instanceof HTMLElement)) {
			return
		}

		const block = element.parentElement
		if (!block) {
			return
		}

		const updateEdges = () => {
			const maxScroll = element.scrollWidth - element.clientWidth
			block.classList.toggle('has-overflow', maxScroll > 1)
			block.classList.toggle('clips-left', element.scrollLeft > 1)
			block.classList.toggle('clips-right', element.scrollLeft < maxScroll - 1)
		}

		updateEdges()
		element.addEventListener('scroll', updateEdges, { passive: true })
		const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(updateEdges) : null
		observer?.observe(element)
		if (element.firstElementChild) {
			observer?.observe(element.firstElementChild)
		}

		return () => {
			element.removeEventListener('scroll', updateEdges)
			observer?.disconnect()
		}
	}, [rows])
}

export function usePageActions(markdown: string) {
	const viewMarkdown = () => {
		const url = URL.createObjectURL(new Blob([markdown], { type: 'text/plain;charset=utf-8' }))
		openUrl(url)
		setTimeout(() => URL.revokeObjectURL(url), 60_000)
	}

	const openCodex = () => {
		const prompt = `Help me apply the guidance from this documentation page: ${window.location.href}`
		const url = `codex://new?prompt=${encodeURIComponent(prompt)}`
		openUrl(url)
	}

	const askAI = () => {
		const prompt = `Explain this documentation page: ${window.location.href}`
		openUrl(`https://chatgpt.com/?q=${encodeURIComponent(prompt)}`)
	}

	return { viewMarkdown, openCodex, askAI }
}

export function restoreMenu() {
	const panel = document.querySelector<HTMLElement>('.vx-sheet.docs-menu')
	const shade = document.querySelector<HTMLElement>('.vx-sheet-backdrop')
	if (panel) {
		panel.style.transition = 'transform 200ms ease-out'
		panel.style.transform = 'translateY(0px)'
	}

	if (shade) {
		shade.style.transition = 'opacity 200ms ease-out'
		shade.style.opacity = '0.4'
	}
}

export function animateMenuDismiss(): boolean {
	const panel = document.querySelector<HTMLElement>('.vx-sheet.docs-menu')
	if (!panel) {
		return false
	}

	const shade = document.querySelector<HTMLElement>('.vx-sheet-backdrop')
	panel.style.transition = 'transform 200ms ease-in'
	panel.style.transform = 'translateY(102%)'
	if (shade) {
		shade.style.transition = 'opacity 200ms ease-in'
		shade.style.opacity = '0'
	}

	return true
}

export function useDemoPreview(demo: string) {
	const [state, setState] = useState('idle')
	const [attempt, setAttempt] = useState(0)
	const token = useRef(crypto.randomUUID())
	const launch = useRef<object | null>(null)
	const url = `/demo.html?demo=${demo}&token=${token.current}`
	useEffect(() => {
		if (state !== 'loading') {
			return
		}

		const timeout = setTimeout(() => setState('error'), 15000)
		return () => clearTimeout(timeout)
	}, [state, attempt])

	const ready = (event: WebViewMessageEvent) => {
		const data = event.data as { demo?: string; token?: string; type?: string } | null
		if (
			(event.origin === undefined || event.origin === location.origin) &&
			data?.token === token.current &&
			data?.type === 'xplat-demo-ready' &&
			data.demo === demo
		) {
			setState('ready')
		}
	}

	const start = () => {
		token.current = crypto.randomUUID()
		setAttempt(attempt + 1)
		setState('loading')
	}

	const close = () => {
		setState('idle')
		requestAnimationFrame(() => (launch.current as HTMLElement | null)?.focus())
	}

	return {
		state,
		attempt,
		launch,
		url,
		start,
		close,
		fail: () => setState('error'),
		// Keep the embedded demo's Back to docs link usable on direct activation.
		frameProps: {
			sandbox:
				'allow-scripts allow-same-origin allow-forms allow-modals allow-top-navigation-by-user-activation',
			onMessage: ready,
		},
	}
}
