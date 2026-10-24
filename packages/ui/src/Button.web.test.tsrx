// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, createRoot } from 'octane'
import { Button } from './Button.web.tsrx'

const roots: any[] = []
function mount(props: any = {}) {
	const el = document.createElement('div')
	document.body.append(el)
	const root = createRoot(el)
	roots.push(root)
	act(() => root.render(<Button {...props} />))
	return el.firstElementChild as HTMLElement
}

const click = (host: Element) => act(() => host.dispatchEvent(new MouseEvent('click', { bubbles: true })))

afterEach(() => {
	for (const root of roots.splice(0)) act(() => root.unmount())
	document.body.innerHTML = ''
	vi.useRealTimers()
})

describe('Button clickAction failure reporting', () => {
	it('reports a rejected clickAction through onActionError and clears pending', async () => {
		const error = new Error('save failed')
		const onActionError = vi.fn()
		let rejectAction: ((reason: unknown) => void) | undefined
		const host = mount({
			label: 'Save',
			clickAction: () => new Promise<void>((_, reject) => { rejectAction = reject }),
			onActionError,
		})

		click(host)
		expect(host.classList.contains('vx-button--loading')).toBe(true)

		await act(async () => {
			rejectAction!(error)
			await Promise.resolve()
		})

		expect(onActionError).toHaveBeenCalledWith(error)
		expect(host.classList.contains('vx-button--loading')).toBe(false)
	})

	it('reports a synchronous clickAction throw through onActionError', () => {
		const error = new Error('sync failure')
		const onActionError = vi.fn()
		const host = mount({
			label: 'Save',
			clickAction: () => {
				throw error
			},
			onActionError,
		})

		click(host)
		expect(onActionError).toHaveBeenCalledWith(error)
	})

	it('surfaces an unhandled failure as an uncaught error when no handler is set', async () => {
		vi.useFakeTimers()
		const error = new Error('unhandled failure')
		let rejectAction: ((reason: unknown) => void) | undefined
		const host = mount({
			label: 'Save',
			clickAction: () => new Promise<void>((_, reject) => { rejectAction = reject }),
		})

		click(host)
		await act(async () => {
			rejectAction!(error)
			await Promise.resolve()
		})

		expect(() => vi.advanceTimersByTime(0)).toThrow(error)
	})
})

describe('Button tooltip title attribute', () => {
	it('does not stringify an absent tooltip into a title attribute', () => {
		const host = mount({ label: 'Save' })
		expect(host.hasAttribute('title')).toBe(false)
		expect(host.getAttribute('title')).toBe(null)
	})

	it('sets title from tooltip and clears it when the tooltip is removed', () => {
		const el = document.createElement('div')
		document.body.append(el)
		const root = createRoot(el)
		roots.push(root)
		act(() => root.render(<Button label="Save" tooltip="Save the document" />))
		const host = el.firstElementChild as HTMLElement
		expect(host.getAttribute('title')).toBe('Save the document')

		act(() => root.render(<Button label="Save" />))
		expect(host.hasAttribute('title')).toBe(false)
	})
})

