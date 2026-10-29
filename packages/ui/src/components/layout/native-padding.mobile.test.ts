import { describe, expect, it } from 'vitest'

import { leaseNativePaddingBottom } from './native-padding'

describe('leaseNativePaddingBottom', () => {
	it('does not accumulate against Mason float32 readback', () => {
		const view: any = { style: { paddingBottom: 0 } }
		const lease = leaseNativePaddingBottom(view)
		// Mason stores padding as Length and reads { value: f32, unit: 'px' }.
		const write = view.style
		Object.defineProperty(view.style, 'paddingBottom', {
			get() {
				return { value: Math.fround(write.__v ?? 0), unit: 'px' }
			},
			set(v: number) {
				write.__v = v
			},
		} as any)
		lease.set(412.3333)
		lease.set(412.3333)
		expect(write.__v).toBeCloseTo(412.3333, 3)
	})

	it('keeps a user-supplied Length baseline', () => {
		const view: any = { style: { paddingBottom: { value: 16, unit: 'px' } } }
		const lease = leaseNativePaddingBottom(view)
		lease.set(100)
		expect(view.style.paddingBottom).toBe(116)
		lease.release()
		expect(view.style.paddingBottom).toBe(16)
	})

	it('still works with a plain-number style', () => {
		const view: any = { style: { paddingBottom: 4 } }
		const lease = leaseNativePaddingBottom(view)
		lease.set(50)
		expect(view.style.paddingBottom).toBe(54)
		lease.release()
		expect(view.style.paddingBottom).toBe(4)
	})
})
