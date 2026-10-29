import { describe, expect, it } from 'vitest'
import {
	createObjectContainer,
	createObjectDriver,
	createUniversalRoot,
	defineUniversalComponent,
	flushUniversalSync,
	universalComponent,
	universalPlan,
	universalValue,
} from 'octane/universal/native'

import { useListData, type ListData } from './use-list-data'

// Universal-renderer counterpart to use-list-data.web.test.tsrx — mutator
// commits re-render the subscriber through useStore on the object driver.

const labelPlan = universalPlan('object', {
	kind: 'host',
	type: 'label',
	bindings: [['value', 0]],
})

const label = (value: string) => universalValue(labelPlan, [value])

let list: ListData<{ name: string }>

const Reader = defineUniversalComponent('object', () => {
	const data = useListData<{ name: string }>({
		initialItems: [{ name: 'a' }, { name: 'b' }],
		getKey: (item) => item.name,
	})

	list = data
	return label(data.items.map((item) => item.name).join(','))
})

describe('useListData (universal renderer)', () => {
	it('re-renders on mutator commits', () => {
		const container = createObjectContainer()
		const root = createUniversalRoot(container, createObjectDriver())
		root.render(Reader, {})
		expect(container.children[0].props.value).toBe('a,b')

		flushUniversalSync(() => list.append({ name: 'c' }))
		expect(container.children[0].props.value).toBe('a,b,c')

		flushUniversalSync(() => list.remove('a'))
		expect(container.children[0].props.value).toBe('b,c')
		root.unmount()
	})
})
