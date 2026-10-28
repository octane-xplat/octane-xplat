// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, createRoot } from 'octane'
import { Pager } from './Pager.web.tsrx'

// jsdom has no layout — clientWidth is always 0 — so the leaf's scroll math
// is exercised against a stubbed page width. scrollTo is unimplemented in
// jsdom; the stub records controlled-page writes.

const items = ['a', 'b', 'c']
const renderItem = (item: string) => <span class="pg">{item}</span>

function mount(extra: any = {}) {
	const el = document.createElement('div')
	document.body.appendChild(el)
	const root = createRoot(el)
	act(() => root.render(<Pager items={items} renderItem={renderItem} {...extra} />))
	const pager = el.querySelector('.vx-pager') as any
	Object.defineProperty(pager, 'clientWidth', { value: 100, configurable: true })
	pager.scrollTo = vi.fn((opts: any) => {
		pager.scrollLeft = opts.left
		pager.dispatchEvent(new Event('scroll'))
	})

	return { el, root, pager }
}

describe('Pager (web leaf)', () => {
	afterEach(() => {
		vi.useRealTimers()
	})

	it('renders one snap page per item, plus renderEmpty', () => {
		const { el, root, pager } = mount()
		expect(pager.className).toContain('vx-pager')
		expect(el.querySelectorAll('.vx-pager-page')).toHaveLength(3)
		expect(el.querySelectorAll('.pg')).toHaveLength(3)
		root.unmount()
		el.remove()
	})

	it('fires onPageChange once the scroll settles', () => {
		vi.useFakeTimers()
		const onPageChange = vi.fn()
		const { el, root, pager } = mount({ onPageChange })
		pager.scrollLeft = 200
		pager.dispatchEvent(new Event('scroll'))
		vi.advanceTimersByTime(200)
		expect(onPageChange).toHaveBeenCalledTimes(1)
		expect(onPageChange).toHaveBeenCalledWith(2)
		root.unmount()
		el.remove()
	})

	it('wires each host after empty states and cancels detached-host work', () => {
		vi.useFakeTimers()
		const width = vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(100)
		const onPageChange = vi.fn()
		const el = document.createElement('div')
		const root = createRoot(el)
		const render = (values: string[], page?: number) =>
			act(() =>
				root.render(
					<Pager
						items={values}
						renderItem={renderItem}
						defaultPage={1}
						page={page}
						onPageChange={onPageChange}
					/>,
				),
			)

		try {
			render([])
			render(items)
			const first = el.querySelector('.vx-pager') as HTMLElement
			expect(first.scrollLeft).toBe(100)
			first.scrollLeft = 200
			first.dispatchEvent(new Event('scroll'))
			render([])
			vi.advanceTimersByTime(200)
			expect(onPageChange).not.toHaveBeenCalled()
			render(items, 2)
			const second = el.querySelector('.vx-pager') as HTMLElement
			expect(second).not.toBe(first)
			expect(second.scrollLeft).toBe(200)
			second.scrollLeft = 0
			second.dispatchEvent(new Event('scroll'))
			vi.advanceTimersByTime(200)
			expect(onPageChange).toHaveBeenCalledExactlyOnceWith(0)
			first.dispatchEvent(new Event('scroll'))
			expect(vi.getTimerCount()).toBe(0)
		} finally {
			root.unmount()
			width.mockRestore()
		}
	})

	it('suppresses the echo of its own controlled writes', () => {
		vi.useFakeTimers()
		const onPageChange = vi.fn()
		const el = document.createElement('div')
		document.body.appendChild(el)
		const root = createRoot(el)
		const set = { page: 0 }
		function Host() @{
			<Pager items={items} renderItem={renderItem} page={set.page} onPageChange={onPageChange} />
		}

		act(() => root.render(<Host />))
		const pager = el.querySelector('.vx-pager') as any
		Object.defineProperty(pager, 'clientWidth', { value: 100, configurable: true })
		pager.scrollTo = vi.fn((opts: any) => {
			pager.scrollLeft = opts.left
			pager.dispatchEvent(new Event('scroll'))
		})

		set.page = 1
		act(() => root.render(<Host />))
		expect(pager.scrollTo).toHaveBeenCalledWith({ left: 100, behavior: 'smooth' })
		vi.advanceTimersByTime(200)
		// The programmatic scroll must not report back as a user swipe.
		expect(onPageChange).not.toHaveBeenCalled()
		root.unmount()
		el.remove()
	})
})
