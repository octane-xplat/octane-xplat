/** @jsxImportSource @nativescript-community/octane */
import { describe, expect, it, vi } from 'vitest'
import { createObjectContainer, createObjectDriver, createUniversalRoot, flushUniversalSync } from 'octane/universal/native'

vi.mock('@nativescript/core', () => ({ isIOS: false, isAndroid: true }))

import { useOutlineFromView } from './outline-view.tsrx'

// useOutlineFromView native lane — the hook walks a bound view subtree once
// and collects views with accessibilityRole 'header'. No mutation
// observation on the view tree.

let captured: any

const Probe = (props: any) => @{
	captured = useOutlineFromView(props.container)

	<label text="probe" />
}

// The collection effect settles through microtasks before the sync flush.
async function settle() {
	for (let i = 0; i < 12; i++) {
		await Promise.resolve()
	}

	flushUniversalSync(() => {})
}

describe('useOutlineFromView (universal renderer)', () => {
	it('collects header-role views into outline items', async () => {
		const tree = {
			children: [
				{
					accessibilityRole: 'header',
					id: 'intro',
					className: 'vx-h1',
					children: [{ text: 'Intro' }],
				},
				{ children: [{ text: 'body' }] },
				{
					accessibilityRole: 'header',
					className: 'vx-h2',
					children: [{ text: 'Details' }],
				},
			],
		}

		const container = createObjectContainer('nativescript')
		const root = createUniversalRoot(container, createObjectDriver('nativescript'))
		flushUniversalSync(() => root.render(Probe as any, { container: tree }))
		await settle()

		expect(captured).toEqual([
			{ id: 'intro', label: 'Intro', level: 1 },
			{ id: 'details', label: 'Details', level: 2 },
		])

		root.unmount()
	})

	it('returns an empty list without a container', async () => {
		const container = createObjectContainer('nativescript')
		const root = createUniversalRoot(container, createObjectDriver('nativescript'))
		flushUniversalSync(() => root.render(Probe as any, { container: null }))
		await settle()

		expect(captured).toEqual([])
		root.unmount()
	})
})
