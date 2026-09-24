import { describe, expect, it } from 'vitest'
import {
	createContext,
	createObjectContainer,
	createObjectDriver,
	createUniversalRoot,
	defineUniversalComponent,
	flushUniversalSync,
	universalComponent,
	universalPlan,
	universalValue,
	useContext,
} from 'octane/universal/native'

import { createStore } from './store'
import { useStore } from './use-store'

// Universal-runtime scheduler semantics, exercised through the object driver
// (the same retain/dirty-epoch path the NativeScript driver runs). These tests
// pin the deliberate divergence from the DOM renderer: a re-rendering parent
// retains children whose props are shallow-unchanged, so module-store reads
// only refresh in components that subscribe themselves — via useStore.

const labelPlan = universalPlan('object', {
	kind: 'host',
	type: 'label',
	bindings: [['value', 0]],
})

const label = (value: string) => universalValue(labelPlan, [value])
const texts = (container: ReturnType<typeof createObjectContainer>) =>
	container.children.map((c: any) => c.props.value)

function objectRoot() {
	const container = createObjectContainer()
	return { container, root: createUniversalRoot(container, createObjectDriver()) }
}

describe('universal renderer — store reads under parent re-render', () => {
	it('refreshes a child that reads the store through useStore', () => {
		const store = createStore(0)
		const Child = defineUniversalComponent('object', () => label(`child:${useStore(store)}`))
		const Parent = defineUniversalComponent('object', () => {
			useStore(store)
			return [universalComponent('object', Child, { stable: 'same' }), label('parent')]
		})

		const { container, root } = objectRoot()
		root.render(Parent, {})
		expect(texts(container)).toEqual(['child:0', 'parent'])

		flushUniversalSync(() => store.set(1))
		expect(texts(container)).toEqual(['child:1', 'parent'])
		root.unmount()
	})

	it('retains a child that reads the store bare — the divergence useStore fixes', () => {
		const store = createStore(0)
		const renders = { bare: 0, propDriven: 0 }
		// Bare read: no subscription — a retained child never re-runs.
		const BareChild = defineUniversalComponent('object', () => {
			renders.bare++
			return label(`bare:${store.get()}`)
		})

		// Control: a child whose PROPS change still re-renders normally.
		const PropChild = defineUniversalComponent('object', (props: { tick: number }) => {
			renders.propDriven++
			return label(`prop:${props.tick}`)
		})

		const Parent = defineUniversalComponent('object', (props: { tick: number }) => {
			useStore(store)
			return [
				universalComponent('object', BareChild, { stable: 'same' }),
				universalComponent('object', PropChild, { tick: props.tick }),
			]
		})

		const { container, root } = objectRoot()
		root.render(Parent, { tick: 0 })
		expect(texts(container)).toEqual(['bare:0', 'prop:0'])

		// Store write: parent re-renders, bare-read child is retained → stale.
		flushUniversalSync(() => store.set(1))
		expect(renders.bare).toBe(1)
		expect(texts(container)).toEqual(['bare:0', 'prop:0'])

		// Changed props still re-render the same child — retention keys on
		// shallow-equal props, not on component identity alone.
		root.render(Parent, { tick: 1 })
		expect(renders.propDriven).toBe(2)
		expect(renders.bare).toBe(1)
		expect(texts(container)).toEqual(['bare:0', 'prop:1'])
		root.unmount()
	})

	it('re-renders a retained child when its consumed context changes', () => {
		const Theme = createContext('light')
		const renders = { ctx: 0, plain: 0 }
		const CtxChild = defineUniversalComponent('object', () => {
			renders.ctx++
			return label(`ctx:${useContext(Theme)}`)
		})

		const PlainChild = defineUniversalComponent('object', () => {
			renders.plain++
			return label('plain')
		})

		const Parent = defineUniversalComponent('object', (props: { theme: string }) => [
			universalComponent('object', Theme, {
				value: props.theme,
				children: universalComponent('object', CtxChild, { stable: 'same' }),
			}),
			universalComponent('object', PlainChild, { stable: 'same' }),
		])

		const { container, root } = objectRoot()
		root.render(Parent, { theme: 'light' })
		expect(texts(container)).toEqual(['ctx:light', 'plain'])

		// Changed provider value defeats retention for consumers only.
		root.render(Parent, { theme: 'dark' })
		expect(renders.ctx).toBe(2)
		expect(renders.plain).toBe(1)
		expect(texts(container)).toEqual(['ctx:dark', 'plain'])
		root.unmount()
	})

	it('useStore with a selector re-renders only when the slice changes', () => {
		const store = createStore({ a: 0, b: 0 })
		const renders = { a: 0 }
		const Child = defineUniversalComponent('object', () => {
			renders.a++
			return label(`a:${useStore(store, (s) => s.a)}`)
		})

		const { container, root } = objectRoot()
		root.render(Child, {})
		expect(texts(container)).toEqual(['a:0'])

		flushUniversalSync(() => store.set({ a: 0, b: 1 }))
		expect(renders.a).toBe(1) // slice unchanged → no re-render
		flushUniversalSync(() => store.set({ a: 2, b: 1 }))
		expect(texts(container)).toEqual(['a:2'])
		root.unmount()
	})
})
