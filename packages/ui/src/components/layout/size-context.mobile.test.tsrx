/** @jsxImportSource @octane-xplat/jsx */
import { describe, expect, it, vi } from 'vitest'

vi.mock('@nativescript/core', () => ({
	isIOS: false,
	isAndroid: true,
	Application: { primaryWindow: undefined, on: () => {}, off: () => {} },
	GridLayout: class {
		className = ''
		horizontalAlignment = ''
		verticalAlignment = ''
		style: Record<string, unknown> = {}
		on() {}
		off() {}
	},
	ScrollView: class ScrollView {},
	Screen: { mainScreen: { scale: 2, widthDIPs: 390, heightDIPs: 844 } },
	Utils: { openUrl: () => {} },
}))

vi.mock('./root-layout', () => ({
	rootLayoutFor: () => ({
		open: async () => {},
		hasChild: () => false,
		getPopupIndex: () => -1,
		removeChild: () => {},
		close: async () => {},
	}),
}))

// The universal portal target is stubbed to identity — portal children render
// inline under the declaring tree, so the SizeProvider-null reset inside the
// layer surface is the code under test.
vi.mock('../../internal/platform/native-portal', () => ({ createPortal: (children: any) => children }))

vi.mock('../media/svg', () => ({
	glyphSvgMarkup: () => null,
	isSvgSrc: () => false,
	svgSource: (src: string) => src,
}))

vi.mock('../feedback/ActivityIndicator.tsrx', async () => ({
	ActivityIndicator: (await import('./Spacer.tsrx')).Spacer,
}))

import {
	createObjectContainer,
	createObjectDriver,
	createUniversalRoot,
	flushUniversalAct,
} from 'octane/universal/native'

import { SizeProvider, useSize } from './size-context'
import { useFieldControlProps } from '../forms/field-context'
import { Toolbar } from './Toolbar.tsrx'
import { Popover } from '../overlays/Popover.tsrx'

// Inherited-size parity (Astryx SizeContext, pin ebd939b): prop → inherited
// → default; containers provide; portaled layer content resets to default.

const captured: Record<string, unknown> = {}

const Probe = (props: { tag: string; size?: any; def?: any }) => @{
		captured[props.tag] = useSize(props.size, props.def)

		<label text={props.tag} />
	}

const FieldProbe = (props: { tag: string }) => @{
		captured[props.tag] = useFieldControlProps({} as any).size

		<label text={props.tag} />
	}

const CaseBare = () => @{
		<Probe tag="a" />
	}

const CaseDefaults = () => @{
		<>
			<Probe tag="d" def="lg" />
			<Probe tag="p" size="sm" def="lg" />
		</>
	}

const CaseNested = () => @{
		<SizeProvider value="lg">
			<Probe tag="a" />
			<Probe tag="b" size="sm" />
			<SizeProvider value="sm">
				<Probe tag="c" />
			</SizeProvider>
		</SizeProvider>
	}

const CaseNullProvider = () => @{
		<SizeProvider value={null}>
			<Probe tag="a" def="sm" />
		</SizeProvider>
	}

const CaseToolbar = () => @{
		<Toolbar
			label="t"
			size="sm"
			startContent={
				<>
					<Probe tag="a" />
					<Probe tag="b" size="lg" />
					<FieldProbe tag="f" />
				</>
			}
		/>
	}

const CaseLayer = (props: { anchor: any }) => @{
		<SizeProvider value="sm">
			<Probe tag="in" />
			<Popover open={true} anchor={props.anchor}>
				<Probe tag="layer" />
			</Popover>
		</SizeProvider>
	}

function render(Component: any, props?: any) {
	const container = createObjectContainer('nativescript')
	const root = createUniversalRoot(container, createObjectDriver('nativescript'))
	flushUniversalAct(() => root.render(Component, props))
	// Effects that publish state (e.g. Popover's portalHost) need a second
	// flush so their follow-up render reaches the assertions.
	flushUniversalAct(() => {})
	return { container, root }
}

describe('useSize resolution (universal renderer)', () => {
	it('falls back to md with no prop and no provider', () => {
		const { root } = render(CaseBare)
		expect(captured.a).toBe('md')
		root.unmount()
	})

	it('honors the explicit default and prop precedence', () => {
		const { root } = render(CaseDefaults)
		expect(captured.d).toBe('lg')
		expect(captured.p).toBe('sm')
		root.unmount()
	})

	it('inherits, lets the prop win, and nests to the nearest provider', () => {
		const { root } = render(CaseNested)
		expect(captured.a).toBe('lg')
		expect(captured.b).toBe('sm')
		expect(captured.c).toBe('sm')
		root.unmount()
	})

	it('explicit null provider falls back to the default', () => {
		const { root } = render(CaseNullProvider)
		expect(captured.a).toBe('sm')
		root.unmount()
	})
})

describe('container inheritance (universal renderer)', () => {
	it('Toolbar cascades its size; explicit prop and field-control resolution follow the same chain', () => {
		const { root } = render(CaseToolbar)
		expect(captured.a).toBe('sm')
		expect(captured.b).toBe('lg')
		expect(captured.f).toBe('sm')
		root.unmount()
	})
})

describe('layer boundary (universal renderer)', () => {
	it('portaled layer content does not inherit the declaring tree size', async () => {
		const { root } = render(CaseLayer, { anchor: { current: {} } })
		await vi.waitFor(() => expect(captured.layer).toBeDefined())
		expect(captured.in).toBe('sm')
		expect(captured.layer).toBe('md')
		root.unmount()
	})
})
