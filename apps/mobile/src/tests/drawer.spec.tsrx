/** @jsxImportSource @octane-xplat/jsx */
import { describe, expect, it } from 'vitest'
import { Drawer } from '@octane-xplat/drawer'
import { Text } from '@octane-xplat/ui'
import { mountXplat, waitUntil } from '@octane-xplat/platform/testing'
type NativeDrawer = {
	isOpened(side: string): boolean
	close(side: string, duration: number): Promise<void>
	gestureEnabled: boolean
	panGestureHandler: unknown
	mainContent: unknown
	leftDrawer?: { getActualSize(): { width: number } }
}

function OpenDrawer() @{
	<Drawer
		id="drawer-host"
		defaultOpen
		reducedMotion
		main={<Text>Main</Text>}
		drawer={<Text>Menu</Text>}
	/>
}

describe('native Drawer', () => {
	it('mounts the gesture host, lays out slots and opens after layout', async () => {
		const { view } = await mountXplat(OpenDrawer)
		let host: NativeDrawer | undefined
		const find = (node: any): void => {
			if (node.id === 'drawer-host') {
				host = node
			}

			node.eachChildView?.((child: unknown) => {
				find(child)
				return true
			})
		}

		find(view)
		expect(host).toBeDefined()
		await waitUntil(() => host!.isOpened('left'), {
			message: 'defaultOpen never opened after layout',
		})

		expect(host!.gestureEnabled).toBe(true)
		expect(host!.panGestureHandler).toBeDefined()
		expect(host!.mainContent).toBeDefined()
		expect(host!.leftDrawer!.getActualSize().width).toBe(280)
		await host!.close('left', 0)
		expect(host!.isOpened('left')).toBe(false)
	})
})
