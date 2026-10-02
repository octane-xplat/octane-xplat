import { describe, expect, it } from 'vitest'
import {
	createPowerSearchConfig,
	createInternalConfig,
	createPowerSearchSource,
} from './power-search-config'

describe('PowerSearch config helpers', () => {
	it('builds typed fields and applies all active filters', () => {
		const { config, applyFilters } = createPowerSearchConfig([
			{ key: 'name', type: 'string', label: 'Name' },
			{ key: 'age', type: 'number', label: 'Age' },
		] as const)

		const people = [
			{ name: 'Ada', age: 37 },
			{ name: 'Bob', age: 18 },
		]
		const result = applyFilters(
			[
				{ field: 'name', operator: 'contains', value: { type: 'string', value: 'ad' } },
				{ field: 'age', operator: 'greater_than', value: { type: 'float', value: 30 } },
			],
			people,
		)

		expect(result).toEqual([{ name: 'Ada', age: 37 }])
		expect(config.fields.map((field) => field.key)).toEqual(['name', 'age'])
	})

	it('offers field, operator, and matching value suggestions', () => {
		const { config } = createPowerSearchConfig([
			{ key: 'title', type: 'string', label: 'Title' },
		] as const)
		const source = createPowerSearchSource(createInternalConfig(config), 10)
		expect(source.search('title foo')).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					auxiliaryData: expect.objectContaining({
						fieldKey: 'title',
						operatorKey: 'contains',
						filterValue: { type: 'string', value: 'foo' },
					}),
				}),
			]),
		)
	})
})
