import assert from 'node:assert/strict'
import { spawn, spawnSync } from 'node:child_process'
import { createServer } from 'node:net'
import { createInterface } from 'node:readline'

// Maestro 2.11's normal tap/flow path captures screenshots for settling.
// Use only inspect_screen to start its driver, then the driver's AX and touch
// endpoints. Those endpoints were reviewed at the cli-2.11.0 source tag.
export async function createDialogDriver(device) {
	assert.equal(
		spawnSync('maestro', ['--version'], { encoding: 'utf8' }).stdout.trim(),
		'2.11.0',
		'Review a different Maestro version before using this nonvisual fixture',
	)
	const port = 22087
	const free = createServer()
	await new Promise((resolve, reject) => {
		free.once('error', reject)
		free.listen(port, '127.0.0.1', resolve)
	})
	await new Promise((resolve) => free.close(resolve))
	const child = spawn('maestro', ['mcp'], {
		stdio: ['pipe', 'pipe', 'pipe'],
		env: { ...process.env, MAESTRO_CLI_NO_ANALYTICS: 'true' },
	})
	let next = 0,
		diagnostics = ''
	const pending = new Map()
	child.stderr.on('data', (data) => {
		diagnostics = (diagnostics + data).slice(-12000)
	})
	createInterface({ input: child.stdout }).on('line', (line) => {
		if (!line.startsWith('{')) {
			return
		}
		let message
		try {
			message = JSON.parse(line)
		} catch {
			return
		}
		const entry = pending.get(message.id)
		if (!entry) {
			return
		}
		pending.delete(message.id)
		clearTimeout(entry.timer)
		if (message.error) {
			entry.reject(new Error(JSON.stringify(message.error)))
		} else {
			entry.resolve(message.result)
		}
	})
	child.on('exit', (code) => {
		for (const entry of pending.values()) {
			clearTimeout(entry.timer)
			entry.reject(new Error(`Maestro exited ${code}: ${diagnostics}`))
		}
		pending.clear()
	})
	function request(method, params) {
		return new Promise((resolve, reject) => {
			const id = ++next
			const timer = setTimeout(() => {
				pending.delete(id)
				reject(new Error(`Maestro ${method} timed out: ${diagnostics}`))
			}, 60000)
			pending.set(id, { resolve, reject, timer })
			child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n')
		})
	}
	try {
		await request('initialize', {
			protocolVersion: '2024-11-05',
			capabilities: {},
			clientInfo: { name: 'xplat-nonvisual-photos-fixture', version: '1' },
		})
		child.stdin.write(
			JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n',
		)
		const inspected = await request('tools/call', {
			name: 'inspect_screen',
			arguments: { device_id: device },
		})
		assert.ok(!inspected.isError, JSON.stringify(inspected))
		assert.ok(
			inspected.content.every((item) => item.type === 'text'),
			'This fixture accepts accessibility text only',
		)
	} catch (error) {
		child.kill('SIGTERM')
		throw error
	}
	const post = async (route, body) => {
		assert.ok(['viewHierarchy', 'touch'].includes(route))
		const response = await fetch(`http://127.0.0.1:${port}/${route}`, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(body),
			signal: AbortSignal.timeout(10000),
		})
		assert.ok(response.ok, `Driver ${route}: ${response.status}`)
		return route === 'viewHierarchy' ? response.json() : undefined
	}
	return {
		async hierarchy() {
			return post('viewHierarchy', { appIds: [], excludeKeyboardElements: false })
		},
		async tap(x, y) {
			return post('touch', { x, y })
		},
		close() {
			child.stdin.end()
			child.kill('SIGTERM')
		},
	}
}
