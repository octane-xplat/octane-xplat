import { describe, expect, it } from 'vitest'
import { filterSelectOptions, groupSelectOptions, toggleVisibleSelection } from './select-options'

describe('finite-list selection data', () => {
	it('keeps disabled and hidden selections during filtered bulk toggles', () => {
		const shown = [{ value: 'a' }, { value: 'locked', isDisabled: true }]
		expect(toggleVisibleSelection(['hidden', 'locked'], shown)).toEqual(['hidden', 'locked', 'a'])
		expect(toggleVisibleSelection(['hidden', 'locked', 'a'], shown)).toEqual(['hidden', 'locked'])
	})

	it('filters supporting groups by the same label/value predicate used for navigation', () => {
		const options = [
			{ value: 'a', label: 'Apple', group: 'Fruit' },
			{ value: 'b', label: 'Berlin', group: 'Cities' },
			{ value: 'c', label: 'Banana', group: 'Fruit' },
		]

		expect(
			groupSelectOptions(filterSelectOptions(options, 'A')).flatMap((group) =>
				group.options.map((option) => option.value),
			),
		).toEqual(['a', 'c'])
	})
})
