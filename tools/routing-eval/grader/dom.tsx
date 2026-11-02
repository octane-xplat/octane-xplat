/** @jsxImportSource @octane-xplat/jsx/dom */
// Hidden grader helpers. The runner copies this directory into the evaluated
// app after the agent finishes; the agent never sees these files.
import { vi } from 'vitest'

export const wait = (assertion: () => void) =>
	vi.waitFor(assertion, { timeout: 4000, interval: 20 })

/** Deepest element whose trimmed text is exactly the label. */
export function byText(label: string): HTMLElement | undefined {
	const matches = [...document.body.querySelectorAll<HTMLElement>('*')].filter(
		(element) => element.textContent?.trim() === label,
	)
	return matches.at(-1)
}

export function click(label: string) {
	const element = byText(label)
	if (!element) {
		throw new Error(`No element with text ${JSON.stringify(label)}; page text: ${pageText()}`)
	}
	element.click()
}

export const pageText = () => document.body.textContent?.replace(/\s+/g, ' ').trim() ?? ''

/** Render the app's exported App at a starting URL; records every text that appears. */
export async function renderApp(url: string) {
	window.history.replaceState(null, '', url)
	const seen: string[] = []
	const observer = new MutationObserver(() => seen.push(pageText()))
	observer.observe(document.body, { subtree: true, childList: true, characterData: true })
	const { createRoot } = await import('octane')
	const { App } = await import('../App.tsrx')
	const container = document.createElement('div')
	document.body.append(container)
	const root = createRoot(container)
	root.render(<App />)
	return {
		seen,
		unmount() {
			observer.disconnect()
			root.unmount()
			container.remove()
		},
	}
}

/** Page text excluding hidden subtrees, such as unselected tab panels. */
export function visibleText(): string {
	const copy = document.body.cloneNode(true) as HTMLElement
	for (const element of copy.querySelectorAll<HTMLElement>('[hidden], [aria-hidden="true"]')) {
		element.remove()
	}
	for (const element of copy.querySelectorAll<HTMLElement>('[style]')) {
		if (element.style.display === 'none') element.remove()
	}
	return copy.textContent?.replace(/\s+/g, ' ').trim() ?? ''
}
