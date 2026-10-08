import { describe, expect, it } from 'vitest'
import { Device, isAndroid, isIOS } from '@nativescript/core'

// Proves specs execute inside the real V8/JSC runtime with the platform
// bridge live — not in jsdom or the object-driver harness.
describe('native runtime', () => {
	it('reaches platform classes through the bridge', () => {
		if (isIOS) {
			const array = NSMutableArray.array<string>()
			array.addObject('xplat')
			expect(array.count).toBe(1)
			expect(Device.os).toBe('iOS')
		} else {
			expect(isAndroid, 'expected an iOS or Android runtime').toBe(true)
			const list = new java.util.ArrayList<string>()
			list.add('xplat')
			expect(list.size()).toBe(1)
			expect(Device.os).toBe('Android')
		}
	})
})
