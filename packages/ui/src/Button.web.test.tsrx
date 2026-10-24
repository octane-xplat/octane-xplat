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
		const host = mount({ label: 'Save', isLoading: true })
		expect(host.getAttribute('aria-busy')).toBe('true')
		expect(host.getAttribute('aria-disabled')).toBe('true')
		expect(host.getAttribute('aria-label')).toBe('Save')
		const content = host.querySelector('.vx-button-content')!
		expect(content.classList.contains('vx-button-content--hidden')).toBe(true)
		expect(content.getAttribute('aria-hidden')).toBe('true')
		expect(content.textContent).toContain('Save')
		expect(host.querySelector('.vx-button-spinner')).not.toBe(null)
		const status = host.querySelector('[role="status"]')!
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
		expect(host.getAttribute('aria-disabled')).toBe('true')
		expect(host.querySelector('[role="status"]')!.textContent).toBe('Loading')

		await act(async () => {
			resolveAction!()
			await Promise.resolve()
		})
		expect(host.getAttribute('aria-busy')).toBe(null)
		expect(host.getAttribute('aria-disabled')).toBe(null)
		expect(host.querySelector('[role="status"]')!.textContent).toBe('')
	})

	it('keeps an interruptible loading button enabled but still busy', () => {
		const host = mount({ label: 'Save', isLoading: true, isInterruptible: true })
		expect(host.getAttribute('aria-busy')).toBe('true')
		expect(host.getAttribute('aria-disabled')).toBe(null)
	})

	it('renders an empty status region when idle', () => {
		const host = mount({ label: 'Save' })
		const status = host.querySelector('[role="status"]')!
		expect(status.textContent).toBe('')
	})
})
