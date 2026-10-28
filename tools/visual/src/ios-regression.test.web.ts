import { expect, it } from 'vitest'
import { decodePng } from './web-driver.web'

declare const __IOS_CAPTURE__: null | {
	target: string
	provenance: string
	displacement: number
	pngBase64: string
}

it('unchecked light Switch real iOS capture', async () => {
	if (!__IOS_CAPTURE__) {
		throw new Error('Pass VIS_IOS_CAPTURE with a valid real capture JSON path')
	}

	expect(__IOS_CAPTURE__!.target).toBe('ios')
	expect(__IOS_CAPTURE__!.provenance).toBe('real')
	expect(__IOS_CAPTURE__!.displacement).toBe(0)
	const decoded = await decodePng(__IOS_CAPTURE__!.pngBase64)
	expect([decoded.width, decoded.height]).toEqual([96, 64])
	await expect(__IOS_CAPTURE__!.pngBase64).toMatchImageSnapshot({
		snapshotKey: 'real',
		createMissingBaseline: false,
	})
})
