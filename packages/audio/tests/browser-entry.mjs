import { run } from './incremental-queue.ts'
const cleanups = []
globalThis.audioResult = null
document.querySelector('button').addEventListener('click', async () => {
	const assertions = []
	try {
		await run({
			target: 'web',
			onCleanup: (callback) => cleanups.push(callback),
			assert(name, actual, expected) {
				if (!Object.is(actual, expected)) {
					throw new Error(`${name}: ${actual} != ${expected}`)
				}
				assertions.push(name)
			},
			record() {},
			async waitFor(predicate, { timeout = 5000, interval = 20 } = {}) {
				const until = Date.now() + timeout
				while (!predicate()) {
					if (Date.now() > until) {
						throw new Error('Timed out waiting for audio state')
					}

					await new Promise((resolve) => setTimeout(resolve, interval))
				}
			},
		})

		globalThis.audioResult = { assertions }
	} catch (error) {
		globalThis.audioResult = { error: error.stack ?? String(error) }
	} finally {
		for (const cleanup of cleanups.reverse()) {
			cleanup()
		}
	}
})
