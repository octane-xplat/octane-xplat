/** @jsxImportSource @nativescript-community/octane */
import { beforeEach, describe, expect, it } from 'vitest'
import { isAndroid } from '@nativescript/core'
import { createContext, useContext, useEffect, useState } from 'octane'
import type { View } from '@nativescript/core'
import { Pressable, Text, View as XplatView } from '@octane-xplat/ui'
import {
	findByTestId,
	mountXplat,
	tap,
	waitUntil,
} from '@octane-xplat/platform/testing'

type Surface = 'sheet' | 'menu'

const AccountName = createContext('unset')
const AccountNameProvider: any = AccountName
const rendered: Record<Surface, string> = { sheet: 'unset', menu: 'unset' }
const mounted: Record<Surface, number> = { sheet: 0, menu: 0 }
const cleaned: Record<Surface, number> = { sheet: 0, menu: 0 }

function PortalContextProbe(props: { surface: Surface }) @{
	const value = useContext(AccountName)
	rendered[props.surface] = value
	useEffect(() => {
		mounted[props.surface] += 1
		return () => {
			cleaned[props.surface] += 1
		}
	}, [props.surface])

	<Text testID={'portal.' + props.surface + '.value'}>{value}</Text>
}

function PortalContextFixture() @{
	const [name, setName] = useState('before')
	const [visible, setVisible] = useState(true)

	<AccountNameProvider value={name}>
		<rootlayout>
			<masonview display="grid">
				<Pressable testID="portal.update" onPress={() => setName('after')}>
					<Text>Update context</Text>
				</Pressable>
				<Pressable testID="portal.remove" onPress={() => setVisible(false)}>
					<Text>Remove portals</Text>
				</Pressable>
				@if (visible) {
					<>
						<AndroidSheet open content={() => <PortalContextProbe surface="sheet" />} />
						<AndroidContextMenu
							items={[]}
							trigger={() => (
								<XplatView>
									<PortalContextProbe surface="menu" />
								</XplatView>
							)}
						/>
					</>
				}
			</masonview>
		</rootlayout>
	</AccountNameProvider>
}

let AndroidSheet: any
let AndroidContextMenu: any

describe('Android plugin portals preserve context', () => {
	beforeEach(() => {
		for (const surface of ['sheet', 'menu'] as const) {
			rendered[surface] = 'unset'
			mounted[surface] = 0
			cleaned[surface] = 0
		}
	})

	it.skipIf(!isAndroid)('updates provider values and cleans up hosted content', async () => {
		;({ MaterialBottomSheet: AndroidSheet } = await import('@octane-xplat/sheet/android'))
		;({ MaterialContextMenu: AndroidContextMenu } = await import('@octane-xplat/context-menu/android'))

		const { view, unmount } = await mountXplat(PortalContextFixture)
		await waitUntil(() => mounted.sheet > 0 && mounted.menu > 0, {
			message: 'plugin portal children did not mount',
		})
		expect(rendered.sheet).toBe('before')
		expect(rendered.menu).toBe('before')

		await tap(findByTestId<View>(view, 'portal.update')!)
		await waitUntil(() => rendered.sheet === 'after' && rendered.menu === 'after', {
			message: 'plugin portal children did not receive the provider update',
		})

		await tap(findByTestId<View>(view, 'portal.remove')!)
		await waitUntil(
			() => cleaned.sheet >= mounted.sheet && cleaned.menu >= mounted.menu,
			{ message: 'plugin portal children stayed mounted after their owners unmounted' },
		)
		await unmount()
	})
})
