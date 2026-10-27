import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
	assertAvailable,
	UnavailabilityError,
} from '../src/capability.ts'

test('UnavailabilityError carries the feature name', () => {
	const error = new UnavailabilityError('secureStorage')
	assert.equal(error.name, 'UnavailabilityError')
	assert.equal(error.feature, 'secureStorage')
	assert.match(error.message, /secureStorage/)
	assert.ok(error instanceof UnavailabilityError)
	assert.ok(error instanceof Error)
})

test('assertAvailable throws only when absent', () => {
	assert.doesNotThrow(() => assertAvailable('haptics', true))
	assert.throws(() => assertAvailable('haptics', false), UnavailabilityError)
	assert.throws(
		() => assertAvailable('haptics', false),
		(error) => error.name === 'UnavailabilityError' && error.feature === 'haptics'
	)
})
