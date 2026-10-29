/** @jsxImportSource @octane-xplat/jsx */
import { expect, it } from 'vitest'
import { createObjectContainer, createObjectDriver, createUniversalRoot, flushUniversalSync } from 'octane/universal/native'
import { InputNumber } from './InputNumber.macos.tsrx'
import { FormField } from './FormField.macos.tsrx'

function mount(component: any, props: any) {
	const container = createObjectContainer('nativescript')
	const root = createUniversalRoot(container, createObjectDriver('nativescript'))
	const render = (next: any) => { root.render(component, next); flushUniversalSync(() => {}) }
	render(props)
	const all = (): any[] => {
		const walk = (node: any): any[] => [node, ...(node.children?.flatMap(walk) ?? [])]
		return container.children.flatMap(walk)
	}
	const input = () => all().find((node) => node.type === 'textfield')
	const classNodes = (name: string) => all().filter((node) => String(node.props?.className).split(' ').includes(name))
	return { root, render, all, input, classNodes }
}

it('AppKit numeric fields format values, show units, and preserve the input while hiding steppers', () => {
	const env = mount(InputNumber, { defaultValue: 3, label: 'Mass', units: 'kg', formatValue: (value: number) => value.toFixed(1) })
	try {
		const input = env.input()
		expect(input.props.value).toBe('3.0')
		expect(env.classNodes('vx-inputnumber-step')).toHaveLength(2)
		expect(env.classNodes('vx-inputnumber-units')[0].props.text).toBe('kg')
		expect(input.props.accessibilityLabel).toBe('Mass')
		env.render({ hasNumberSteppers: false, label: 'Mass', units: 'g' })
		expect(env.input()).toBe(input)
		expect(input.props.value).toBe('3')
		expect(env.classNodes('vx-inputnumber-step')).toHaveLength(0)
		expect(env.classNodes('vx-inputnumber-units')[0].props.text).toBe('g')
	} finally { env.root.unmount() }
})

it('AppKit numeric clear reports null before onClear and retains uncontrolled stepping', () => {
	const events: unknown[] = []
	const props = { defaultValue: 2, hasClear: true, min: 0, max: 3, step: 2,
		onValueChange: (value: number | null) => events.push(value), onClear: () => events.push('clear') }
	const env = mount(InputNumber, props)
	try {
		env.classNodes('vx-inputnumber-clear')[0].props.onTap()
		flushUniversalSync(() => {})
		expect(events).toEqual([null, 'clear'])
		expect(env.input().props.value).toBe('')
		expect(env.classNodes('vx-inputnumber-clear')).toHaveLength(0)
		env.classNodes('vx-inputnumber-step')[1].props.onTap()
		flushUniversalSync(() => {})
		expect(env.input().props.value).toBe('2')
		env.classNodes('vx-inputnumber-step')[1].props.onTap()
		flushUniversalSync(() => {})
		expect(env.input().props.value).toBe('3')
	} finally { env.root.unmount() }
})

it('controlled null wins over a default and requests stepping without changing the display', () => {
	const requests: unknown[] = []
	const env = mount(InputNumber, { value: null, defaultValue: 9, onValueChange: (value: unknown) => requests.push(value), hasClear: true })
	try {
		expect(env.input().props.value).toBe('')
		expect(env.classNodes('vx-inputnumber-clear')).toHaveLength(0)
		env.classNodes('vx-inputnumber-step')[1].props.onTap()
		flushUniversalSync(() => {})
		expect(requests).toEqual([1])
		expect(env.input().props.value).toBe('')
	} finally { env.root.unmount() }
})

