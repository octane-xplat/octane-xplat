/** @jsxImportSource @nativescript-community/octane */
import { expect, it } from 'vitest'
import { useLayoutEffect, useState } from 'octane'
import {
	createObjectContainer,
	createObjectDriver,
	createUniversalRoot,
	flushUniversalSync,
} from 'octane/universal/native'

function Item(props: { id: string; version: number; events: string[] }) @{
	const [count, setCount] = useState(0)
	useLayoutEffect(() => {
		const id = props.id
		props.events.push(`mount:${id}`)
		return () => {
			props.events.push(`cleanup:${id}`)
		}
	}, [])

	<label text={`${props.id}:${count}:${props.version}`} onTap={() => setCount(count + 1)} />
}

function Items(props: { ids: string[]; version: number; events: string[] }) @{
	<masonview>
		{props.ids.map((id) => (
			<Item key={id} id={id} version={props.version} events={props.events} />
		))}
	</masonview>
}

it('retains keyed component state and hosts when a compiled map reorders', () => {
	const container = createObjectContainer('nativescript')
	const root = createUniversalRoot(container, createObjectDriver('nativescript'))
	const events: string[] = []
	try {
		root.render(Items, { ids: ['a', 'b'], version: 0, events })
		const [a, b] = container.children[0].children
		flushUniversalSync(() => container.dispatchEvent(a, 'tap', {}))
		expect(a.props.text).toBe('a:1:0')

		root.render(Items, { ids: ['b', 'a', 'c'], version: 1, events })
		expect(container.children[0].children[0]).toBe(b)
		expect(container.children[0].children[1]).toBe(a)
		expect(container.children[0].children.map((node) => node.props.text)).toEqual([
			'b:0:1',
			'a:1:1',
			'c:0:1',
		])

		expect(events).toEqual(['mount:a', 'mount:b', 'mount:c'])

		root.render(Items, { ids: ['a'], version: 2, events })
		expect(container.children[0].children[0]).toBe(a)
		expect(events.filter((event) => event.startsWith('cleanup:')).sort()).toEqual([
			'cleanup:b',
			'cleanup:c',
		])
	} finally {
		root.unmount()
	}

	expect(container.children).toEqual([])
	expect(events.filter((event) => event.startsWith('cleanup:')).sort()).toEqual([
		'cleanup:a',
		'cleanup:b',
		'cleanup:c',
	])
})
