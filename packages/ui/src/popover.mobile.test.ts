import { describe, expect, it, vi } from 'vitest'

const hosts: any[] = []

vi.mock('@nativescript/core', () => ({
	Application: {
		primaryWindow: undefined,
		on: () => {},
		off: () => {},
	},
	GridLayout: class {
		className = ''
		horizontalAlignment = ''
		verticalAlignment = ''
		style: Record<string, unknown> = {}
		on() {}
		off() {}
		constructor() {
			hosts.push(this)
		}
	},
}))

vi.mock('@nativescript-community/octane', async (importOriginal) => ({
	...(await importOriginal<Record<string, unknown>>()),
	createNativeScriptRoot: () => ({ render() {}, unmount() {} }),
}))

vi.mock('./root-layout.mobile', () => ({
	rootLayoutFor: () => ({
		open: async () => {},
		hasChild: () => false,
		close: async () => {},
	}),
}))

import {
	createObjectContainer,
	createObjectDriver,
	createUniversalRoot,
	flushUniversalSync,
} from 'octane/universal/native'

import { Popover } from './Popover.tsrx'

// The full-screen host must not wear the caller's className — a backgrounded
// class like vx-menu would paint the whole screen (0.4.0–0.6.0 regression).
describe('native Popover host', () => {
	it('stamps only vx-popover-host on the overlay host', async () => {
		const container = createObjectContainer('nativescript')
		const root = createUniversalRoot(container, createObjectDriver('nativescript'))
		const anchor = { current: {} }
		root.render(Popover as any, { open: true, anchor, className: 'vx-menu' })
		flushUniversalSync(() => {})
		await vi.waitFor(() => expect(hosts.length).toBe(1))

		expect(hosts).toHaveLength(1)
		expect(hosts[0].className).toContain('vx-popover-host')
		expect(hosts[0].className).not.toContain('vx-menu')
		root.unmount()
	})
})