it('an enclosing Field blocks numeric actions and owns labels/status without duplicate wrappers or IDs', () => {
	const requests: unknown[] = []
	function Parent(props: any) {
		return <FormField label="Count" inputID="count" isDisabled={props.isDisabled} isReadOnly={props.isReadOnly}
			description="In stock" status={{ type: 'error', message: 'Check stock' }}>
			<InputNumber id="count" defaultValue={2} hasClear onValueChange={(value) => requests.push(value)} />
		</FormField>
	}
	const env = mount(Parent, { isDisabled: true })
	try {
		expect(env.classNodes('vx-field')).toHaveLength(1)
		expect(env.all().filter((node) => node.props?.id === 'count')).toHaveLength(1)
		expect(env.input().props.accessibilityLabel).toBe('Count')
		expect(env.input().props.accessibilityHint).toBe('In stock. Check stock')
		for (const state of [{ isDisabled: true }, { isReadOnly: true }]) {
			env.render(state)
			for (const step of env.classNodes('vx-inputnumber-step')) expect(step.props.onTap).toBeUndefined()
			expect(env.input().props.editable).toBe(false)
			expect(env.classNodes('vx-inputnumber-clear')).toHaveLength(0)
		}
		expect(requests).toEqual([])
	} finally { env.root.unmount() }
})

it('adding numeric validation metadata retains the uncontrolled value and input identity', () => {
	const env = mount(InputNumber, { defaultValue: 2 })
	try {
		const input = env.input()
		input.props.onTextChange('7')
		flushUniversalSync(() => {})
		env.render({ label: 'Amount', status: { type: 'error', message: 'Check amount' } })
		expect(env.input()).toBe(input)
		expect(input.props.value).toBe('7')
		expect(env.classNodes('vx-field')).toHaveLength(1)
	} finally { env.root.unmount() }
})


it('rapid numeric edits, steps and clear share the latest local intent before render', () => {
	const events: unknown[] = []
	const env = mount(InputNumber, { defaultValue: 1, step: 2, min: 0, max: 9, hasClear: true,
		onValueChange: (value: number | null) => events.push(value), onClear: () => events.push('clear') })
	try {
		const [down, up] = env.classNodes('vx-inputnumber-step').map((node) => node.props.onTap)
		const edit = env.input().props.onTextChange, clear = env.classNodes('vx-inputnumber-clear')[0].props.onTap
		up(); up(); down(); edit('4'); up(); clear(); up()
		expect(events).toEqual([3, 5, 3, 4, 6, null, 'clear', 2])
		flushUniversalSync(() => {})
		expect(env.input().props.value).toBe('2')
	} finally { env.root.unmount() }
})

it('controlled numeric requests await parent acceptance and preserve the original local seed', () => {
	const events: unknown[] = [], onValueChange = (value: number | null) => events.push(value)
	const env = mount(InputNumber, { value: null, defaultValue: 9, onValueChange })
	try {
		const up = env.classNodes('vx-inputnumber-step')[1].props.onTap
		up(); up(); flushUniversalSync(() => {})
		expect(events).toEqual([1, 1])
		expect(env.input().props.value).toBe('')
		env.render({ defaultValue: 42, onValueChange })
		up(); up(); flushUniversalSync(() => {})
		expect(events).toEqual([1, 1, 10, 11])
		expect(env.input().props.value).toBe('11')
	} finally { env.root.unmount() }
})

it('held numeric actions read current inherited blocking, bounds and callbacks', () => {
	const events: unknown[] = []
	function Parent(props: any) {
		const { isDisabled, isReadOnly, ...inputProps } = props
		return <FormField isDisabled={isDisabled} isReadOnly={isReadOnly}>
			<InputNumber {...inputProps} />
		</FormField>
	}
	const initial = { value: 8, hasClear: true, onValueChange: () => events.push('old') }
	const env = mount(Parent, initial)
	try {
		const up = env.classNodes('vx-inputnumber-step')[1].props.onTap
		const clear = env.classNodes('vx-inputnumber-clear')[0].props.onTap, edit = env.input().props.onTextChange
		for (const state of [{ isDisabled: true }, { isReadOnly: true }]) {
			env.render({ ...initial, ...state }); up(); clear(); edit('4')
		}
		expect(events).toEqual([])
		env.render({ value: 8, step: 2, max: 9, hasClear: true,
			onValueChange: (value: number | null) => events.push(value), onClear: () => events.push('current-clear') })
		up(); clear(); edit('4'); flushUniversalSync(() => {})
		expect(events).toEqual([9, null, 'current-clear', 4])
		expect(env.input().props.value).toBe('8')
	} finally { env.root.unmount() }
})

