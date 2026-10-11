import { it } from 'vitest'
import { launchWeb } from './web-driver.web'
import { CAPTURE_PROFILE } from './scenario'

declare const __CAPTURE_CONFIG__: null | {
	url: string
	runId: string
	revision: string
	scenarioHash: string
}

it.skipIf(!__CAPTURE_CONFIG__)('exports real web captures for the common cohort', async () => {
	for (const [index, displacement] of [0, 1].entries()) {
		const mounted = await launchWeb('switch--unchecked-light', { displacement })
		try {
			if (mounted.args.checked !== false || mounted.args.stageId !== mounted.storyId) {
				throw new Error('Wrong shared inputs for real web export')
			}

			const response = await fetch(__CAPTURE_CONFIG__!.url, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					...__CAPTURE_CONFIG__,
					...mounted.capture,
					url: undefined,
					profile: CAPTURE_PROFILE,
					args: { checked: false, stageId: mounted.storyId },
					index,
					displacement,
					runtime: {
						userAgent: navigator.userAgent,
						scale: window.devicePixelRatio,
						capture: 'Playwright stage screenshot',
					},
				}),
			})

			if (!response.ok) {
				throw new Error(`Capture export failed: ${response.status}`)
			}
		} finally {
			mounted.dispose()
		}
	}
})
