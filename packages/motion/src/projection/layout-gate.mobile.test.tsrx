/** @jsxImportSource @nativescript-community/octane */
import { describe, expect, it } from 'vitest'
import { createObjectContainer, createObjectDriver, createUniversalRoot } from 'octane/universal/native'
import { motion } from '../index'

function LayoutBox() @{
	<motion.View id="box" layout />
}

describe('layout platform gate', () => {
	it('throws on the native default build', () => {
		const container = createObjectContainer('nativescript')
		const root = createUniversalRoot(container, createObjectDriver('nativescript'))
		expect(() => root.render(LayoutBox, {})).toThrow('motion: layout is not yet supported on this platform')
		root.unmount()
	})
})
