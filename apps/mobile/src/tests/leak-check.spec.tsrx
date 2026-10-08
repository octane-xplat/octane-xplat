/** @jsxImportSource @nativescript-community/octane */
import { describe, expect, it } from 'vitest'
import { useEffect, useSyncExternalStore } from 'octane'
import { Text } from '@octane-xplat/ui'
import { mountXplat } from '@octane-xplat/platform/testing'

// Observable cleanup contracts: every effect subscribe must pair with a
// cleanup at unmount, delayed work must stop firing, and a re-mount must not
// leave the previous root subscribed.
let activeEffects = 0
let ticks = 0

function IntervalCounter() @{
	useEffect(() => {
		activeEffects += 1
		const timer = setInterval(() => {
			ticks += 1
		}, 15)

		return () => {
			activeEffects -= 1
			clearInterval(timer)
		}
	}, [])

	<Text>interval</Text>
}

const listeners = new Set<() => void>()

function StoreReader() @{
	const count = useSyncExternalStore(
		(callback) => {
			listeners.add(callback)
			return () => {
				listeners.delete(callback)
			}
		},
		() => listeners.size,
	)

	<Text>{'subs: ' + count}</Text>
}

describe('mount/unmount cleanup', () => {
	it('runs effect cleanups and stops delayed work at unmount', async () => {
		ticks = 0
		for (let i = 0; i < 3; i++) {
			const { unmount } = await mountXplat(IntervalCounter)
			expect(activeEffects, 'each mount subscribes exactly once').toBe(1)
			await unmount()
			expect(activeEffects, 'unmount runs the effect cleanup').toBe(0)
		}

		// The cleared interval must not fire after the last unmount.
		const settled = ticks
		await new Promise((resolve) => setTimeout(resolve, 60))
		expect(ticks, 'interval work continued after unmount').toBe(settled)
	})

	it('releases external-store subscriptions at unmount', async () => {
		for (let i = 0; i < 3; i++) {
			const { unmount } = await mountXplat(StoreReader)
			expect(listeners.size, 'each mount subscribes exactly once').toBe(1)
			await unmount()
			expect(listeners.size, 'unmount releases the subscription').toBe(0)
		}
	})

	it('re-mounting replaces the previous root instead of leaking it', async () => {
		await mountXplat(IntervalCounter)
		expect(activeEffects).toBe(1)
		// mountXplat drops the previous root — its cleanup must already have run.
		await mountXplat(IntervalCounter)
		expect(activeEffects, 'previous root stayed subscribed after re-mount').toBe(1)
	})
})
