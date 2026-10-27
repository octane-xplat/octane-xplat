/** @jsxImportSource @octane-xplat/jsx */
import {
	createObjectContainer,
	createObjectDriver,
	createUniversalRoot,
	flushUniversalSync,
} from 'octane/universal/native'

import { expect, it, vi } from 'vitest'

vi.mock('@nativescript/core', () => ({
	// ui-svg's index.common.ts evaluates NS decorators at import.
	Property: class { constructor(_opts?: any) {} },
	CSSType: () => () => {},
	isAndroid: false,
	isIOS: false,
	ScrollView: class {},
	Application: { on() {}, off() {} },
	Utils: { layout: { getDisplayDensity: () => 1 } },
}))

import { CheckedLinks, checkedLinkFixture } from '../tests/validated-destination-cases.tsrx'

function nodes(node: any): any[] {
	return [node, ...(node.children ?? []).flatMap(nodes)]
}

async function settle() {
	flushUniversalSync(() => {})
	await new Promise((resolve) => setTimeout(resolve, 0))
	flushUniversalSync(() => {})
}

it('activates an intact checked value through the native link and owning flow', async () => {
	const fixture = checkedLinkFixture()
	const checked = await fixture.router
		.forStack('library')
		.validateDestination({ to: '/from-data/:id', params: { id: 'coat' }, search: { page: 2 } })

	if (checked.status !== 'valid') {
		throw new Error('Expected valid destination')
	}

	const container = createObjectContainer('nativescript')
	const root = createUniversalRoot(container, createObjectDriver('nativescript'))
	const props = {
		router: fixture.router,
		destination: checked.destination,
		disabled: false,
		cancel: false,
	}

	const link = () => nodes(container).find((node) => node.props?.id === 'checked-link')!
	try {
		root.render(CheckedLinks, { ...props, disabled: true })
		await settle()
		expect(() =>
			container.dispatchEvent(link(), 'tap', { eventName: 'tap', object: link() }),
		).toThrow('no "tap" listener')

		expect(fixture.loads).toBe(0)
		root.render(CheckedLinks, { ...props, cancel: true })
		await settle()
		container.dispatchEvent(link(), 'tap', { eventName: 'tap', object: link() })
		await settle()
		expect(fixture.loads).toBe(0)
		root.render(CheckedLinks, props)
		await settle()
		container.dispatchEvent(link(), 'tap', { eventName: 'tap', object: link() })
		await settle()
		expect(fixture.router.forStack('library').getSnapshot().route).toMatchObject({
			contract: 'runtime',
			params: { id: 'coat' },
			data: 'coat:2',
		})

		expect(fixture.router.getSnapshot().route).toBeNull()
		expect(String(link().props.className)).toContain('selected')
		fixture.registration.dispose()
		await settle()
		container.dispatchEvent(link(), 'tap', { eventName: 'tap', object: link() })
		await settle()
		expect(fixture.loads).toBe(1)
	} finally {
		root.unmount()
		fixture.router.dispose()
	}
})
