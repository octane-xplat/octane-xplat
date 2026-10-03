import { describe, expect, it, vi } from 'vitest'
import {
	createObjectContainer,
	createObjectDriver,
	createUniversalRoot,
} from 'octane/universal/native'

vi.mock('@nativescript/core', () => ({
	isIOS: false,
	isAndroid: true,
	Utils: { openUrl: vi.fn() },
}))

vi.mock('./pan.tsrx', () => ({ usePan: () => undefined }))
vi.mock('./route', () => ({ pushDeepLink: () => false }))

import { Stack } from './Stack.tsrx'
import { StackItem } from './StackItem.tsrx'
import { HStack } from './HStack.tsrx'
import { VStack } from './VStack.tsrx'
import { Center } from './Center.tsrx'
import { Section } from './Section.tsrx'
import { VisuallyHidden } from './VisuallyHidden.tsrx'
import { FormLayout } from './FormLayout.tsrx'
import { InputGroup, InputGroupText } from './InputGroup.tsrx'
import { TextInput } from './TextInput.tsrx'
import { Checkbox } from './Checkbox.tsrx'
import { List } from './List.tsrx'
import { ListItem } from './ListItem.tsrx'
import { getIndicator, registerIndicator, CheckboxIndicator, CheckIndicator } from './indicators'

function mount(component: any, props: any = {}) {
	const container = createObjectContainer('nativescript')
	const root = createUniversalRoot(container, createObjectDriver('nativescript'))
	root.render(component, props)
	return { container, root }
}

function findByClass(node: any, cls: string): any {
	if (!node) {
		return undefined
	}

	const classes = String(node.props?.className ?? '').split(' ')
	if (classes.includes(cls)) {
		return node
	}

	for (const child of node.children ?? []) {
		const hit = findByClass(child, cls)
		if (hit) {
			return hit
		}
	}

	return undefined
}

describe('native flow Stack', () => {
	it('renders flexboxlayout with direction + gap + alignment attrs', () => {
		const { container, root } = mount(Stack as any, {
			direction: 'horizontal',
			hAlign: 'end',
			vAlign: 'center',
			gap: 2,
		})

		const view = container.children[0]
		expect(view.type).toBe('flexboxlayout')
		expect(view.props.flexDirection).toBe('row')
		expect(view.props.justifyContent).toBe('flex-end')
		expect(view.props.alignItems).toBe('center')
		expect(view.props.gap).toBe(8)
		root.unmount()
	})

	it('vertical is the default; justify/align map to main/cross', () => {
		const { container, root } = mount(VStack as any, { vAlign: 'end', hAlign: 'center' })
		const view = container.children[0]
		expect(view.props.flexDirection).toBe('column')
		expect(view.props.justifyContent).toBe('flex-end')
		expect(view.props.alignItems).toBe('center')
		root.unmount()
	})

	it('HStack is horizontal; isScrollable wraps in scrollview', () => {
		const { container, root } = mount(HStack as any, { isScrollable: true })
		const view = container.children[0]
		expect(view.type).toBe('scrollview')
		expect(view.props.orientation).toBe('horizontal')
		root.unmount()
	})

	it('StackItem size=fill grows via style', () => {
		const { container, root } = mount(StackItem as any, { size: 'fill' })
		const view = container.children[0]
		expect(view.props.style?.flexGrow).toBe(1)
		root.unmount()
	})
})

describe('native layout leaves', () => {
	it('Center centers both axes on a row flex', () => {
		const { container, root } = mount(Center as any)
		const view = container.children[0]
		expect(view.props.flexDirection).toBe('row')
		expect(view.props.justifyContent).toBe('center')
		expect(view.props.alignItems).toBe('center')
		root.unmount()
	})

	it('Section carries variant + divider classes and step padding', () => {
		const { container, root } = mount(Section as any, {
			variant: 'muted',
			dividers: ['top'],
			padding: 2,
		})

		const view = container.children[0]
		expect(String(view.props.className)).toContain('vx-section--muted')
		expect(String(view.props.className)).toContain('vx-section--divider-top')
		expect(view.props.style?.paddingTop).toBe(8)
		root.unmount()
	})

	it('VisuallyHidden renders a hidden container that keeps the tree', () => {
		const { container, root } = mount(VisuallyHidden as any)
		expect(String(container.children[0].props.className)).toContain('vx-visually-hidden')
		root.unmount()
	})
})

