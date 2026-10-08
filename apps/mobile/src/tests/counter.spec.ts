import { describe, expect, it } from 'vitest'
import { ContentView, type View, type ViewBase } from '@nativescript/core'
import { renderNativeScriptApp } from '@nativescript-community/octane'
import { mount, nextRenderPass, tap, waitUntil } from '@nativescript/unit-test-runner/testing'
import { Counter } from '@xplat/demos/Counter.tsrx'

// Collect every text-bearing descendant — the harness doesn't expose a
// query layer, so walk the native tree directly.
function texts(root: ViewBase): string[] {
	const out: string[] = []
	const visit = (view: ViewBase) => {
		const text = (view as { text?: unknown }).text
		if (typeof text === 'string') {
			out.push(text)
		}
		;(view as View).eachChildView?.((child) => {
			visit(child)
			return true
		})
	}
	visit(root)
	return out
}

describe('xplat component in a real runtime', () => {
	it('mounts, reacts to a tap, and unmounts cleanly', async () => {
		let root: ReturnType<typeof renderNativeScriptApp> | undefined
		const { view, host, unmount } = await mount(() => {
			const holder = new ContentView()
			root = renderNativeScriptApp(holder, Counter)
			return holder
		})

		const inc = view.getViewById<View>('counter-inc')
		const dec = view.getViewById<View>('counter-dec')
		expect(inc && inc.isLoaded, 'counter-inc Pressable resolves to a loaded native view').toBe(
			true,
		)

		expect(
			texts(view).some((t) => t.includes('Demo count: 0')),
			'counter renders its initial state',
		).toBe(true)

		// tap() dispatches through the gesture-observer path — it exercises
		// Pressable's onTap wiring, not OS hit-testing.
		await tap(inc as View)
		await waitUntil(() => texts(view).some((t) => t.includes('Demo count: 1')), {
			message: 'tap did not reach the Pressable onPress handler',
		})

		await tap(dec as View)
		await waitUntil(() => texts(view).some((t) => t.includes('Demo count: 0')))

		root?.unmount()
		await unmount()
		await nextRenderPass()
		expect(host.content).toBe(null)
	})
})
