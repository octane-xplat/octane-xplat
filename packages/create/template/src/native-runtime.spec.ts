import { describe, expect, it } from 'vitest'
import { Device, isAndroid, isIOS, knownFolders } from '@nativescript/core'

// This executes NativeScript's filesystem bridge in the actual mobile host.
// Only this test's uniquely named temporary file is written and removed.
describe('native runtime', () => {
	it('round-trips a file through the native bridge', () => {
		expect(isAndroid || isIOS).toBe(true)
		expect(Device.os).toBe(isAndroid ? 'Android' : 'iOS')
		const file = knownFolders.temp().getFile(`xplat-native-test-${Date.now()}.txt`)
		try {
			file.writeTextSync('octane-xplat')
			expect(file.readTextSync()).toBe('octane-xplat')
		} finally {
			file.removeSync()
		}
	})
})
