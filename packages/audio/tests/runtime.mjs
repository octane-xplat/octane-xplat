if (process.argv.includes('web')) {
	throw new Error(
		'Use turbo run test:browser --filter=@octane-xplat/audio for trusted-click web playback',
	)
}

import { spawn } from 'node:child_process'
import { createServer } from 'node:http'
import { fileURLToPath } from 'node:url'
import { audioResponse } from './fixture-server.mjs'
const server = createServer(audioResponse)
await new Promise((resolve, reject) => {
	server.once('error', reject)
	server.listen(19688, '0.0.0.0', resolve)
})

try {
	const child = spawn(
		'pnpm',
		[
			'probe',
			'run',
			'packages/audio/tests/incremental-queue.ts',
			'--deps',
			'@octane-xplat/audio',
			'--timeout',
			'60000',
			...process.argv.slice(2),
		],
		{ cwd: fileURLToPath(new URL('../../../', import.meta.url)), stdio: 'inherit' },
	)

	process.exitCode = await new Promise((resolve, reject) => {
		child.once('error', reject)
		child.once('exit', (code) => resolve(code ?? 1))
	})
} finally {
	server.closeAllConnections()
	await new Promise((resolve) => server.close(resolve))
}