it('accepted numeric clear owns its callback pair and rejects cross-action reentry', () => {
	for (const detach of [false, true]) {
		const events: unknown[] = []
		let nested = () => {}, replace = () => {}
		const env = mount(InputNumber, { defaultValue: 2, hasClear: true,
			onValueChange: (value: number | null) => { events.push(value); nested(); replace() },
			onClear: () => { events.push('accepted-clear'); nested() } })
		try {
			const up = env.classNodes('vx-inputnumber-step')[1].props.onTap
			const clear = env.classNodes('vx-inputnumber-clear')[0].props.onTap, edit = env.input().props.onTextChange
			nested = () => { up(); edit('7'); clear() }
			replace = () => detach ? env.root.unmount() : env.render({ defaultValue: 9, hasClear: true,
				onValueChange: () => events.push('replacement'), onClear: () => events.push('replacement-clear') })
			clear()
			expect(events).toEqual([null, 'accepted-clear'])
		} finally { env.root.unmount() }
	}
})

it('numeric callback errors release ownership while preserving accepted local intent', () => {
	for (const phase of ['change', 'clear']) {
		const events: unknown[] = [], failure = new Error('consumer callback')
		let fail = true
		const env = mount(InputNumber, { defaultValue: 2, hasClear: true,
			onValueChange: (value: number | null) => { events.push(value); if (fail && phase === 'change') throw failure },
			onClear: () => { events.push('clear'); if (fail && phase === 'clear') throw failure } })
		try {
			const up = env.classNodes('vx-inputnumber-step')[1].props.onTap
			const clear = env.classNodes('vx-inputnumber-clear')[0].props.onTap
			expect(() => clear()).toThrow(failure)
			fail = false; up(); flushUniversalSync(() => {})
			expect(events).toEqual(phase === 'change' ? [null, 1] : [null, 'clear', 1])
			expect(env.input().props.value).toBe('1')
		} finally { env.root.unmount() }
	}
})

it('removed numeric affordances and detached fields reject their held actions', () => {
	const events: unknown[] = [], onValueChange = (value: number | null) => events.push(value)
	const env = mount(InputNumber, { defaultValue: 2, hasClear: true, onValueChange })
	try {
		const up = env.classNodes('vx-inputnumber-step')[1].props.onTap
		const clear = env.classNodes('vx-inputnumber-clear')[0].props.onTap, edit = env.input().props.onTextChange
		env.render({ hasNumberSteppers: false, hasClear: false, onValueChange })
		up(); clear(); edit('4'); flushUniversalSync(() => {})
		expect(events).toEqual([4])
		env.root.unmount(); up(); clear(); edit('7')
		expect(events).toEqual([4])
	} finally { env.root.unmount() }
})

it('numeric parsing, formatting and descriptive loading keep their existing policy', () => {
	const events: unknown[] = []
	const env = mount(InputNumber, { defaultValue: 2, isLoading: true, formatValue: (value: number) => value.toFixed(1),
		onValueChange: (value: number | null) => events.push(value) })
	try {
		const edit = env.input().props.onTextChange, up = env.classNodes('vx-inputnumber-step')[1].props.onTap
		edit('3.5kg'); edit('invalid'); up(); flushUniversalSync(() => {})
		expect(events).toEqual([3.5, 4.5]); expect(env.input().props.value).toBe('4.5')
		edit(''); flushUniversalSync(() => {})
		expect(events).toEqual([3.5, 4.5, null]); expect(env.input().props.value).toBe('')
	} finally { env.root.unmount() }
})

it('marked numeric editors block steps and clear while retaining draft edit notifications', () => {
	for (const method of [false, true]) {
		const events: unknown[] = []
		const env = mount(InputNumber, { defaultValue: 2, hasClear: true,
			onValueChange: (value: number | null) => events.push(value), onClear: () => events.push('clear') })
		try {
			let marked = true
			const editor = { get hasMarkedText() { return method ? () => marked : marked } }
			env.input().currentEditor = method ? () => editor : editor
			const up = env.classNodes('vx-inputnumber-step')[1].props.onTap
			const clear = env.classNodes('vx-inputnumber-clear')[0].props.onTap, edit = env.input().props.onTextChange
			up(); clear(); edit('5'); expect(events).toEqual([5])
			marked = false; up(); clear()
			expect(events).toEqual([5, 6, null, 'clear'])
		} finally { env.root.unmount() }
	}
})
