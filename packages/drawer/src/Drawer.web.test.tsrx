/** @jsxImportSource @octane-xplat/jsx/dom */
import { act, createRoot } from 'octane'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Drawer } from './Drawer.web.tsrx'
const roots: ReturnType<typeof createRoot>[] = []
afterEach(() => {
	for (const root of roots.splice(0)) {
		act(() => root.unmount())
	}

	document.body.innerHTML = ''
})

function mount(props: Parameters<typeof Drawer>[0]) {
	const element = document.createElement('div')
	document.body.append(element)
	const root = createRoot(element)
	roots.push(root)
	act(() => root.render(Drawer, props))
	return root
}

const dismiss = () =>
	act(() =>
		document
			.querySelector('.vx-drawer-backdrop')!
			.dispatchEvent(new MouseEvent('click', { bubbles: true })),
	)

describe('web Drawer', () => {
	it('seeds defaultOpen and dismisses with both callbacks', () => {
		const onOpenChange = vi.fn(),
			onDismiss = vi.fn()

		mount({
			defaultOpen: true,
			onOpenChange,
			onDismiss,
			main: 'Main',
			drawer: 'Menu',
			accessibilityLabel: 'Account',
			width: 320,
		})

		expect(document.querySelector('[aria-label="Account"]')?.textContent).toBe('Menu')
		expect((document.querySelector('.vx-drawer-panel') as HTMLElement).style.width).toBe('320px')
		dismiss()
		expect(onOpenChange).toHaveBeenCalledWith(false)
		expect(onDismiss).toHaveBeenCalledOnce()
		expect(document.querySelector('.vx-drawer-panel')).toBeNull()
	})

	it('leaves controlled state to its owner and does not echo prop changes', () => {
		const onOpenChange = vi.fn()
		const root = mount({ open: true, onOpenChange })
		dismiss()
		expect(document.querySelector('.vx-drawer-panel')).not.toBeNull()
		expect(onOpenChange).toHaveBeenCalledOnce()
		act(() => root.render(Drawer, { open: false, onOpenChange }))
		expect(document.querySelector('.vx-drawer-panel')).toBeNull()
		expect(onOpenChange).toHaveBeenCalledOnce()
	})

	it('moves focus into the panel, handles Escape with current callbacks and restores focus', () => {
		const trigger = document.createElement('button')
		document.body.append(trigger)
		trigger.focus()
		const oldCallback = vi.fn(),
			currentCallback = vi.fn()

		const root = mount({ open: true, onOpenChange: oldCallback, drawer: <button>Close</button> })
		const panel = document.querySelector('.vx-drawer-panel')!
		expect(panel.contains(document.activeElement)).toBe(true)
		act(() =>
			root.render(Drawer, {
				open: true,
				onOpenChange: currentCallback,
				drawer: <button>Close</button>,
			}),
		)

		act(() => panel.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })))
		expect(currentCallback).toHaveBeenCalledWith(false)
		expect(oldCallback).not.toHaveBeenCalled()
		act(() => root.render(Drawer, { open: false }))
		expect(document.activeElement).toBe(trigger)
	})

	it('wraps keyboard focus in both directions while the main content is inert', () => {
		mount({
			defaultOpen: true,
			drawer: (
				<>
					<button>First</button>
					<button>Last</button>
				</>
			),
		})

		const [first, last] = document.querySelectorAll<HTMLButtonElement>('.vx-drawer-panel button')
		expect(document.querySelector('.vx-drawer-main')?.hasAttribute('inert')).toBe(true)
		act(() =>
			first.dispatchEvent(
				new KeyboardEvent('keydown', {
					key: 'Tab',
					shiftKey: true,
					bubbles: true,
					cancelable: true,
				}),
			),
		)

		expect(document.activeElement).toBe(last)
		act(() =>
			last.dispatchEvent(
				new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }),
			),
		)

		expect(document.activeElement).toBe(first)
	})
})
