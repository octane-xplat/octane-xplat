import { expect, it, vi } from 'vitest'
import { launchMock } from './mock-driver.web'
import { mountStory } from './adapter.web'

it('unchecked light Switch mock workflow', async () => {
	const sentinel = document.createElement('div')
	document.body.append(sentinel)
	let mounted: Awaited<ReturnType<typeof launchMock>> | undefined
	try {
		mounted = await launchMock('switch--unchecked-light')
		expect(mounted.capture.provenance).toBe('mock')
		expect(mounted.host.querySelector('[data-story-id]')?.getAttribute('data-story-id')).toBe(
			'switch--unchecked-light',
		)

		await expect(mounted.capture.pngBase64).toMatchImageSnapshot({
			snapshotKey: 'mock',
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

it('rejects unknown selection without allocating a host', () => {
	const before = document.body.childElementCount
	expect(() => mountStory('unknown')).toThrow('Unknown story')
	expect(document.body.childElementCount).toBe(before)
})

it('disposes its Octane host when fixture capture fails', async () => {
	const before = document.body.childElementCount
	const fetchMock = vi
		.spyOn(globalThis, 'fetch')
		.mockRejectedValueOnce(new Error('Injected fixture failure'))

	try {
		await expect(launchMock('switch--unchecked-light')).rejects.toThrow('Injected fixture failure')
		expect(document.body.childElementCount).toBe(before)
	} finally {
		fetchMock.mockRestore()
	}
})
