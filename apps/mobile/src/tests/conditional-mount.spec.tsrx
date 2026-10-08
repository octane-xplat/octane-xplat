/** @jsxImportSource @nativescript-community/octane */
import { describe, expect, it } from 'vitest'
import { useState } from 'octane'
import { Pressable, Text, View } from '@octane-xplat/ui'
import { findByTestId, mountXplat, tap, viewText, waitUntil } from '@octane-xplat/platform/testing'

function ToggleSubtree() @{
	const [show, setShow] = useState(false)

	<View>
		<Pressable testID="cond.toggle" onPress={() => setShow(!show)}>
			<Text>toggle</Text>
		</Pressable>
		@if (show) {
			<View testID="cond.branch">
				<Text>branch: shown</Text>
			</View>
		}
	</View>
}

describe('conditional mounting', () => {
	it('mounts and removes the conditional subtree with its state', async () => {
		const { view } = await mountXplat(ToggleSubtree)
		expect(findByTestId(view, 'cond.branch')).toBeUndefined()
		expect(viewText(view).includes('branch: shown')).toBe(false)

		await tap(findByTestId(view, 'cond.toggle')!)

		await waitUntil(() => findByTestId(view, 'cond.branch') !== undefined, {
			message: 'conditional branch never mounted',
		})

		expect(viewText(view).includes('branch: shown')).toBe(true)

		await tap(findByTestId(view, 'cond.toggle')!)

		await waitUntil(() => findByTestId(view, 'cond.branch') === undefined, {
			message: 'conditional branch never unmounted',
		})

		expect(viewText(view).includes('branch: shown')).toBe(false)
	})
})
