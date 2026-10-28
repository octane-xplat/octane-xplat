import fixedPng from '../fixtures/mock.png?url'
import alteredPng from '../fixtures/mock-one-pixel.png?url'
import { mountStory } from './adapter.web'

declare const __MOCK_ALTERED__: boolean

/** Returns fixture bytes, never a screenshot of the mounted story. */
export async function launchMock(storyId: string) {
	const mounted = mountStory(storyId)
	try {
		const control = await waitForSwitch(mounted.host)
		if (mounted.storyId !== storyId || control.getAttribute('aria-checked') !== 'false') {
			throw new Error(
				`Wrong story or args before mock capture: ${mounted.storyId}, ${control.getAttribute('aria-checked')}`,
			)
		}

		const response = await fetch(__MOCK_ALTERED__ ? alteredPng : fixedPng)
		if (!response.ok) {
			throw new Error(`Mock fixture load failed: ${response.status}`)
		}

		const bytes = new Uint8Array(await response.arrayBuffer())
		return {
			...mounted,
			capture: {
				pngBase64: btoa(String.fromCharCode(...bytes)),
				provenance: 'mock' as const,
				storyId,
				target: 'web' as const,
				profile: 'switch-light-96x64@1',
				width: 96,
				height: 64,
			},
		}
	} catch (error) {
		mounted.dispose()
		throw error
	}
}

async function waitForSwitch(host: HTMLElement) {
	const deadline = performance.now() + 2000
	while (performance.now() < deadline) {
		const control = host.querySelector('[role="switch"]')
		if (control) {
			return control
		}

		await new Promise(requestAnimationFrame)
	}

	throw new Error('Switch render readiness timed out')
}
