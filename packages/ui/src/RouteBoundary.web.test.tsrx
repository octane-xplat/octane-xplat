// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { act, createRoot } from 'octane'
import { RouteBoundary } from './RouteBoundary.web.tsrx'

const route = { stack: 'root', name: 'boom', params: { id: 'x' } }
const roots: any[] = []

function mount(children: any, boundary?: any) {
	const host = document.createElement('div')
	document.body.append(host)
	const root = createRoot(host)
	roots.push(root)
	act(() =>
		root.render(
			<RouteBoundary boundary={boundary} route={route}>
				{children}
			</RouteBoundary>,
		),
	)

	return host
}

afterEach(() => {
	for (const root of roots.splice(0)) act(() => root.unmount())
	document.body.innerHTML = ''
})

it('renders children untouched when no boundary is declared', () => {
	const host = mount(<p className="ok">fine</p>)
	expect(host.querySelector('.ok')).toBeTruthy()
})

it('renders the declared boundary with error and route when the subtree throws', () => {
	const seen: any = {}
	const Boundary = (props: any) => {
		seen.props = props
		return <p className="eb">failed: {String(props.error?.message ?? props.error)}</p>
	}

	const Boom = () => {
		throw new Error('screen blew up')
	}

	const host = mount(<Boom />, Boundary)
	expect(seen.props.error).toBeInstanceOf(Error)
	expect(seen.props.error.message).toBe('screen blew up')
	expect(seen.props.route).toBe(route)
	expect(seen.props.reset).toBeTypeOf('function')
	expect(host.querySelector('.eb')?.textContent).toBe('failed: screen blew up')
})

it('reset remounts the route subtree', () => {
	let fail = true
	const seen: any = {}
	const MaybeBoom = () => {
		if (fail) {
			throw new Error('boom')
		}

		return <p className="ok">recovered</p>
	}

	const Boundary = (props: any) => {
		seen.props = props
		return <p className="eb">failed</p>
	}

	const host = mount(<MaybeBoom />, Boundary)
	expect(host.querySelector('.eb')).toBeTruthy()

	fail = false
	act(() => seen.props.reset())
	expect(host.querySelector('.ok')?.textContent).toBe('recovered')
})
