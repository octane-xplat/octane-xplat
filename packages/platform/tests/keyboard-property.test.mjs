import assert from 'node:assert/strict'
import test from 'node:test'
import { leaseKeyboardProperty } from '../src/keyboard-property.ts'

test('movement composes with the original translation and never accumulates frames', () => {
	const host = { translateY: 12, translateX: 4, scaleY: 2, rotation: 30 }
	const lease = leaseKeyboardProperty(
		() => host.translateY,
		(value) => {
			host.translateY = value
		},
	)
	lease.set(-100)
	assert.equal(host.translateY, -88)
	assert.equal(lease.offset, -100)
	lease.set(-150)
	assert.equal(host.translateY, -138)
	lease.set(-40)
	assert.equal(host.translateY, -28)
	lease.release()
	assert.deepEqual(host, { translateY: 12, translateX: 4, scaleY: 2, rotation: 30 })
	lease.release()
	lease.set(-300)
	assert.equal(lease.offset, 0)
	assert.equal(host.translateY, 12)
})

test('a foreign write becomes the baseline before the next measured movement', () => {
	let value = 5
	const lease = leaseKeyboardProperty(
		() => value,
		(next) => {
			value = next
		},
	)
	lease.set(-100)
	value = 20
	assert.equal(lease.offset, 0)
	lease.set(-80)
	assert.equal(value, -60)
	lease.release()
	assert.equal(value, 20)
})

test('cleanup preserves a newer foreign write and an unused lease writes nothing', () => {
	let value = 7,
		writes = 0
	const own = () =>
		leaseKeyboardProperty(
			() => value,
			(next) => {
				value = next
				writes++
			},
		)
	const unused = own()
	unused.release()
	assert.equal(writes, 0)
	const lease = own()
	lease.set(-80)
	value = 99
	lease.release()
	assert.equal(value, 99)
	assert.equal(writes, 1)
})

test('invalid displacement does not overwrite the current host property', () => {
	let value = 4
	const lease = leaseKeyboardProperty(
		() => value,
		(next) => {
			value = next
		},
	)
	lease.set(-20)
	assert.throws(() => lease.set(NaN), RangeError)
	assert.throws(() => lease.set(Infinity), RangeError)
	assert.equal(value, -16)
	lease.release()
	assert.equal(value, 4)
})
