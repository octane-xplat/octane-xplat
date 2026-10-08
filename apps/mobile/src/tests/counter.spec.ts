import { describe, expect, it } from 'vitest'
import type { View } from '@nativescript/core'
import { mountXplat, nextRenderPass, tap, viewText, waitUntil } from '@octane-xplat/platform/testing'
import { Counter } from '@xplat/demos/Counter.tsrx'

describe('xplat component in a real runtime', () => {
	it('mounts, reacts to a tap, and unmounts cleanly', async () => {
		const { view, host, unmount } = await mountXplat(Counter)

		const inc = view.getViewById<View>('counter-inc')
		const dec = view.getViewById<View>('counter-dec')
		expect(inc && inc.isLoaded, 'counter-inc Pressable resolves to a loaded native view').toBe(
			true,
		)

		expect(
			viewText(view).some((t) => t.includes('Demo count: 0')),
			'counter renders its initial state',
		).toBe(true)

		// tap() dispatches through the gesture-observer path — it exercises
		// Pressable's onTap wiring, not OS hit-testing.
		await tap(inc as View)
		await waitUntil(() => viewText(view).some((t) => t.includes('Demo count: 1')), {
			message: 'tap did not reach the Pressable onPress handler',
		})

		await tap(dec as View)
		await waitUntil(() => viewText(view).some((t) => t.includes('Demo count: 0')))

		await unmount()
		await nextRenderPass()
		expect(host.content).toBe(null)
	})
})
