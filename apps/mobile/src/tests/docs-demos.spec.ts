import { describe, expect, it } from 'vitest'
import type { View } from '@nativescript/core'
import {
	mountXplat,
	tap,
	viewText,
	waitUntil,
	findByTestId,
	enterText,
	type TextInputView,
} from '@octane-xplat/platform/testing'

import { GoalCounter } from '@xplat/demos/GoalCounter.tsrx'
import { PackingList } from '@xplat/demos/PackingList.tsrx'

describe('docs demos in a native runtime', () => {
	it('completes, undoes and resets a goal', async () => {
		const { view } = await mountXplat(GoalCounter)
		const text = () => viewText(view).join(' ')
		const press = async (id: string) => {
			await tap(view.getViewById<View>(id)!)
		}

		for (let i = 1; i <= 5; i++) {
			await press('goal-add')
			await waitUntil(() => text().includes(`${i} of 5`))
		}

		expect(text()).toContain('goal reached!')
		await press('goal-undo')
		await waitUntil(() => text().includes('4 of 5'))
		await press('goal-reset')
		await waitUntil(() => text().includes('0 of 5'))
	})

	it('filters bundled items and preserves completion through search, then resets', async () => {
		const { view } = await mountXplat(PackingList)
		const text = () => viewText(view).join(' ')
		const field = findByTestId<TextInputView>(view, 'packing-search')!
		await enterText(field, 'water')
		await waitUntil(() => text().includes('1 shown'))
		await tap(view.getViewById<View>('pack-water')!)
		await waitUntil(() => text().includes('1 of 4 items packed'))
		await enterText(field, 'zzz')
		await waitUntil(() => text().includes('No matching items'))
		await tap(view.getViewById<View>('packing-reset')!)
		await waitUntil(() => text().includes('0 of 4 items packed; 4 shown'))
		expect(field.text).toBe('')
	})
})
