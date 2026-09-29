/** @jsxImportSource @nativescript-community/octane */
import { describe, expect, it } from 'vitest'
import { createObjectContainer, createObjectDriver, createUniversalRoot, flushUniversalSync } from 'octane/universal/native'
import { motion, MotionConfig } from './index'

function NativeBox(props: any) @{
	<MotionConfig reducedMotion="always">
		<motion.View id="native" initial={{ x: 10 }} animate={{ x: props.x }} transition={{ duration: 20 }} />
	</MotionConfig>
}

describe('native compiled hosts', () => {
	it('updates retained hosts through universal context and props', () => {
		const container = createObjectContainer('nativescript')
		const root = createUniversalRoot(container, createObjectDriver('nativescript'))
		root.render(NativeBox, { x: 50 })
		const node: any = container.children[0]
		expect(node.translateX).toBe(50)
		flushUniversalSync(() => root.render(NativeBox, { x: 80 }))
		expect(container.children[0]).toBe(node)
		expect(node.translateX).toBe(80)
		root.unmount()
		expect(container.children.length).toBe(0)
	})
})

import { vi } from 'vitest'
import { useEffect } from 'octane'
import { Presence } from './index'
let nativeCleanups = 0
function NativeChild() @{
	useEffect(() => () => { nativeCleanups++ }, [])

	<motion.View id="child" animate={{ x: 0 }} exit={{ x: 100 }} transition={{ duration: 0.1 }} />
}

function NativePresence(props: any) @{
	<Presence present={props.present} onExitComplete={props.done}><NativeChild /></Presence>
}

describe('native presence lifecycle', () => {
	it('retains and reverses a live subtree, then removes exactly once', async () => {
		vi.useFakeTimers(); nativeCleanups = 0
		const container = createObjectContainer('nativescript')
		const root = createUniversalRoot(container, createObjectDriver('nativescript'))
		const done = vi.fn()
		root.render(NativePresence, { present: true, done })
		const boundary: any = container.children[0]
		const child = boundary.children[0]
		root.render(NativePresence, { present: false, done })
		expect(boundary.isUserInteractionEnabled).toBe(false)
		expect(nativeCleanups).toBe(0)
		await vi.advanceTimersByTimeAsync(32)
		root.render(NativePresence, { present: true, done })
		await vi.advanceTimersByTimeAsync(200)
		flushUniversalSync(() => {})
		expect(container.children[0]).toBe(boundary)
		expect(boundary.children[0]).toBe(child)
		expect(nativeCleanups).toBe(0); expect(done).not.toHaveBeenCalled()
		root.render(NativePresence, { present: false, done })
		await vi.advanceTimersByTimeAsync(200)
		flushUniversalSync(() => {})
		expect(container.children.length).toBe(0)
		expect(nativeCleanups).toBe(1); expect(done).toHaveBeenCalledTimes(1)
		root.unmount(); vi.useRealTimers()
	})
})

import { signal$ } from 'octane/signals'
const destination$ = signal$(0)
function NativeSignal() @{
	<motion.Pressable onPress={() => destination$.set(75)} animate={{ x: destination$.get() }} transition={{ duration: 0 }} />
}

it('retargets a retained native host on a signal write', () => {
	const container = createObjectContainer('nativescript')
	const root = createUniversalRoot(container, createObjectDriver('nativescript'))
	root.render(NativeSignal, {})
	const node: any = container.children[0]
	flushUniversalSync(() => container.dispatchEvent(node, 'tap', {}))
	expect(container.children[0]).toBe(node)
	expect(node.translateX).toBe(75)
	root.unmount()
})
