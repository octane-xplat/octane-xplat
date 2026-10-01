/** @jsxImportSource @nativescript-community/octane */
import { useState } from 'octane'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createObjectContainer, createObjectDriver, createUniversalRoot } from 'octane/universal/native'
import { VirtualList } from './VirtualList.tsrx'
import { VirtualListSizeIndex } from './virtual-list-layout'

vi.mock('@nativescript/core', () => ({ isAndroid: true, isIOS: false }))

const items = Array.from({ length: 500 }, (_, index) => ({ id: 'r' + index }))
const keyExtractor = (item: { id: string }) => item.id
const renderItem = (item: { id: string }) => <label id={'row-' + item.id} text={item.id} />
function StatefulRow(props: { id: string }) @{
	const [taps, setTaps] = useState(0)

	<label id={'row-' + props.id} text={props.id + ':' + taps} onTap={() => setTaps(taps + 1)} />
}

const renderStatefulItem = (item: { id: string }) => <StatefulRow id={item.id} />

const roots: { unmount: () => void }[] = []

function collect(nodes: any[]): any[] {
	return nodes.flatMap((node) => [node, ...collect(node.children ?? [])])
}

async function mount(viewportWidth = 100, itemRenderer = renderItem) {
	vi.useFakeTimers()
	const container = createObjectContainer('nativescript')
	const driver = createObjectDriver('nativescript')
	const commits: any[] = []
	const prepare = driver.prepareBatch
	driver.prepareBatch = (...args) => {
		commits.push(args[1])
		return prepare(...args)
	}

	const root = createUniversalRoot(container, driver)
	roots.push(root)
	root.render(VirtualList as any, { items, keyExtractor, renderItem: itemRenderer })
	const scroll: any = container.children[0]
	scroll.verticalOffset = 0
	scroll.getActualSize = () => ({ width: viewportWidth, height: 200 })
	scroll.scrollToVerticalOffset = vi.fn((offset) => { scroll.verticalOffset = offset })
	container.dispatchEvent(scroll, 'loaded', { object: scroll })
	const content = scroll.children[0]
	content.getActualSize = () => ({ width: 100, height: 500 * 48 })
	container.dispatchEvent(content, 'layoutchanged', { object: content })
	await vi.advanceTimersByTimeAsync(32)
	scroll.scrollToVerticalOffset.mockClear()
	commits.length = 0
	const move = (offset: number) => {
		scroll.verticalOffset = offset
		container.dispatchEvent(scroll, 'scroll', { object: scroll })
	}

	const measure = (id: string, height: number, emit = true) => {
		const row = collect(container.children).find((node) =>
			String(node.props.className).split(' ').includes('vx-virtual-list-row') && collect(node.children).some((child) => child.props.id === id),
		)

		if (!row) throw new Error('Missing row ' + id)
		row.getActualSize = () => ({ width: 100, height })
		if (emit) container.dispatchEvent(row, 'layoutchanged', { object: row })
	}

	return { container, root, scroll, commits, move, measure }
}

afterEach(() => {
	for (const root of roots.splice(0)) root.unmount()
	vi.useRealTimers()
	vi.unstubAllGlobals()
	vi.restoreAllMocks()
})

