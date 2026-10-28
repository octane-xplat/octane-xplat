import { expect, it } from 'vitest'
import { decodePng, launchWeb, pixelsEqual } from './web-driver.web'
import { mountStory } from './adapter.web'

it('unchecked light Switch real web capture', async () => {
	const sentinel = document.createElement('div')
	document.body.append(sentinel)
	let mounted: Awaited<ReturnType<typeof launchWeb>> | undefined
	try {
		mounted = await launchWeb('switch--unchecked-light')
		expect(mounted.capture.provenance).toBe('real')
		expect(mounted.capture.width).toBe(96)
		expect(mounted.capture.height).toBe(64)
		expect(mounted.host.querySelector('[data-story-id]')?.getAttribute('data-story-id')).toBe(
			'switch--unchecked-light',
		)

		await expect(mounted.capture.pngBase64).toMatchImageSnapshot({
			snapshotKey: 'real',
			createMissingBaseline: false,
		})
	} finally {
		mounted?.dispose()
		mounted?.dispose()
		if (mounted) {
			expect(mounted.host.isConnected).toBe(false)
		}

		expect(sentinel.isConnected).toBe(true)
		sentinel.remove()
	}
})

it('args updates and story switches leave no residual pixels', async () => {
	const first = await launchWeb('switch--unchecked-light')
	try {
		const initial = await decodePng(first.capture.pngBase64)

		first.update({ checked: true })
		await first.recapture()
		expect(first.host.querySelector('[role="switch"]')?.getAttribute('aria-checked')).toBe('true')

		first.update({ checked: false })
		const returned = await decodePng((await first.recapture()).pngBase64)
		expect(pixelsEqual(initial, returned)).toBe(true)
	} finally {
		first.dispose()
	}

	expect(first.host.isConnected).toBe(false)

	const away = await launchWeb('switch--checked-light')
	try {
		expect(away.host.querySelector('[role="switch"]')?.getAttribute('aria-checked')).toBe('true')
	} finally {
		away.dispose()
	}

	expect(away.host.isConnected).toBe(false)

	const back = await launchWeb('switch--unchecked-light')
	try {
		const baseline = await decodePng(first.capture.pngBase64)
		const afterSwitch = await decodePng(back.capture.pngBase64)
		expect(pixelsEqual(baseline, afterSwitch)).toBe(true)
	} finally {
		back.dispose()
	}
})

it('rejects unknown selection without allocating a host', () => {
	const before = document.body.childElementCount
	expect(() => mountStory('unknown')).toThrow('Unknown story')
	expect(document.body.childElementCount).toBe(before)
})
