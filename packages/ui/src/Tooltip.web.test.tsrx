// @vitest-environment jsdom
import { act, createRoot } from 'octane'
import { describe, expect, it, vi } from 'vitest'
vi.mock('./theme/theme-scheme', () => ({ useThemeScheme: () => 'light' }))
import { Tooltip } from './Tooltip.web.tsrx'

describe('Tooltip shared layer', () => {
	it('anchors a named tooltip on focus, updates content, and dismisses with Escape', () => {
		const container = document.createElement('div')
		document.body.append(container)
		const root = createRoot(container)
		try {
			act(() => root.render(Tooltip, { trigger: <button>Help</button>, content: 'First' }))
			const button = container.querySelector('button')!
			act(() => button.focus())
			const panel = document.querySelector('[role="tooltip"]')!
			expect(panel?.textContent).toBe('First')
			expect(button.getAttribute('aria-describedby')).toBe(panel.id)
			expect((container.firstElementChild as HTMLElement).style.getPropertyValue('anchor-name')).toContain('--xplat-layer-')
			act(() => root.render(Tooltip, { trigger: <button>Help</button>, content: 'Second' }))
			expect(document.querySelector('[role="tooltip"]')?.textContent).toBe('Second')
			act(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })))
			expect(document.querySelector('[role="tooltip"]')).toBeNull()
			expect(button.hasAttribute('aria-describedby')).toBe(false)
		} finally {
			act(() => root.unmount())
			container.remove()
		}
	})
})