describe('native VirtualList scroll and measurement scheduling', () => {
	it('does not restore an obsolete anchor after the user advances during measurement', async () => {
		const { scroll, move, measure } = await mount()
		move(480)
		await vi.advanceTimersByTimeAsync(32)
		scroll.scrollToVerticalOffset.mockClear()
		measure('row-r16', 60)
		await Promise.resolve()
		move(492)
		await vi.advanceTimersByTimeAsync(32)
		expect(scroll.verticalOffset).toBe(492)
		expect(scroll.scrollToVerticalOffset).not.toHaveBeenCalled()
	})

	it('applies an above-anchor height correction while preserving user movement', async () => {
		const { scroll, move, measure } = await mount()
		move(480)
		await vi.advanceTimersByTimeAsync(32)
		measure('row-r5', 60)
		move(492)
		await vi.advanceTimersByTimeAsync(32)
		expect(scroll.verticalOffset).toBe(504)
	})

	it('coalesces a scroll burst instead of committing inside each native callback', async () => {
		const { commits, move } = await mount()
		move(240)
		move(288)
		move(336)
		expect(commits).toHaveLength(0)
		await vi.advanceTimersByTimeAsync(32)
		expect(commits).toHaveLength(1)
	})

	it('does not rebuild unvisited estimates when another sample preserves the type average', async () => {
		const reset = vi.spyOn(VirtualListSizeIndex.prototype, 'reset')
		const { measure } = await mount()
		for (let index = 0; index < 4; index++) measure('row-r' + index, 36 + index * 12)
		await vi.advanceTimersByTimeAsync(180)
		const count = reset.mock.calls.length
		for (let index = 4; index < 8; index++) measure('row-r' + index, 36 + (index % 4) * 12)
		await vi.advanceTimersByTimeAsync(180)
		expect(reset).toHaveBeenCalledTimes(count)
	})

	it('retains exact row sizes when borders make content narrower than the viewport', async () => {
		const { scroll, move, measure } = await mount(102)
		for (let index = 0; index < 4; index++) measure('row-r' + index, 36 + index * 12)
		await vi.advanceTimersByTimeAsync(180)
		move(200)
		await vi.advanceTimersByTimeAsync(32)
		scroll.scrollToVerticalOffset.mockClear()
		measure('row-r0', 36)
		await vi.advanceTimersByTimeAsync(180)
		expect(scroll.verticalOffset).toBe(200)
		expect(scroll.scrollToVerticalOffset).not.toHaveBeenCalled()
	})

	it('rejects a queued measurement after the keyed item is replaced', async () => {
		const { root, scroll, move, measure } = await mount()
		move(480)
		await vi.advanceTimersByTimeAsync(32)
		measure('row-r5', 120)
		const replacement = items.map((item, index) => index === 5 ? { ...item } : item)
		root.render(VirtualList as any, { items: replacement, keyExtractor, renderItem })
		// The replacement has its own current geometry; the queued 120-height result is obsolete.
		measure('row-r5', 48, false)
		await vi.advanceTimersByTimeAsync(32)
		expect(scroll.verticalOffset).toBe(480)
	})

	it('commits a burst of row measurements together', async () => {
		const { commits, move, measure } = await mount()
		move(480)
		await vi.advanceTimersByTimeAsync(32)
		commits.length = 0
		measure('row-r12', 60)
		measure('row-r13', 72)
		measure('row-r14', 84)
		expect(commits).toHaveLength(0)
		await vi.advanceTimersByTimeAsync(32)
		expect(commits).toHaveLength(1)
	})

	it('coalesces through native animation frames and cancels a pending frame on disposal', async () => {
		const { root, commits, move } = await mount()
		vi.stubGlobal('requestAnimationFrame', (callback: (time: number) => void) => setTimeout(() => callback(Date.now()), 8))
		const cancel = vi.fn((id: ReturnType<typeof setTimeout>) => clearTimeout(id))
		vi.stubGlobal('cancelAnimationFrame', cancel)
		move(240)
		move(288)
		expect(commits).toHaveLength(0)
		await vi.advanceTimersByTimeAsync(32)
		expect(commits).toHaveLength(1)
		move(480)
		await vi.advanceTimersByTimeAsync(8)
		root.unmount()
		await vi.advanceTimersByTimeAsync(0)
		expect(cancel).toHaveBeenCalled()
		const count = commits.length
		await vi.advanceTimersByTimeAsync(32)
		expect(commits).toHaveLength(count)
	})

	it('keeps physical hosts alive on reassignment and destroys them on disposal', async () => {
		const { container, root, move } = await mount()
		const cells = collect(container.children).filter((node) => String(node.props.className).split(' ').includes('vx-virtual-list-cell'))
		expect(cells.length).toBeGreaterThan(0)
		for (const cell of cells) cell.destroyNode = vi.fn()
		move(480)
		await vi.advanceTimersByTimeAsync(32)
		for (const cell of cells) {
			expect(cell.reusable).toBe(true)
			expect(cell.destroyNode).not.toHaveBeenCalled()
		}

		root.unmount()
		await vi.advanceTimersByTimeAsync(0)
		for (const cell of cells) expect(cell.destroyNode).toHaveBeenCalledWith(true)
	})

	it('retains keyed state across prepend and resets it after leaving the window', async () => {
		const { container, root, scroll, move } = await mount(100, renderStatefulItem)
		move(480)
		await vi.advanceTimersByTimeAsync(32)
		const findRow = () => collect(container.children).find((node) => node.props.id === 'row-r10')
		const row = findRow()
		container.dispatchEvent(row, 'tap', { object: row })
		expect(findRow().props.text).toBe('r10:1')
		const prepended = [{ id: 'prepended' }, ...items]
		root.render(VirtualList as any, { items: prepended, keyExtractor, renderItem: renderStatefulItem })
		await vi.advanceTimersByTimeAsync(32)
		expect(scroll.verticalOffset).toBe(528)
		expect(findRow()).toBe(row)
		expect(findRow().props.text).toBe('r10:1')
		move(4000)
		await vi.advanceTimersByTimeAsync(32)
		expect(findRow()).toBeUndefined()
		for (const visible of collect(container.children).filter((node) => /^row-r/.test(String(node.props.id)))) {
			expect(visible.props.text).toMatch(/:0$/)
		}

		move(528)
		await vi.advanceTimersByTimeAsync(32)
		expect(findRow().props.text).toBe('r10:0')
	})

	it('cancels queued work when the list is disposed', async () => {
		const { root, commits, move } = await mount()
		move(480)
		root.unmount()
		const count = commits.length
		await vi.advanceTimersByTimeAsync(100)
		expect(commits).toHaveLength(count)
	})
})
