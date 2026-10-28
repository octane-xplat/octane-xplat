// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { act, createRoot } from 'octane'
import { useListData, type ListData } from './use-list-data'

// DOM-renderer counterpart to use-list-data.mobile.test.tsrx — the hook
// subscribes through useStore and mutator commits re-render the reader.

let list: ListData<{ name: string }>

function Reader() @{
	const data = useListData<{ name: string }>({
		initialItems: [{ name: 'a' }, { name: 'b' }],
		getKey: (item) => item.name,
	})

	list = data

	<span class="items">{data.items.map((item) => item.name).join(',')}</span>
}

describe('useListData (DOM renderer)', () => {
	it('re-renders on mutator commits', () => {
		const el = document.createElement('div')
		document.body.appendChild(el)
		const root = createRoot(el)
		act(() => root.render(<Reader />))
		expect(el.querySelector('.items')!.textContent).toBe('a,b')

		act(() => list.append({ name: 'c' }))
		expect(el.querySelector('.items')!.textContent).toBe('a,b,c')

		act(() => list.remove('a'))
		expect(el.querySelector('.items')!.textContent).toBe('b,c')
		root.unmount()
		el.remove()
	})
})
