import { describe, expect, it } from 'vitest'

import { createTreeData, type TreeData, type TreeNode } from './tree-data'

interface Value {
	name: string
	items?: Value[]
}

const data = (
	initialItems: Value[] = [],
	options: Parameters<typeof createTreeData<Value>>[0] = {},
): TreeData<Value> =>
	createTreeData({
		initialItems,
		getKey: (item) => item.name,
		getChildren: (item) => item.items ?? [],
		...options,
	})

const outline = (nodes: TreeNode<Value>[]): string[] =>
	nodes.map((node) => `${node.value.name}(${outline(node.children).join(',')})`)

describe('createTreeData', () => {
	it('builds nodes with keys, parents, and children', () => {
		const tree = data([{ name: 'a', items: [{ name: 'a1' }] }, { name: 'b' }])

		expect(outline(tree.items)).toEqual(['a(a1())', 'b()'])
		expect(tree.getItem('a1')?.parentKey).toBe('a')
		expect(tree.getChildren('a').map((n) => n.key)).toEqual(['a1'])
		expect(tree.getChildren(null).map((n) => n.key)).toEqual(['a', 'b'])
	})

	it('inserts into the root and into parents', () => {
		const tree = data([{ name: 'a', items: [{ name: 'a1' }] }])
		tree.insert(null, 1, { name: 'b' })
		expect(outline(tree.items)).toEqual(['a(a1())', 'b()'])
		tree.insert('a', 1, { name: 'a2' })
		expect(outline(tree.items)).toEqual(['a(a1(),a2())', 'b()'])
		tree.append('a', { name: 'a3' })
		tree.prepend(null, { name: 'z' })
		expect(outline(tree.items)).toEqual(['z()', 'a(a1(),a2(),a3())', 'b()'])
	})

	it('inserts before and after sibling keys', () => {
		const tree = data([{ name: 'a', items: [{ name: 'a1' }, { name: 'a3' }] }])
		tree.insertBefore('a3', { name: 'a2' })
		tree.insertAfter('a1', { name: 'a1b' })
		expect(outline(tree.items)).toEqual(['a(a1(),a1b(),a2(),a3())'])
	})

	it('removes subtrees and prunes descendants from selection', () => {
		const tree = data(
			[{ name: 'a', items: [{ name: 'a1', items: [{ name: 'a1x' }] }] }, { name: 'b' }],
			{ initialSelectedKeys: ['a1x', 'b'] },
		)

		tree.remove('a1')
		expect(outline(tree.items)).toEqual(['a()', 'b()'])
		expect([...(tree.selectedKeys as Set<string>)]).toEqual(['b'])
	})

	it('moves nodes across parents and to the root', () => {
		const tree = data([
			{ name: 'a', items: [{ name: 'a1' }, { name: 'a2' }] },
			{ name: 'b', items: [{ name: 'b1' }] },
		])

		tree.move('a1', 'b', 0)
		expect(outline(tree.items)).toEqual(['a(a2())', 'b(a1(),b1())'])
		expect(tree.getItem('a1')?.parentKey).toBe('b')
		tree.move('b1', null, 0)
		expect(outline(tree.items)).toEqual(['b1()', 'a(a2())', 'b(a1())'])
		expect(tree.getItem('b1')?.parentKey).toBeNull()
	})

	it('rebuilds a node on update, re-deriving children', () => {
		const tree = data([{ name: 'a', items: [{ name: 'a1' }] }])
		tree.update('a', { name: 'a', items: [{ name: 'x' }, { name: 'y' }] })
		expect(outline(tree.items)).toEqual(['a(x(),y())'])
	})
})
