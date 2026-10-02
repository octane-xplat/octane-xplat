import { afterEach, expect, it, vi } from 'vitest'
import {
	createObjectContainer,
	createObjectDriver,
	createUniversalRoot,
	flushUniversalSync,
} from 'octane/universal/native'

vi.mock('./escape-props', () => ({
	applyEscapeProps() {},
	nativeAccessibilityState: (state: any) =>
		state?.disabled ? 'disabled' : state?.checked ? 'checked' : undefined,
}))

vi.mock('./TextInput.tsrx', async () => {
	const { defineUniversalComponent, universalPlan, universalValue, useRef } =
		await import('octane/universal/native')

	const plan = universalPlan('nativescript', {
		kind: 'host',
		type: 'test-input',
		bindings: [
			['value', 0],
			['editable', 1],
			['cell', 2],
		],
	})

	return {
		TextInput: defineUniversalComponent('nativescript', (props: any) => {
			const handle = useRef({ focus: vi.fn(), blur: vi.fn(), native: {} })
			props.ref?.(handle.current)
			return universalValue(plan, [
				props.value,
				!props.isDisabled && !props.isReadOnly,
				{ onChange: props.onChange, focus: handle.current.focus },
			])
		}),
	}
})

import { PinInput } from './PinInput.tsrx'
const roots: any[] = []
function mount(props: any = {}) {
	const container = createObjectContainer('nativescript')
	const root = createUniversalRoot(container, createObjectDriver('nativescript'))
	roots.push(root)
	root.render(PinInput as any, props)
	flushUniversalSync(() => {})
	const fields = (): any[] => {
		const found: any[] = []
		const walk = (node: any) => {
			if (node.type === 'test-input') {
				found.push(node)
			}

			for (const child of node.children ?? []) {
				walk(child)
			}
		}

		walk(container)
		return found
	}

	const enter = (i: number, value: string) =>
		flushUniversalSync(() => {
			fields()[i].props.cell.onChange(value)
		})

	return { fields, enter }
}

afterEach(() => {
	for (const root of roots.splice(0)) {
		root.unmount()
	}
})

it('clears a native controlled cell and its suffix', () => {
	const change = vi.fn()
	const { enter } = mount({ value: '1234', onValueChange: change })
	enter(1, '')
	expect(change).toHaveBeenCalledWith('1')
})

it('advances native focus after enabling the next cell and preserves handles across edits', async () => {
	const complete = vi.fn()
	const { fields, enter } = mount({ onComplete: complete })
	expect(fields().map((field) => field.props.editable)).toEqual([true, false, false, false])
	for (let i = 0; i < 4; i++) {
		enter(i, String(i + 1))
		await vi.waitFor(() => expect(fields()[i].props.value).toBe(String(i + 1)))
		if (i < 3) {
			await vi.waitFor(() => expect(fields()[i + 1].props.cell.focus).toHaveBeenCalled())
		}
	}

	expect(complete).toHaveBeenCalledWith('1234')
	enter(1, '')
	await vi.waitFor(() => expect(fields().map((f) => f.props.value)).toEqual(['1', '', '', '']))
})

it('ignores disabled edits and edits beyond the next empty cell', () => {
	const change = vi.fn()
	const { enter } = mount({ onValueChange: change })
	enter(3, '9')
	expect(change).not.toHaveBeenCalled()
	const disabled = mount({ isDisabled: true, value: '1234', onValueChange: change })
	disabled.enter(1, '9')
	expect(change).not.toHaveBeenCalled()
})
