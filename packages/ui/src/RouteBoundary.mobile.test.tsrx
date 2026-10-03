/** @jsxImportSource @nativescript-community/octane */
import { describe, expect, it } from 'vitest'
import {
	createObjectContainer,
	createObjectDriver,
	createUniversalRoot,
} from 'octane/universal/native'

import { RouteBoundary } from './RouteBoundary.tsrx'

const route = { stack: 'root', name: 'boom', params: { id: 'x' } }
const seen: { props?: any } = {}
let fail = true

function Boundary(props: any) @{
	seen.props = props

	<label text={'failed: ' + String(props.error?.message ?? props.error)} />
}

function Boom() @{
	throw new Error('screen blew up')
}

function MaybeBoom() @{
	if (fail) {
		throw new Error('boom')
	}

	<label text="recovered" />
}

function Host(props: { boundary?: any; which?: 'fine' | 'boom' | 'maybe' }) @{
	<RouteBoundary boundary={props.boundary} route={route}>
		@if (props.which === 'boom') {
			<Boom />
		} @else if (props.which === 'maybe') {
			<MaybeBoom />
		} @else {
			<label text="fine" />
		}
	</RouteBoundary>
}

function mount(which: 'fine' | 'boom' | 'maybe', boundary?: any) {
	const container = createObjectContainer('nativescript')
	const root = createUniversalRoot(container, createObjectDriver('nativescript'))
	root.render(Host as any, { which, boundary })
	return container
}

// Walk the object-driver host tree for a label carrying a marker string.
function texts(node: any, out: string[] = []): string[] {
	if (typeof node?.props?.text === 'string') {
		out.push(node.props.text)
	}

	for (const child of node?.children ?? []) {
		texts(child, out)
	}

	return out
}

describe('route boundary on the universal renderer', () => {
	it('renders children untouched when no boundary is declared', () => {
		const container = mount('fine')
		expect(texts(container)).toContain('fine')
	})

	it('renders the declared boundary with error and route when the subtree throws', () => {
		const container = mount('boom', Boundary)
		expect(seen.props.error).toBeInstanceOf(Error)
		expect(seen.props.route).toBe(route)
		expect(seen.props.reset).toBeTypeOf('function')
		expect(texts(container)).toContain('failed: screen blew up')
	})

	it('reset remounts the route subtree', async () => {
		fail = true
		const container = mount('maybe', Boundary)
		expect(texts(container)).toContain('failed: boom')

		fail = false
		seen.props.reset()
		await new Promise((resolve) => setTimeout(resolve, 0))
		expect(texts(container)).toContain('recovered')
	})
})
