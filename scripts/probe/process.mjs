import { spawn } from 'node:child_process'

export function command(
	executable,
	args,
	{ cwd, env = process.env, input, timeout = 30000, allowFailure = false } = {},
) {
	return new Promise((resolve, reject) => {
		const child = spawn(executable, args, { cwd, env, stdio: ['pipe', 'pipe', 'pipe'] })
		let stdout = ''
		let stderr = ''
		let expired = false
		const timer = setTimeout(() => {
			expired = true
			child.kill('SIGKILL')
		}, timeout)

		child.stdout.on('data', (chunk) => {
			stdout = (stdout + chunk).slice(-128000)
		})

		child.stderr.on('data', (chunk) => {
			stderr = (stderr + chunk).slice(-128000)
		})

		child.stdin.on('error', () => {})
		child.stdin.end(input)
		child.once('error', (error) => {
			clearTimeout(timer)
			reject(error)
		})

		child.once('close', (code) => {
			clearTimeout(timer)
			if (expired || (code !== 0 && !allowFailure)) {
				reject(
					new Error(
						`${executable} ${expired ? 'timed out' : 'failed (' + code + ')'}: ${(stderr || stdout).slice(-6000)}`,
					),
				)
			} else {
				resolve({ code, stdout, stderr })
			}
		})
	})
}

export function ownedProcess(executable, args, options = {}) {
	const child = spawn(executable, args, {
		...options,
		detached: true,
		stdio: ['pipe', 'pipe', 'pipe'],
	})

	let tail = ''
	let failure
	const listeners = new Set()
	const closed = new Promise((resolve) => {
		child.once('error', (error) => {
			failure = error
			resolve()
		})

		child.once('close', (code, signal) => {
			failure ??= new Error(`Probe host exited (${signal ?? code}) before completion. ${tail}`)
			resolve()
		})
	})

	for (const stream of [child.stdout, child.stderr]) {
		let partial = ''
		stream.on('data', (chunk) => {
			const value = String(chunk)
			tail = (tail + value).slice(-6000)
			if (options.verbose) {
				process.stderr.write(value)
			}

			partial += value
			const lines = partial.split(/\r?\n/)
			partial = lines.pop()
			for (const line of lines) {
				for (const listener of listeners) {
					listener(line)
				}
			}
		})
	}

	child.stdin.on('error', () => {})
	const signal = (value) => {
		if (!child.pid) {
			return
		}

		try {
			process.kill(-child.pid, value)
		} catch (error) {
			if (error.code !== 'ESRCH') {
				throw error
			}
		}
	}

	return {
		child,
		closed,
		get tail() {
			return tail
		},
		get failure() {
			return failure
		},
		onLine(callback) {
			listeners.add(callback)
			return () => listeners.delete(callback)
		},
		async stop() {
			signal('SIGINT')
			let timer
			await Promise.race([
				closed,
				new Promise((resolve) => {
					timer = setTimeout(resolve, 4000)
				}),
			])

			clearTimeout(timer)
			signal('SIGKILL')
			await closed
		},
	}
}
