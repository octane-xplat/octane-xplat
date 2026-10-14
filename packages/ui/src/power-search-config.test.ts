import { describe, expect, expectTypeOf, it } from 'vitest'
import {
	createPowerSearchConfig,
	createInternalConfig,
	createPowerSearchSource,
} from './power-search-config'

import type { PowerSearchFilter, PowerSearchFilterFor, PowerSearchProps } from './props'

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

describe('schema-inferred filters', () => {
	it('narrows filter field/operator/value to the field definitions', () => {
		const { config, applyFilters } = createPowerSearchConfig([
			{ key: 'title', type: 'string', label: 'Title' },
			{ key: 'year', type: 'number', label: 'Year' },
			{ key: 'genre', type: 'enum', enumValues: [{ value: 'travel', label: 'Travel' }] },
		] as const)

		type Filter = PowerSearchFilterFor<typeof config>
		expectTypeOf<Filter['field']>().toEqualTypeOf<'title' | 'year' | 'genre'>()
		expectTypeOf<Extract<Filter, { field: 'title' }>['operator']>().toEqualTypeOf<
			| 'contains'
			| 'not_contains'
			| 'starts_with'
			| 'not_starts_with'
			| 'ends_with'
			| 'not_ends_with'
			| 'is'
			| 'is_not'
		>()

		expectTypeOf<Extract<Filter, { field: 'year' }>['value']>().toEqualTypeOf<
			{ readonly type: 'integer'; readonly value: number } | { readonly type: 'float'; readonly value: number }
		>()

		expectTypeOf<Extract<Filter, { field: 'genre' }>['value']>().toEqualTypeOf<{
			readonly type: 'enum'
			readonly value: 'travel'
		}>()

		const books = [{ title: 'Dune', year: 1965, genre: 'scifi' }]
		applyFilters(
			[{ field: 'genre', operator: 'is', value: { type: 'enum', value: 'travel' } }],
			books,
		)

		// @ts-expect-error — 'bogus' is not a defined field
		applyFilters([{ field: 'bogus', operator: 'contains', value: { type: 'string', value: 'x' } }], books)

		// @ts-expect-error — 'greater_than' is not a string-field operator
		applyFilters([{ field: 'title', operator: 'greater_than', value: { type: 'float', value: 1 } }], books)

		// @ts-expect-error — the value shape must match the operator
		applyFilters([{ field: 'title', operator: 'contains', value: { type: 'float', value: 1 } }], books)
	})

	it('types the component contract from the branded config', () => {
		const { config } = createPowerSearchConfig([
			{ key: 'title', type: 'string' },
		] as const)

		expectTypeOf<PowerSearchProps<typeof config>['filters']>().toEqualTypeOf<
			ReadonlyArray<PowerSearchFilterFor<typeof config>>
		>()

		expectTypeOf<PowerSearchProps['filters']>().toEqualTypeOf<
			ReadonlyArray<PowerSearchFilter>
		>()
	})
})
