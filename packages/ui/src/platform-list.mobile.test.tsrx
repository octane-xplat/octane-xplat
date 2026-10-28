/** @jsxImportSource @octane-xplat/jsx */
import { describe, expect, it, vi } from 'vitest'
import { createContext, useContext, useEffect } from 'octane'
import {
	createObjectContainer,
	createObjectDriver,
	createUniversalRoot,
	flushUniversalSync,
} from 'octane/universal/native'

vi.mock('@nativescript/core', () => ({
	ScrollView: class ScrollView {},
	GridLayout: class GridLayout {
		disposeNativeView() {}
	},
}))

vi.mock('./native-portal', () => ({ createPortal: (children: any) => children }))
vi.mock('./escape-props', () => ({ applyEscapeProps() {} }))
vi.mock('./refresh', () => ({ createPullToRefresh: vi.fn() }))
vi.mock('./ActivityIndicator.tsrx', () => ({ ActivityIndicator: () => null }))
vi.mock('./list-viewability-observer.ios', () => ({
	observeListViewability: () => ({ refresh() {}, dispose() {} }),
}))

vi.mock('./list-viewability-observer.android', () => ({
	observeListViewability: () => ({ refresh() {}, dispose() {} }),
}))

import { UITableView } from './ios/UITableView.ios.tsrx'
import { RecyclerView } from './android/RecyclerView.android.tsrx'

function createRoot() {
	const container = createObjectContainer('nativescript')
	const driver = createObjectDriver('nativescript')
	const listViews: Array<{
		scrollToIndex: ReturnType<typeof vi.fn>
		scrollToIndexAnimated: ReturnType<typeof vi.fn>
	}> = []

	const scrollToIndex = vi.fn()
	const scrollToIndexAnimated = vi.fn()
	const getPublicInstance = driver.getPublicInstance.bind(driver)
	driver.getPublicInstance = (host, id) => {
		const view: any = getPublicInstance(host, id)
		if (view?.type === 'listview') {
			view.scrollToIndex = scrollToIndex
			view.scrollToIndexAnimated = scrollToIndexAnimated
			listViews.push(view)
		}

		return view
	}

	return {
		root: createUniversalRoot(container, driver),
		container,
		listViews,
		scrollToIndex,
		scrollToIndexAnimated,
	}
}

describe('platform list handle', () => {
	it.each([
		['UITableView', UITableView],
		['RecyclerView', RecyclerView],
	] as const)('%s exposes a safe index handle and clears/replaces refs', async (_name, List) => {
		const { root, listViews } = createRoot()
		const first = { current: null as any }
		const next = { current: null as any }
		const props = { items: ['a', 'b'], renderItem: (_item: string) => null }
		try {
			flushUniversalSync(() => root.render(List, { ...props, initialScrollIndex: 1, ref: first }))
			expect(first.current).toEqual({ scrollToIndex: expect.any(Function) })
			await vi.waitFor(() => expect(listViews[0].scrollToIndex).toHaveBeenCalledWith(1))
			first.current.scrollToIndex(0)
			first.current.scrollToIndex(1, { animated: true })
			first.current.scrollToIndex(2)
			expect(listViews[0].scrollToIndex).toHaveBeenCalledWith(0)
			expect(listViews[0].scrollToIndexAnimated).toHaveBeenCalledWith(1)
			expect(listViews[0].scrollToIndex).toHaveBeenCalledTimes(2)
			flushUniversalSync(() => root.render(List, { ...props, ref: next }))
			expect(first.current).toBeNull()
			expect(next.current).toEqual({ scrollToIndex: expect.any(Function) })
		} finally {
			root.unmount()
		}

		expect(next.current).toBeNull()
	})

	it.each([
		['UITableView', UITableView],
		['RecyclerView', RecyclerView],
	] as const)(
		'%s restores deferred initial positions once and keeps them across page appends',
		async (_name, List) => {
			const { root, listViews } = createRoot()
			const props = { renderItem: (_item: string) => null }
			try {
				flushUniversalSync(() => root.render(List, { ...props, items: [], initialScrollIndex: 2 }))
				expect(listViews).toHaveLength(0)

				flushUniversalSync(() =>
					root.render(List, { ...props, items: ['a'], initialScrollIndex: 2 }),
				)

				expect(listViews).toHaveLength(1)
				expect(listViews[0].scrollToIndex).not.toHaveBeenCalled()

				flushUniversalSync(() =>
					root.render(List, { ...props, items: ['a', 'b', 'c'], initialScrollIndex: 2 }),
				)

				await vi.waitFor(() => expect(listViews[0].scrollToIndex).toHaveBeenCalledTimes(1))
				expect(listViews[0].scrollToIndex).toHaveBeenCalledWith(2)

				flushUniversalSync(() =>
					root.render(List, { ...props, items: ['a', 'b', 'c', 'd'], initialScrollIndex: 2 }),
				)

				expect(listViews[0].scrollToIndex).toHaveBeenCalledTimes(1)
			} finally {
				root.unmount()
			}
		},
	)
})

const CellName = createContext('missing')
const CellNameProvider: any = CellName
const cellSeen: string[] = []
let cellUnmounts = 0
function ContextRow(props: { item: string }) {
	const name = useContext(CellName)
	cellSeen.push(props.item + ':' + name)
	useEffect(
		() => () => {
			cellUnmounts++
		},
		[],
	)

	return <label text={props.item + ':' + name} />
}

const contextItems = ['first', 'second']
const renderContextItem = (item: string) => <ContextRow item={item} />
function ListContextWrapper(props: { value: string; List: any }) {
	const List = props.List
	return (
		<CellNameProvider value={props.value}>
			<List items={contextItems} renderItem={renderContextItem} />
		</CellNameProvider>
	)
}

it.each([
	['UITableView', UITableView],
	['RecyclerView', RecyclerView],
] as const)(
	'%s owns cell content in the source tree and releases disposed hosts',
	async (_name, List) => {
		cellSeen.length = 0
		cellUnmounts = 0
		const { root, listViews, container } = createRoot()
		try {
			flushUniversalSync(() => root.render(ListContextWrapper, { value: 'Avery', List }))
			const view: any = listViews[0]
			expect(view.props.renderItem).toBeUndefined()
			const binding: any = { index: 0 }
			flushUniversalSync(() => container.dispatchEvent(view, 'itemLoading', binding))
			await vi.waitFor(() => expect(cellSeen.at(-1)).toBe('first:Avery'))
			flushUniversalSync(() => root.render(ListContextWrapper, { value: 'Jordan', List }))
			await vi.waitFor(() => expect(cellSeen.at(-1)).toBe('first:Jordan'))
			binding.index = 1
			flushUniversalSync(() => container.dispatchEvent(view, 'itemLoading', binding))
			await vi.waitFor(() => expect(cellSeen.at(-1)).toBe('second:Jordan'))
			binding.view.disposeNativeView()
			await vi.waitFor(() => expect(cellUnmounts).toBe(1))
		} finally {
			root.unmount()
		}

		expect(cellUnmounts).toBe(1)
	},
)
