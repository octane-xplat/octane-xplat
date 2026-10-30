import { run } from './incremental.ts'
globalThis.networkResult = null
document.querySelector('button').addEventListener('click', async () => {
	const assertions = []
	try {
		await run({
			target: 'web',
			record() {},
			assert(name, actual, expected) {
				if (!Object.is(actual, expected)) {
					throw new Error(`${name}: ${actual} != ${expected}`)
				}
				assertions.push(name)
			},
		})

		globalThis.networkResult = { assertions }
	} catch (error) {
		globalThis.networkResult = { error: error.stack ?? String(error) }
	}
})
