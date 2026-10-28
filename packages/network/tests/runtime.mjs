import { spawn } from 'node:child_process'
import { createServer } from 'node:http'
import { fileURLToPath } from 'node:url'
import { networkResponse } from './fixture-server.mjs'

if (process.argv.includes('web')) {
	await import('./browser.mjs')
} else {
	const server = createServer(networkResponse)

	await new Promise((resolve, reject) => {
		server.once('error', reject)
		server.listen(19687, '0.0.0.0', resolve)
	})

	try {
		const child = spawn(
			'pnpm',
			[
				'probe',
				'run',
				'packages/network/tests/incremental.ts',
				'--deps',
				'@octane-xplat/network',
				...process.argv.slice(2),
			],
			{
				cwd: fileURLToPath(new URL('../../../', import.meta.url)),
				stdio: 'inherit',
			},
		)

		process.exitCode = await new Promise((resolve, reject) => {
			child.once('error', reject)
			child.once('exit', (code) => resolve(code ?? 1))
		})
	} finally {
		server.closeAllConnections()
		await new Promise((resolve) => server.close(resolve))
	}
}
