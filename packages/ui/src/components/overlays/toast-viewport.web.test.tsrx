/** @jsxImportSource @octane-xplat/jsx/dom */
// @vitest-environment jsdom
import { afterEach, expect, it } from 'vitest'
import { act, createRoot } from 'octane'
import { ToastViewportSurface } from './toast-viewport.web.tsrx'
import { pushToast, toastStore } from './toast-store'

const roots: any[] = []

function mount(props: any = {}) {
	const el = document.createElement('div')
	document.body.append(el)
	const root = createRoot(el)
	roots.push(root)
	act(() =>
		root.render(
			<ToastViewportSurface viewportId="test" position="bottomEnd" maxVisible={5} {...props} />,
		),
	)

	return el
}

afterEach(() => {
	for (const root of roots.splice(0)) {
		act(() => root.unmount())
	}

	document.body.innerHTML = ''
	toastStore.set([])
})

it('renders the top-layer viewport behind display:contents outlet and layer wrappers', () => {
	const el = mount()
	const outlet = el.querySelector('.vx-toast-outlet')!
	const layer = outlet.querySelector('.vx-toast-layer')!
	const viewport = layer.querySelector('.vx-toast-viewport')!
	expect(outlet.parentElement).toBe(el)
	expect(layer.parentElement).toBe(outlet)
	expect(viewport.parentElement).toBe(layer)
	expect(viewport.getAttribute('popover')).toBe('manual')
	expect(viewport.classList.contains('vx-toast-viewport--bottom')).toBe(true)
	expect(viewport.classList.contains('vx-toast-viewport--end')).toBe(true)
	expect(viewport.hasAttribute('role')).toBe(false)
})

it('anchors the viewport to the configured edge', () => {
	const el = mount({ position: 'topStart' })
	const viewport = el.querySelector('.vx-toast-viewport')!
	expect(viewport.classList.contains('vx-toast-viewport--top')).toBe(true)
	expect(viewport.classList.contains('vx-toast-viewport--start')).toBe(true)
})

it('omits the outlet wrappers when isTopLayer is false', () => {
	const el = mount({ isTopLayer: false })
	expect(el.querySelector('.vx-toast-outlet')).toBeNull()
	const viewport = el.querySelector('.vx-toast-viewport')!
	expect(viewport.parentElement).toBe(el)
	expect(viewport.hasAttribute('popover')).toBe(false)
})

it('announces string bodies through the document-level live regions', async () => {
	mount()
	act(() => pushToast({ body: 'Saved' }, 'test'))
	await act(async () => {
		await new Promise((r) => requestAnimationFrame(r))
	})

	const region = document.body.querySelector('[data-xplat-live-region="polite"]')!
	expect(region.textContent).toBe('Saved')
})
