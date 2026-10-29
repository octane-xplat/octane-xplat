/** @jsxImportSource @octane-xplat/jsx/dom */
// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
vi.mock('../../theme/theme-scheme', () => ({ useThemeScheme: () => 'light' }))
import { act, createRoot } from 'octane'
import { SizeProvider, useSize } from './size-context'
import { useFieldControlProps } from '../forms/field-context'
import { Toolbar } from './Toolbar.web.tsrx'
import { Button } from '../actions/Button.web.tsrx'
import { ButtonGroup } from '../actions/ButtonGroup.web.tsrx'
import { Popover } from '../overlays/Popover.web.tsrx'

// Inherited-size parity (Astryx SizeContext, pin ebd939b): prop → inherited
// → default; Toolbar/ButtonGroup/InputGroup provide; layer content resets.

const captured: Record<string, unknown> = {}

function Probe(props: { tag: string; size?: any; def?: any }) @{
	captured[props.tag] = useSize(props.size, props.def)

	<span data-probe={props.tag} />
}

function FieldProbe(props: { tag: string }) @{
	captured[props.tag] = useFieldControlProps({} as any).size

	<span data-probe={props.tag} />
}

const roots: any[] = []
function mount(node: any) {
	const el = document.createElement('div')
	document.body.append(el)
	const root = createRoot(el)
	roots.push(root)
	act(() => root.render(node))
	return el
}

afterEach(() => {
	for (const root of roots.splice(0)) {
		act(() => root.unmount())
	}

	document.body.innerHTML = ''
	for (const k of Object.keys(captured)) {
		delete captured[k]
	}
})

describe('useSize resolution (web)', () => {
	it('falls back to md with no prop and no provider', () => {
		mount(<Probe tag="a" />)
		expect(captured.a).toBe('md')
	})

	it('honors the explicit default', () => {
		mount(<Probe tag="a" def="lg" />)
		expect(captured.a).toBe('lg')
	})

	it('prop wins over explicit default', () => {
		mount(<Probe tag="a" size="sm" def="lg" />)
		expect(captured.a).toBe('sm')
	})

	it('inherits from the enclosing provider', () => {
		mount(
			<SizeProvider value="lg">
				<Probe tag="a" />
			</SizeProvider>,
		)

		expect(captured.a).toBe('lg')
	})

	it('prop wins over the inherited provider size', () => {
		mount(
			<SizeProvider value="lg">
				<Probe tag="a" size="sm" />
			</SizeProvider>,
		)

		expect(captured.a).toBe('sm')
	})

	it('inherited wins over the explicit default', () => {
		mount(
			<SizeProvider value="lg">
				<Probe tag="a" def="sm" />
			</SizeProvider>,
		)

		expect(captured.a).toBe('lg')
	})

	it('explicit null provider falls back to the default', () => {
		mount(
			<SizeProvider value={null}>
				<Probe tag="a" def="sm" />
			</SizeProvider>,
		)

		expect(captured.a).toBe('sm')
	})

	it('nested providers resolve to the nearest', () => {
		mount(
			<SizeProvider value="sm">
				<SizeProvider value="lg">
					<Probe tag="a" />
				</SizeProvider>
				<Probe tag="b" />
			</SizeProvider>,
		)

		expect(captured.a).toBe('lg')
		expect(captured.b).toBe('sm')
	})
})

describe('container inheritance (web)', () => {
	it('Toolbar cascades its size to a Button child', () => {
		const host = mount(<Toolbar label="t" size="sm" startContent={<Button label="B" />} />)
		const button = host.querySelector('.vx-button')!
		expect(button.classList.contains('vx-button--size-sm')).toBe(true)
	})

	it('an explicit Button size beats the Toolbar size', () => {
		const host = mount(
			<Toolbar label="t" size="sm" startContent={<Button label="B" size="lg" />} />,
		)

		const button = host.querySelector('.vx-button')!
		expect(button.classList.contains('vx-button--size-lg')).toBe(true)
	})

	it('ButtonGroup inside a Toolbar inherits then re-provides', () => {
		const host = mount(
			<Toolbar
				label="t"
				size="lg"
				startContent={
					<ButtonGroup label="g">
						<Button label="B" />
					</ButtonGroup>
				}
			/>,
		)

		const button = host.querySelector('.vx-button')!
		expect(button.classList.contains('vx-button--size-lg')).toBe(true)
	})

	it('an explicit ButtonGroup size beats the Toolbar size', () => {
		const host = mount(
			<Toolbar
				label="t"
				size="lg"
				startContent={
					<ButtonGroup label="g" size="sm">
						<Button label="B" />
					</ButtonGroup>
				}
			/>,
		)

		const button = host.querySelector('.vx-button')!
		expect(button.classList.contains('vx-button--size-sm')).toBe(true)
	})

	it('a field control inside a Toolbar resolves the inherited size', () => {
		mount(<Toolbar label="t" size="sm" startContent={<FieldProbe tag="a" />} />)
		expect(captured.a).toBe('sm')
	})
})

describe('layer boundary (web)', () => {
	it('portaled layer content does not inherit the declaring tree size', async () => {
		const anchor = { current: document.createElement('div') }
		document.body.append(anchor.current)
		mount(
			<SizeProvider value="sm">
				<Probe tag="in" />
				<Popover open={true} anchor={anchor}>
					<Probe tag="layer" />
				</Popover>
			</SizeProvider>,
		)

		await act(async () => {})
		expect(captured.in).toBe('sm')
		expect(captured.layer).toBe('md')
	})
})
