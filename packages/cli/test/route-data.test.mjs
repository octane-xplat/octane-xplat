import assert from 'node:assert/strict'
import { test } from 'node:test'
import { assertRouteDataJson } from '../src/route-data.ts'

const check = (value) => assertRouteDataJson(value, 'help', 'app/help.loader.ts')
test('baked JSON preserves dense arrays, shared records and reserved own keys', () => {
	const shared = { title: 'Packing' }
	const value = {
		list: [null, true, 'text', 3.5, shared, shared],
		reserved: JSON.parse('{"__proto__":{},"constructor":"title"}'),
	}
	check(value)
	check(Object.assign(Object.create(null), { title: 'Packing' }))
	assert.deepEqual(JSON.parse(JSON.stringify(value)), value)
})

for (const [name, value] of [
	['undefined', undefined],
	['function', () => {}],
	['symbol', Symbol('private')],
	['bigint', 1n],
	['NaN', NaN],
	['infinity', Infinity],
	['negative zero', -0],
	['date', new Date(0)],
	['map', new Map()],
	['set', new Set()],
	['typed array', new Uint8Array([1])],
	['array hole', Array(1)],
	['extra array property', Object.assign([], { title: 'lost' })],
	['symbol key', { [Symbol('private')]: 1 }],
	['non-enumerable field', Object.defineProperty({}, 'hidden', { value: 1 })],
]) {
	test(`baked JSON rejects ${name} with source and field diagnostics`, () => {
		assert.throws(
			() => check({ nested: value }),
			(error) => {
				assert.match(error.message, /baked route 'help' \(app\/help.loader\.ts\) at \$\["nested"\]/)
				return true
			},
		)
	})
}

test('baked JSON rejects cycles without rejecting shared references', () => {
	const value = { children: [] }
	value.children.push(value)
	assert.throws(() => check(value), /at \$\["children"\]\[0\]: cyclic/)
})

test('baked JSON never invokes getters or toJSON to infer a different type', () => {
	let calls = 0
	const getter = Object.defineProperty({}, 'title', {
		enumerable: true,
		get() {
			calls++
			return 'Packing'
		},
	})
	assert.throws(() => check(getter), /accessors/)
	assert.throws(
		() =>
			check({
				toJSON() {
					calls++
					return 'Packing'
				},
			}),
		/function/,
	)
	assert.equal(calls, 0)
})
