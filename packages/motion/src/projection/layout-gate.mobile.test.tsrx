/** @jsxImportSource @nativescript-community/octane */
import { describe, expect, it, vi } from 'vitest'
import {
	createObjectContainer,
	createObjectDriver,
	createUniversalRoot,
} from 'octane/universal/native'

import { motion } from '../index'
import { layoutSupported } from './barrier'

vi.mock('octane/universal/native', async (importOriginal) => ({
	...(await importOriginal<Record<string, unknown>>()),
	observeBatches: () => () => {},
}))

function LayoutBox() @{
	<motion.View id="box" layout />
}

describe('layout platform gate', () => {
	it('resolves a supported native barrier', () => {
		expect(layoutSupported).toBe(true)
	})

	it('renders a layout host on the native build', () => {
		const container = createObjectContainer('nativescript')
		const root = createUniversalRoot(container, createObjectDriver('nativescript'))
		expect(() => root.render(LayoutBox, {})).not.toThrow()
		root.unmount()
	})
})
