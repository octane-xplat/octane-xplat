import { spawn } from 'node:child_process'

async function main(args: string[]): Promise<void> {
	if (args[0] === 'http') {
		try {
			const response = await fetch(args[1])
			console.log(JSON.stringify({ status: response.status, body: await response.text() }))
		} catch {
			console.error('HTTP request failed')
			process.exitCode = 5
		}
		return
	}

	// Absolute tool path: the native CLI must not substitute its own executable
	// for the project's runtime. This is an isolated probe, not a public command.
	const child = spawn(args[1], args.slice(2), { stdio: 'inherit' })
	process.on('SIGTERM', () => child.kill('SIGTERM'))
	process.on('SIGINT', () => child.kill('SIGINT'))
	child.on('error', () => {
		console.error('Child launch failed')
		process.exitCode = 5
	})
	child.on('exit', (code, signal) => {
		process.exitCode = signal === 'SIGTERM' ? 143 : signal === 'SIGINT' ? 130 : (code ?? 5)
	})
}

export function runIo(args: string[]): void {
	main(args).catch(() => {
		console.error('Probe failed')
		process.exitCode = 5
	})
}
