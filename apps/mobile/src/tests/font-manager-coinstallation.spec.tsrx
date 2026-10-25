/** @jsxImportSource @nativescript-community/octane */
import { expect, it } from 'vitest'
import type { View as NativeView } from '@nativescript/core'
import { FontFace, FontFaceSet } from '@nativescript/font-manager'
import { Screen, Text, View } from '@octane-xplat/ui'
import { mountXplat, waitUntil } from '@octane-xplat/platform/testing'

function FontLayout() @{
	<Screen>
		<View id="font-layout" style={{ width: 107, height: 200 }}>
			<Text style={{ fontFamily: 'Geist' }}>Shared native font support</Text>
		</View>
	</Screen>
}

it('loads a font through the standalone plugin while Mason lays out native content', async () => {
	const face = new FontFace('Geist', 'url(~/fonts/Geist.ttf)')
	const fonts = FontFaceSet.instance
	try {
		await face.load()
		fonts.add(face)
		await fonts.ready
		expect(face.status).toBe('loaded')
		expect(fonts.check('16px Geist')).toBe(true)

		const { view } = await mountXplat(FontLayout)
		const content = view.getViewById<NativeView>('font-layout')!
		await waitUntil(() => content.getActualSize().height > 0)
		expect(content.getActualSize().width).toBeCloseTo(107, 0)
		expect(content.getActualSize().height).toBeCloseTo(200, 0)
	} finally {
		fonts.delete(face)
	}
})
