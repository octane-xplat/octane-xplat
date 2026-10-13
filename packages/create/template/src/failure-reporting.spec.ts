import { describe, expect, it } from 'vitest'

// An intentionally failing assertion, marked expected-to-fail: it proves
// assertion failures on device cross the WebSocket bridge and surface as
// real Vitest failures (it.fails inverts the outcome, keeping the committed
// suite green while pinning the failure-reporting path).
describe('failure reporting', () => {
	it.fails('a failed assertion on device is reported as a failure', () => {
		expect('octane-xplat').toBe('a different string entirely')
	})
})