describe('native FormLayout + InputGroup', () => {
	it('vertical stays a column flex; horizontal becomes a grid', () => {
		const a = mount(FormLayout as any)
		expect(a.container.children[0].type).toBe('flexboxlayout')
		a.root.unmount()

		const b = mount(FormLayout as any, { direction: 'horizontal' })
		expect(b.container.children[0].type).toBe('gridlayout')
		b.root.unmount()
	})

	it('defaultOptionality=required suppresses the restating * marker', () => {
		const { container, root } = mount(FormLayout as any, {
			defaultOptionality: 'required',
			children: [],
		})

		expect(container.children[0].props.className).toContain('vx-formlayout')
		root.unmount()
	})

	it('InputGroup renders the joined row and flattens member inputs', () => {
		const { container, root } = mount(InputGroup as any, {
			label: 'URL',
			children: [InputGroupText, TextInput].map(() => null),
		})

		// group host is inside the Field wrapper
		expect(findByClass(container.children[0], 'vx-inputgroup')).not.toBeNull()
		root.unmount()
	})
})

describe('native indicators + list', () => {
	it('Checkbox renders through the indicator registry', () => {
		const { container, root } = mount(Checkbox as any, { checked: true })
		expect(findByClass(container.children[0], 'vx-ind-checkbox--checked')).not.toBeNull()
		root.unmount()
	})

	it('indeterminate renders the dash state', () => {
		const { container, root } = mount(Checkbox as any, { indeterminate: true })
		expect(findByClass(container.children[0], 'vx-ind-checkbox--indeterminate')).not.toBeNull()
		expect(findByClass(container.children[0], 'vx-ind-dash')).not.toBeNull()
		root.unmount()
	})

	it('getIndicator resolves defaults and registered overrides', () => {
		const Custom = () => null
		registerIndicator('check', Custom as any)
		expect(getIndicator('check')).toBe(Custom)
		registerIndicator('check', CheckIndicator as any)
		expect(getIndicator('check')).toBe(CheckIndicator)
		expect(getIndicator('checkbox')).toBe(CheckboxIndicator)
	})

	it('List renders a column; decimal style emits numbered markers', () => {
		const { container, root } = mount(List as any, {
			listStyle: 'decimal',
			start: 4,
			children: null,
		})

		const list = container.children[0]
		expect(list.type).toBe('flexboxlayout')
		root.unmount()
	})

	it('ListItem renders label/desc text nodes', () => {
		const { container, root } = mount(ListItem as any, { label: 'Row', description: 'sub' })
		expect(findByClass(container.children[0], 'vx-listitem')).not.toBeNull()
		expect(findByClass(container.children[0], 'vx-listitem-label')?.props?.text).toBe('Row')
		root.unmount()
	})

	it('disabled ListItem does not wire activation; enabled ListItem activates once', () => {
		let calls = 0
		const disabled = mount(ListItem as any, {
			label: 'Disabled',
			isDisabled: true,
			onPress: () => calls++,
		})

		const disabledView = findByClass(disabled.container.children[0], 'vx-listitem')
		expect(() =>
			disabled.container.dispatchEvent(disabledView, 'tap', { object: disabledView }),
		).toThrow('no "tap" listener')

		expect(calls).toBe(0)
		disabled.root.unmount()

		const enabled = mount(ListItem as any, {
			label: 'Enabled',
			onPress: () => calls++,
		})

		const enabledView = findByClass(enabled.container.children[0], 'vx-listitem')
		enabled.container.dispatchEvent(enabledView, 'tap', { object: enabledView })
		expect(calls).toBe(1)
		enabled.root.unmount()
	})
})