describe('Button loading/pending semantics', () => {
	it('exposes aria-busy, disabled, preserved name, and a live Loading status while isLoading', () => {
		const host = mount({ label: 'Save', isLoading: true }) as HTMLButtonElement
		expect(host.getAttribute('aria-busy')).toBe('true')
		expect(host.disabled).toBe(true)
		expect(host.getAttribute('aria-label')).toBe('Save')
		const content = host.querySelector('.vx-button-content')!
		expect(content.classList.contains('vx-button-content--hidden')).toBe(true)
		expect(content.getAttribute('aria-hidden')).toBe('true')
		expect(content.textContent).toContain('Save')
		expect(host.querySelector('.vx-button-spinner')).not.toBe(null)
		const status = host.querySelector('[role="status"][aria-live="polite"]')!
		expect(status.getAttribute('aria-live')).toBe('polite')
		expect(status.textContent).toBe('Loading')
	})

	it('reports an in-flight clickAction as busy and blocked until it settles', async () => {
		let resolveAction: (() => void) | undefined
		const host = mount({
			label: 'Save',
			clickAction: () => new Promise<void>((resolve) => { resolveAction = resolve }),
		})

		click(host)
		expect(host.getAttribute('aria-busy')).toBe('true')
		expect((host as HTMLButtonElement).disabled).toBe(true)
		expect(host.querySelector('[role="status"][aria-live="polite"]')!.textContent).toBe('Loading')

		await act(async () => {
			resolveAction!()
			await Promise.resolve()
		})
		expect(host.getAttribute('aria-busy')).toBe(null)
		expect((host as HTMLButtonElement).disabled).toBe(false)
		expect(host.querySelector('[role="status"][aria-live="polite"]')!.textContent).toBe('')
	})

	it('keeps an interruptible loading button enabled but still busy', () => {
		const host = mount({ label: 'Save', isLoading: true, isInterruptible: true }) as HTMLButtonElement
		expect(host.getAttribute('aria-busy')).toBe('true')
		expect(host.disabled).toBe(false)
	})

	it('renders an empty status region when idle', () => {
		const host = mount({ label: 'Save' })
		const status = host.querySelector('[role="status"][aria-live="polite"]')!
		expect(status.textContent).toBe('')
	})
})

describe('Button renders a native button element', () => {
	it('renders <button type="button">, not a role-button div', () => {
		const host = mount({ label: 'Save' })
		expect(host.tagName).toBe('BUTTON')
		expect(host.getAttribute('type')).toBe('button')
		expect(host.getAttribute('role')).toBe(null)
		expect(host.getAttribute('tabindex')).toBe(null)
	})

	it.each(['Enter', ' '])('activates once per %s keypress through native click', (key) => {
		const action = vi.fn()
		const host = mount({ label: 'Save', clickAction: action })
		const type = key === 'Enter' ? 'keydown' : 'keyup'
		// Native buttons fire click for Enter (keydown) and Space (keyup);
		// jsdom does not synthesize it, so dispatch click as the browser would.
		act(() => {
			host.dispatchEvent(new KeyboardEvent(type, { key, bubbles: true, cancelable: true }))
			host.dispatchEvent(new MouseEvent('click', { bubbles: true }))
		})
		expect(action).toHaveBeenCalledTimes(1)
	})

	it('activates once on pointer click', () => {
		const action = vi.fn()
		const host = mount({ label: 'Save', clickAction: action })
		click(host)
		expect(action).toHaveBeenCalledTimes(1)
	})

	it('disabled renders the native attribute and does not activate', () => {
		const action = vi.fn()
		const host = mount({ label: 'Save', isDisabled: true, clickAction: action }) as HTMLButtonElement
		expect(host.disabled).toBe(true)
		expect(host.getAttribute('aria-disabled')).toBe(null)
		click(host)
		expect(action).not.toHaveBeenCalled()
	})

	it('disabled + tooltip uses aria-disabled and stays focusable', () => {
		const action = vi.fn()
		const host = mount({ label: 'Save', isDisabled: true, tooltip: 'Unavailable', clickAction: action }) as HTMLButtonElement
		expect(host.disabled).toBe(false)
		expect(host.getAttribute('aria-disabled')).toBe('true')
		click(host)
		expect(action).not.toHaveBeenCalled()
	})

	it('still exposes aria-busy while pending on the native element', async () => {
		let resolveAction: (() => void) | undefined
		const host = mount({
			label: 'Save',
			clickAction: () => new Promise<void>((resolve) => { resolveAction = resolve }),
		}) as HTMLButtonElement

		click(host)
		expect(host.tagName).toBe('BUTTON')
		expect(host.getAttribute('aria-busy')).toBe('true')
		expect(host.disabled).toBe(true)

		await act(async () => {
			resolveAction!()
			await Promise.resolve()
		})
		expect(host.getAttribute('aria-busy')).toBe(null)
		expect(host.disabled).toBe(false)
	})
})
