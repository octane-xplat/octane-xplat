// @vitest-environment jsdom
import { act, createRoot } from 'octane'
import { describe, expect, it, vi } from 'vitest'
vi.mock('./theme/theme-scheme', () => ({ useThemeScheme: () => 'light' }))
import { useLayer } from './use-layer'
import { ownAnchorName } from './layer-position.web'

let layer: any
function Probe(props: { open?: boolean; hide?: () => void; custom?: boolean }) @{
	layer = useLayer({ mode: 'context', isOpen: props.open, dismissOnEscape: true, onHide: props.hide })

	<><button ref={layer.ref}>Anchor</button>{layer.render('Body', props.custom ? { positioning: 'custom', style: { right: 12, bottom: 18 }, accessibilityRole: 'dialog' } : { placement: 'below', accessibilityRole: 'dialog' })}</>
}

describe('useLayer ownership', () => {
	it('keeps other anchor tokens during replacement, consumer edits and release', () => {
		const a = document.createElement('div'), b = document.createElement('div')
		a.style.setProperty('anchor-name', '--consumer')
		const releaseFirst = ownAnchorName(a, '--first'), releaseSecond = ownAnchorName(a, '--second')
		expect(a.style.getPropertyValue('anchor-name')).toBe('--consumer, --first, --second')
		a.style.setProperty('anchor-name', a.style.getPropertyValue('anchor-name') + ', --later')
		releaseFirst()
		expect(a.style.getPropertyValue('anchor-name')).toBe('--consumer, --second, --later')
		const releaseB = ownAnchorName(b, '--first')
		releaseSecond(); releaseB()
		expect(a.style.getPropertyValue('anchor-name')).toBe('--consumer, --later')
		expect(b.style.getPropertyValue('anchor-name')).toBe('')
	})

	it('cleans its anchor on unmount and keeps rejected controlled dismissal mounted', () => {
		const container = document.createElement('div'); document.body.append(container)
		const root = createRoot(container), hide = vi.fn()
		act(() => root.render(Probe, { open: true, hide, custom: true }))
		const anchor = container.querySelector('button')!, panel = document.querySelector('[role="dialog"]') as HTMLElement
		expect(panel.style.getPropertyValue('position-anchor')).toBe(layer.anchorId)
		expect(panel.style.left).toBe('')
		expect(panel.style.top).toBe('')
		expect(panel.style.right).toBe('12px')
		act(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })))
		expect(hide).toHaveBeenCalledTimes(1)
		expect(document.querySelector('[role="dialog"]')).toBe(panel)
		act(() => root.render(Probe, { open: false, hide }))
		expect(document.querySelector('[role="dialog"]')).toBeNull()
		expect(hide).toHaveBeenCalledTimes(1)
		act(() => root.unmount())
		expect(anchor.style.getPropertyValue('anchor-name')).toBe('')
		container.remove()
	})
})


function ExternalProbe() @{
	layer = useLayer({ mode: 'context' })

	<>{layer.render('Body', { placement: 'below', accessibilityRole: 'dialog' })}</>
}

describe('useLayer anchor replacement ownership', () => {
	it('releases the previous element without deleting consumer names and cleans the current ref on unmount', () => {
		const container = document.createElement('div'), next = document.createElement('div')
		next.style.setProperty('anchor-name', '--consumer')
		document.body.append(container, next)
		const root = createRoot(container)
		try {
			act(() => root.render(ExternalProbe, {}))
			const previous = document.createElement('button')
			container.append(previous)
			act(() => layer.ref(previous))
			act(() => layer.ref(next))
			expect(previous.style.getPropertyValue('anchor-name')).toBe('')
			expect(next.style.getPropertyValue('anchor-name')).toContain('--consumer, --xplat-layer-')
		} finally { act(() => root.unmount()); container.remove() }

		expect(next.style.getPropertyValue('anchor-name')).toBe('--consumer')
		next.remove()
	})
})
