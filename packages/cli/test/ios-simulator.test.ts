import assert from 'node:assert/strict'
import test from 'node:test'
import { prepareIosSimulator } from '../src/ios-simulator.ts'

for (const state of ['Shutdown', 'Booted', 'physical']) {
	test(`prepare simulator: ${state}`, () => {
		const calls: string[][] = []
		prepareIosSimulator('phone', (_cmd, args) => {
			calls.push(args)
			return args.includes('list')
				? JSON.stringify({
						devices: { ios: state === 'physical' ? [] : [{ udid: 'phone', state }] },
					})
				: ''
		})
		assert.deepEqual(calls, [
			['simctl', 'list', 'devices', 'available', '-j'],
			...(state === 'Shutdown' ? [['simctl', 'boot', 'phone']] : []),
			...(state === 'physical' ? [] : [['simctl', 'bootstatus', 'phone', '-b']]),
		])
	})
}

test('failed simulator boot prevents native launch', () => {
	assert.throws(
		() =>
			prepareIosSimulator('phone', (_cmd, args) =>
				args.includes('list')
					? JSON.stringify({ devices: { ios: [{ udid: 'phone', state: 'Shutdown' }] } })
					: null,
			),
		/Unable to boot/,
	)
})
