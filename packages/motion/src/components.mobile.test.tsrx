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
