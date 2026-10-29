/** @jsxImportSource @octane-xplat/jsx */
import { describe, expect, it, vi } from 'vitest'
import {
	createObjectContainer,
	createObjectDriver,
	createUniversalRoot,
	flushUniversalSync,
} from 'octane/universal/native'

vi.mock('@nativescript/core', () => ({
	// ui-svg's index.common.ts evaluates NS decorators at import.
	Property: class {
		constructor(_opts?: any) {}
		register() {}
	},
	CSSType: () => () => {},
	registerElement: () => {},
	View: class {},
	isIOS: false,
	isAndroid: true,
}))

import { getOutlineFromViewCapabilities, useOutlineFromView } from './outline-view.tsrx'

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
	it('reports native view-tree snapshots as supported', () => {
		expect(getOutlineFromViewCapabilities()).toEqual({ isSupported: true, mode: 'snapshot' })
	})

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
		flushUniversalSync(() => root.render(Probe, { container: tree }))
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
		flushUniversalSync(() => root.render(Probe, { container: null }))
		await settle()

		expect(captured).toEqual([])
		root.unmount()
	})
})
