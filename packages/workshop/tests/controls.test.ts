import { describe, expect, it } from 'vitest'
import { UNSET, applyControlInput, freshArgs, isUnsettable, reconcileProps } from '../src/controls'

import type { StoryDefinition } from '../src/contract'

const base = (
	over: Partial<StoryDefinition<any, any, any>> = {},
): StoryDefinition<any, any, any> => ({
	id: 'x/y',
	title: 'X / Y',
	targets: 'all',
	component: () => null,
	args: {},
	...over,
})

describe('freshArgs', () => {
	it('deep-clones nested defaults per generation', () => {
		const args = { user: { name: 'a', tags: ['x'] }, list: [1, 2] }
		const a = freshArgs(args)
		const b = freshArgs(args)

		;(a.user as { tags: string[] }).tags.push('y')
		expect((b.user as { tags: string[] }).tags).toEqual(['x'])
		expect((args.user as { tags: string[] }).tags).toEqual(['x'])
		expect(a.user).not.toBe(args.user)
		expect(a.list).not.toBe(args.list)
	})

	it('passes class instances through without cloning', () => {
		class Ref {
			value = 1
		}

		const ref = new Ref()
		expect(freshArgs({ ref }).ref).toBe(ref)
	})
})

describe('reconcileProps', () => {
	it('forwards removed keys as explicit undefined', () => {
		expect(reconcileProps({ a: 1, b: 2 }, { a: 3 })).toEqual({ a: 3, b: undefined })
	})

	it('keeps unset keys absent in the complete bag', () => {
		const next = { a: 1 }
		expect('b' in next).toBe(false)
	})
})

describe('isUnsettable', () => {
	it('requires allowUnset or no default', () => {
		expect(
			isUnsettable(
				base({ args: { label: 'x' }, controls: { label: { type: 'string', allowUnset: true } } }),
				'label',
			),
		).toBe(true)

		expect(
			isUnsettable(
				base({ args: { label: 'x' }, controls: { label: { type: 'string' } } }),
				'label',
			),
		).toBe(false)

		expect(isUnsettable(base({ controls: { extra: { type: 'string' } } }), 'extra')).toBe(true)
	})
})

describe('applyControlInput', () => {
	it('boolean accepts only booleans', () => {
		const def = base({ controls: { flag: { type: 'boolean' } } })
		expect(applyControlInput(def, {}, 'flag', true).props).toEqual({ flag: true })
		expect(applyControlInput(def, {}, 'flag', 'yes').error?.message).toMatch(/boolean/)
	})

	it('number coerces, validates range, rejects non-finite', () => {
		const def = base({ controls: { n: { type: 'number', min: 1, max: 5 } } })
		expect(applyControlInput(def, {}, 'n', '3').props).toEqual({ n: 3 })
		expect(applyControlInput(def, {}, 'n', 'abc').error?.message).toMatch(/finite/)
		expect(applyControlInput(def, {}, 'n', '0').error?.message).toMatch(/≥ 1/)
		expect(applyControlInput(def, {}, 'n', '9').error?.message).toMatch(/≤ 5/)
	})

	it('enum accepts only declared options', () => {
		const def = base({ controls: { tier: { type: 'enum', options: ['a', 'b', 3] } } })
		expect(applyControlInput(def, {}, 'tier', 'a').props).toEqual({ tier: 'a' })
		expect(applyControlInput(def, {}, 'tier', 'z').error?.message).toMatch(/a, b, 3/)
		expect(applyControlInput(def, {}, 'tier', 3).props).toEqual({ tier: 3 })
	})

	it('UNSET removes the key entirely when unsettable', () => {
		const def = base({
			args: { label: 'x' },
			controls: { label: { type: 'string', allowUnset: true } },
		})

		const result = applyControlInput(def, { label: 'x', keep: 1 }, 'label', UNSET)
		expect(result.props).toEqual({ keep: 1 })
		expect('label' in (result.props ?? {})).toBe(false)
	})

	it('UNSET rejects required props', () => {
		const def = base({ args: { label: 'x' }, controls: { label: { type: 'string' } } })
		expect(applyControlInput(def, { label: 'x' }, 'label', UNSET).error?.message).toMatch(
			/required/,
		)
	})

	it('invalid input never mutates the props bag', () => {
		const def = base({ controls: { n: { type: 'number' } } })
		const before = { n: 1 }
		const result = applyControlInput(def, before, 'n', 'nope')
		expect(result.error).toBeTruthy()
		expect(result.props).toBeUndefined()
		expect(before).toEqual({ n: 1 })
	})

	it('undeclared keys are rejected', () => {
		expect(applyControlInput(base(), {}, 'ghost', 'x').error?.message).toMatch(/no control/)
	})
})
