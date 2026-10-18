import { fork } from 'node:child_process'
import { once } from 'node:events'
import { fileURLToPath } from 'node:url'

export async function runLint(argv: string[]) {
	try {
		const runner = fileURLToPath(import.meta.resolve('@octane-xplat/lint/bin'))
		const [status, signal] = await once(fork(runner, argv, { stdio: 'inherit' }), 'exit')
		if (status === null) {
			throw new Error(`lint stopped by ${signal}`)
		}

		return status as number
	} catch (error) {
		console.error(`lint: ${error.message ?? error}`)
		return 2
	}
}
