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
	Property: class { constructor(_opts?: any) {} register() {} },
	CSSType: () => () => {},
	registerElement: () => {},
	isAndroid: false,
	isIOS: false,
	ScrollView: class {},
	Application: { on() {}, off() {}, getRootView() {} },
	Screen: { mainScreen: { widthDIPs: 800, heightDIPs: 600, scale: 1 } },
	Utils: { layout: { getDisplayDensity: () => 1 } },
}))

vi.mock('./theme/theme-scheme', () => ({ useThemeScheme: () => 'light' }))
// These cases omit decorative icons; SDK SVG registration belongs to device checks.
vi.mock('./Icon', () => ({ Icon: () => null }))
vi.mock('./Icon.tsrx', () => ({ Icon: () => null }))
vi.mock('./pan', () => ({ usePan: () => undefined }))
vi.mock('./Popover', () => ({ Popover: () => null }))
// Keep pure source conversion while skipping the SDK's SVGView registration.
vi.mock('./svg', async () => await import('./svg-source'))
import { NavigationChrome, type NavigationChromeKind } from '../tests/navigation-item-cases.tsrx'
import { checkedLinkFixture } from '../tests/validated-destination-cases.tsrx'

function nodes(node: any): any[] {
	return [node, ...(node.children ?? []).flatMap(nodes)]
}

async function settle() {
	flushUniversalSync(() => {})
	await new Promise((resolve) => setTimeout(resolve, 0))
	flushUniversalSync(() => {})
}

const kinds = {
	link: 'fixture-navlink',
	strip: 'vx-navmenu-strip-item',
	side: 'vx-sidenav-item-main',
	top: 'vx-topnav-item',
	mega: 'vx-topnavmegamenu-item',
	breadcrumb: 'vx-breadcrumb-link',
	heading: 'vx-navmenu-item',
	tab: 'vx-tab',
	'menu-surface': 'vx-menu-item',
}

for (const [kind, token] of Object.entries(kinds)) {
	it(`keeps native ${kind} activation checked and bound to its flow`, async () => {
		const fixture = checkedLinkFixture()
		const checked = await fixture.router
			.forStack('library')
			.validateDestination({ to: '/from-data/:id', params: { id: kind }, search: { page: 2 } })

		if (checked.status !== 'valid') {
			throw new Error('Expected valid destination')
		}

		const container = createObjectContainer('nativescript')
		const root = createUniversalRoot(container, createObjectDriver('nativescript'))
		const props = {
			kind: kind as NavigationChromeKind,
			router: fixture.router,
			destination: checked.destination,
			disabled: false,
			cancel: false,
		}

		const target = () =>
			nodes(container).find((node) =>
				String(node.props?.className)
					.split(/[\s,]+/)
					.includes(token),
			)!

		try {
			root.render(NavigationChrome, { ...props, disabled: true })
			await settle()
			expect(() =>
				container.dispatchEvent(target(), 'tap', { eventName: 'tap', object: target() }),
			).toThrow('no "tap" listener')

			expect(fixture.loads).toBe(0)
			root.render(NavigationChrome, props)
			await settle()
			container.dispatchEvent(target(), 'tap', { eventName: 'tap', object: target() })
			await settle()
			expect(fixture.router.forStack('library').getSnapshot().route).toMatchObject({
				params: { id: kind },
				data: kind + ':2',
			})

			expect(fixture.router.getSnapshot().route).toBeNull()
			expect(fixture.loads).toBe(1)
		} finally {
			root.unmount()
			fixture.router.dispose()
		}
	})
}
