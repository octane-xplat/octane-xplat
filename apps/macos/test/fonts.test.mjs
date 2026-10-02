import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { registerFontFamily, resolveFont } from '../src/renderer/fonts.mjs'

const originalFont = globalThis.NSFont
const originalManager = globalThis.NSFontManager
before(() => {
	globalThis.NSFont = {
		systemFontOfSizeWeight: (size, weight) => ({ family: 'system', size, weight }),
		fontWithDescriptorSize: (descriptor, size) => ({ family: descriptor.family, size }),
	}

	globalThis.NSFontManager = {
		sharedFontManager: {
			fontWithFamilyTraitsWeightSize: (family, _traits, weight, size) =>
				family === 'Installed' ? { family, weight, size } : null,
		},
	}
})

after(() => {
	globalThis.NSFont = originalFont
	globalThis.NSFontManager = originalManager
})

test('default system fonts respect size and CSS weights', () => {
	assert.deepEqual(resolveFont(18), { family: 'system', size: 18, weight: 0 })
	assert.deepEqual(resolveFont(24, 'bold'), { family: 'system', size: 24, weight: 0.4 })
	assert.equal(resolveFont(12, 600).weight, 0.3)
	assert.equal(resolveFont(12, 'invalid').weight, 0)
})

test('system families win even when a custom family is registered', () => {
	registerFontFamily('Test Sans', [{ weight: 400, descriptor: { family: 'custom' } }])
	for (const family of ['system-ui', '-apple-system', 'sans-serif']) {
		assert.equal(resolveFont(16, 700, `${family}, Test Sans`).family, 'system')
	}
})

test('registered faces are selected by weight without becoming the default', () => {
	registerFontFamily('Weighted', [
		{ weight: 700, descriptor: { family: 'heavy' } },
		{ weight: 400, descriptor: { family: 'regular' } },
	])

	assert.deepEqual(resolveFont(22, 400, 'Weighted'), { family: 'regular', size: 22 })
	assert.equal(resolveFont(22, 700, 'Weighted').family, 'heavy')
	assert.equal(resolveFont(22, 900, 'Weighted').family, 'heavy')
	assert.equal(resolveFont(22).family, 'system')
})

test('quoted family stacks fall through unavailable names to registered or installed fonts', () => {
	assert.equal(resolveFont(16, 400, 'Missing, "Test Sans", system-ui').family, 'custom')
	assert.equal(resolveFont(16, 400, 'Missing, Installed, system-ui').family, 'Installed')
	assert.equal(resolveFont(16, 700, 'Installed').weight, 9)
	assert.equal(resolveFont(16, 400, 'Missing').family, 'system')
})

test('invalid registration cannot shadow a system family', () => {
	assert.throws(() => registerFontFamily('system-ui', [{ weight: 400, descriptor: {} }]))
	assert.throws(() => registerFontFamily('Empty', []))
	assert.throws(() => registerFontFamily('Broken', [{ weight: NaN, descriptor: {} }]))
	assert.throws(() => registerFontFamily('Broken', [{ weight: 400, descriptor: null }]))
})
