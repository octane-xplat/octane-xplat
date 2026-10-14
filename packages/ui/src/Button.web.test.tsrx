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
